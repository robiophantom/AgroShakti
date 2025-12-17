const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { ROLES } = require('../config/constants');

class AuthController {
  
  async register(req, res) {
    const client = await pool.connect();
    try {
      const { name, email, phone, password, role, language_preference, location } = req.body;

      if (!name || !email || !phone || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, phone, and password are required'
        });
      }

      const userRole = role || ROLES.FARMER;
      if (![ROLES.FARMER, ROLES.ADMIN].includes(userRole)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await client.query(
        `INSERT INTO users (name, email, phone, password_hash, role, language_preference, location) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id, name, email, phone, role, language_preference, location, created_at`,
        [name, email, phone, hashedPassword, userRole, language_preference, location]
      );

      const user = result.rows[0];

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user
      });
    } catch (error) {
      console.error('Register Error:', error);
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Email or phone already exists'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to register user'
      });
    } finally {
      client.release();
    }
  }

  async login(req, res) {
    const client = await pool.connect();
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      const result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const user = result.rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      const refreshToken = generateRefreshToken({
        userId: user.id
      });

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await client.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, refreshToken, expiresAt]
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            language_preference: user.language_preference,
            location: user.location
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to login'
      });
    } finally {
      client.release();
    }
  }

  async refreshToken(req, res) {
    const client = await pool.connect();
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token'
        });
      }

      const result = await client.query(
        'SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND expires_at > NOW()',
        [refreshToken, decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      const userResult = await client.query(
        'SELECT id, email, role FROM users WHERE id = $1',
        [decoded.userId]
      );

      const user = userResult.rows[0];
      const newAccessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken
        }
      });
    } catch (error) {
      console.error('Refresh Token Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh token'
      });
    } finally {
      client.release();
    }
  }

  async logout(req, res) {
    const client = await pool.connect();
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await client.query(
          'DELETE FROM refresh_tokens WHERE token = $1',
          [refreshToken]
        );
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to logout'
      });
    } finally {
      client.release();
    }
  }

  async getMe(req, res) {
    const client = await pool.connect();
    try {
      // Try to include avatar column, handle gracefully if it doesn't exist
      let result;
      try {
        result = await client.query(
          'SELECT id, name, email, phone, role, language_preference, location, avatar, created_at FROM users WHERE id = $1',
          [req.user.userId]
        );
      } catch (columnError) {
        // If avatar column doesn't exist, select without it
        if (columnError.code === '42703') {
          result = await client.query(
            'SELECT id, name, email, phone, role, language_preference, location, created_at FROM users WHERE id = $1',
            [req.user.userId]
          );
          // Add default avatar to result
          if (result.rows.length > 0) {
            result.rows[0].avatar = 'farmer1';
          }
        } else {
          throw columnError;
        }
      }

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Ensure avatar has a default value
      if (!result.rows[0].avatar) {
        result.rows[0].avatar = 'farmer1';
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Get Me Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile'
      });
    } finally {
      client.release();
    }
  }

  async updateProfile(req, res) {
    const client = await pool.connect();
    try {
      const { name, phone, language_preference, location, avatar } = req.body;
      const userId = req.user.userId;

      // Check if avatar column exists, if not, we'll add it dynamically
      // For now, we'll try to update it and handle gracefully if column doesn't exist
      let result;
      try {
        result = await client.query(
          `UPDATE users 
           SET name = COALESCE($1, name),
               phone = COALESCE($2, phone),
               language_preference = COALESCE($3, language_preference),
               location = COALESCE($4, location),
               avatar = COALESCE($5, avatar),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $6
           RETURNING id, name, email, phone, role, language_preference, location, avatar`,
          [name, phone, language_preference, location, avatar, userId]
        );
      } catch (columnError) {
        // If avatar column doesn't exist, update without it
        if (columnError.code === '42703') {
          // Column doesn't exist, add it first
          await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(50) DEFAULT \'farmer1\'');
          // Retry the update
          result = await client.query(
            `UPDATE users 
             SET name = COALESCE($1, name),
                 phone = COALESCE($2, phone),
                 language_preference = COALESCE($3, language_preference),
                 location = COALESCE($4, location),
                 avatar = COALESCE($5, avatar),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $6
             RETURNING id, name, email, phone, role, language_preference, location, avatar`,
            [name, phone, language_preference, location, avatar, userId]
          );
        } else {
          throw columnError;
        }
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Update Profile Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    } finally {
      client.release();
    }
  }

  async deleteAccount(req, res) {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM users WHERE id = $1', [req.user.userId]);

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete Account Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete account'
      });
    } finally {
      client.release();
    }
  }
}

module.exports = new AuthController();