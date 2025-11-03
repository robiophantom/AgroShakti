const pool = require('../config/database');
const { REPORT_STATUS } = require('../config/constants');

class FeedbackController {
  
  async submitFeedback(req, res) {
    const client = await pool.connect();
    try {
      const { feature_type, rating, comment } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating is required and must be between 1 and 5'
        });
      }

      const result = await client.query(
        `INSERT INTO feedback (user_id, feature_type, rating, comment) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [req.user.userId, feature_type, rating, comment]
      );

      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Submit Feedback Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit feedback'
      });
    } finally {
      client.release();
    }
  }

  async getAllFeedback(req, res) {
    const client = await pool.connect();
    try {
      const { feature_type, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let query = `SELECT f.*, u.name as user_name, u.email as user_email 
                   FROM feedback f 
                   JOIN users u ON f.user_id = u.id 
                   WHERE 1=1`;
      const params = [];
      let paramCount = 0;

      if (feature_type) {
        paramCount++;
        query += ` AND f.feature_type = $${paramCount}`;
        params.push(feature_type);
      }

      query += ` ORDER BY f.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      const countQuery = feature_type 
        ? `SELECT COUNT(*) FROM feedback WHERE feature_type = '${feature_type}'`
        : 'SELECT COUNT(*) FROM feedback';
      
      const countResult = await client.query(countQuery);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          feedback: result.rows,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get All Feedback Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback'
      });
    } finally {
      client.release();
    }
  }

  async submitReport(req, res) {
    const client = await pool.connect();
    try {
      const { report_type, description } = req.body;

      if (!description) {
        return res.status(400).json({
          success: false,
          message: 'Description is required'
        });
      }

      const result = await client.query(
        `INSERT INTO reports (user_id, report_type, description) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [req.user.userId, report_type, description]
      );

      res.status(201).json({
        success: true,
        message: 'Report submitted successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Submit Report Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit report'
      });
    } finally {
      client.release();
    }
  }

  async getAllReports(req, res) {
    const client = await pool.connect();
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let query = `SELECT r.*, u.name as user_name, u.email as user_email,
                   admin.name as resolved_by_name
                   FROM reports r 
                   JOIN users u ON r.user_id = u.id 
                   LEFT JOIN users admin ON r.resolved_by = admin.id
                   WHERE 1=1`;
      const params = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        query += ` AND r.status = $${paramCount}`;
        params.push(status);
      }

      query += ` ORDER BY r.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      const countQuery = status 
        ? `SELECT COUNT(*) FROM reports WHERE status = '${status}'`
        : 'SELECT COUNT(*) FROM reports';
      
      const countResult = await client.query(countQuery);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          reports: result.rows,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get All Reports Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reports'
      });
    } finally {
      client.release();
    }
  }

  async resolveReport(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || ![REPORT_STATUS.RESOLVED, REPORT_STATUS.REJECTED].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid status (resolved/rejected) is required'
        });
      }

      const result = await client.query(
        `UPDATE reports 
         SET status = $1, resolved_by = $2, resolved_at = CURRENT_TIMESTAMP 
         WHERE id = $3 
         RETURNING *`,
        [status, req.user.userId, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      res.json({
        success: true,
        message: 'Report updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Resolve Report Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resolve report'
      });
    } finally {
      client.release();
    }
  }
}

module.exports = new FeedbackController();