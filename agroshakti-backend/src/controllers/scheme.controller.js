const pool = require('../config/database');

class SchemeController {
  
  async createScheme(req, res) {
    const client = await pool.connect();
    try {
      const { title, description, eligibility, how_to_apply, last_date, benefits, category, state } = req.body;

      if (!title || !description || !eligibility || !how_to_apply) {
        return res.status(400).json({
          success: false,
          message: 'Title, description, eligibility, and how_to_apply are required'
        });
      }

      const result = await client.query(
        `INSERT INTO schemes (title, description, eligibility, how_to_apply, last_date, benefits, uploaded_by, category, state) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING *`,
        [title, description, eligibility, how_to_apply, last_date, benefits, req.user.userId, category, state]
      );

      res.status(201).json({
        success: true,
        message: 'Scheme created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Create Scheme Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create scheme'
      });
    } finally {
      client.release();
    }
  }

  async getSchemes(req, res) {
    const client = await pool.connect();
    try {
      const { category, state, is_active, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM schemes WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (category) {
        paramCount++;
        query += ` AND category = $${paramCount}`;
        params.push(category);
      }

      if (state) {
        paramCount++;
        query += ` AND state = $${paramCount}`;
        params.push(state);
      }

      if (is_active !== undefined) {
        paramCount++;
        query += ` AND is_active = $${paramCount}`;
        params.push(is_active === 'true');
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      const countQuery = 'SELECT COUNT(*) FROM schemes WHERE 1=1' + 
        (category ? ` AND category = '${category}'` : '') +
        (state ? ` AND state = '${state}'` : '') +
        (is_active !== undefined ? ` AND is_active = ${is_active === 'true'}` : '');
      
      const countResult = await client.query(countQuery);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          schemes: result.rows,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get Schemes Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch schemes'
      });
    } finally {
      client.release();
    }
  }

  async getSchemeById(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;

      const result = await client.query(
        'SELECT * FROM schemes WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Scheme not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Get Scheme Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch scheme'
      });
    } finally {
      client.release();
    }
  }

  async updateScheme(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { title, description, eligibility, how_to_apply, last_date, benefits, category, state, is_active } = req.body;

      const result = await client.query(
        `UPDATE schemes 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             eligibility = COALESCE($3, eligibility),
             how_to_apply = COALESCE($4, how_to_apply),
             last_date = COALESCE($5, last_date),
             benefits = COALESCE($6, benefits),
             category = COALESCE($7, category),
             state = COALESCE($8, state),
             is_active = COALESCE($9, is_active),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $10
         RETURNING *`,
        [title, description, eligibility, how_to_apply, last_date, benefits, category, state, is_active, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Scheme not found'
        });
      }

      res.json({
        success: true,
        message: 'Scheme updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Update Scheme Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update scheme'
      });
    } finally {
      client.release();
    }
  }

  async deleteScheme(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;

      const result = await client.query(
        'DELETE FROM schemes WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Scheme not found'
        });
      }

      res.json({
        success: true,
        message: 'Scheme deleted successfully'
      });
    } catch (error) {
      console.error('Delete Scheme Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete scheme'
      });
    } finally {
      client.release();
    }
  }

  async searchSchemes(req, res) {
    const client = await pool.connect();
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const result = await client.query(
        `SELECT * FROM schemes 
         WHERE is_active = true 
         AND (
           title ILIKE $1 
           OR description ILIKE $1 
           OR category ILIKE $1
           OR state ILIKE $1
         )
         ORDER BY created_at DESC`,
        [`%${query}%`]
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Search Schemes Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search schemes'
      });
    } finally {
      client.release();
    }
  }
}

module.exports = new SchemeController();