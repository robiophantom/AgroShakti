const pool = require('../config/database');
const { ROLES } = require('../config/constants');

class AdminController {
  
  async getStats(req, res) {
    const client = await pool.connect();
    try {
      const usersCount = await client.query('SELECT COUNT(*) FROM users');
      const farmersCount = await client.query("SELECT COUNT(*) FROM users WHERE role = 'farmer'");
      const adminsCount = await client.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
      const schemesCount = await client.query('SELECT COUNT(*) FROM schemes WHERE is_active = true');
      const activeSurveysCount = await client.query('SELECT COUNT(*) FROM surveys WHERE is_active = true AND ends_at > NOW()');
      const totalFeedback = await client.query('SELECT COUNT(*) FROM feedback');
      const pendingReports = await client.query("SELECT COUNT(*) FROM reports WHERE status = 'pending'");
      const diseaseDetections = await client.query('SELECT COUNT(*) FROM disease_detections');
      const chatInteractions = await client.query('SELECT COUNT(*) FROM chat_history');

      const avgRating = await client.query('SELECT AVG(rating) as avg_rating FROM feedback');

      res.json({
        success: true,
        data: {
          users: {
            total: parseInt(usersCount.rows[0].count),
            farmers: parseInt(farmersCount.rows[0].count),
            admins: parseInt(adminsCount.rows[0].count)
          },
          schemes: {
            active: parseInt(schemesCount.rows[0].count)
          },
          surveys: {
            active: parseInt(activeSurveysCount.rows[0].count)
          },
          feedback: {
            total: parseInt(totalFeedback.rows[0].count),
            average_rating: parseFloat(avgRating.rows[0].avg_rating || 0).toFixed(2)
          },
          reports: {
            pending: parseInt(pendingReports.rows[0].count)
          },
          ai_usage: {
            disease_detections: parseInt(diseaseDetections.rows[0].count),
            chat_interactions: parseInt(chatInteractions.rows[0].count)
          }
        }
      });
    } catch (error) {
      console.error('Get Stats Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics'
      });
    } finally {
      client.release();
    }
  }

  async getAllUsers(req, res) {
    const client = await pool.connect();
    try {
      const { role, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let query = 'SELECT id, name, email, phone, role, language_preference, location, created_at FROM users WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (role) {
        paramCount++;
        query += ` AND role = $${paramCount}`;
        params.push(role);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      const countQuery = role 
        ? `SELECT COUNT(*) FROM users WHERE role = '${role}'`
        : 'SELECT COUNT(*) FROM users';
      
      const countResult = await client.query(countQuery);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          users: result.rows,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get All Users Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    } finally {
      client.release();
    }
  }

  async changeUserRole(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || ![ROLES.FARMER, ROLES.ADMIN].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Valid role (farmer/admin) is required'
        });
      }

      const result = await client.query(
        `UPDATE users 
         SET role = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING id, name, email, role`,
        [role, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Change User Role Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change user role'
      });
    } finally {
      client.release();
    }
  }

  async deleteUser(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;

      if (parseInt(id) === req.user.userId) {
        return res.status(400).json({
          success: false,
          message: 'You cannot delete your own account from admin panel'
        });
      }

      const result = await client.query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete User Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    } finally {
      client.release();
    }
  }
}

module.exports = new AdminController();