const pool = require('../config/database');
const cloudinaryService = require('../services/r2Service'); // We're reusing the same artifact ID

class SurveyController {
  
  async createSurvey(req, res) {
    const client = await pool.connect();
    try {
      const { title, description, week_number, year, ends_at } = req.body;

      if (!title || !week_number || !year || !ends_at) {
        return res.status(400).json({
          success: false,
          message: 'Title, week_number, year, and ends_at are required'
        });
      }

      const surveyId = `SURVEY_W${week_number}_${year}_${Date.now()}`;

      const result = await client.query(
        `INSERT INTO surveys (survey_id, title, description, week_number, year, ends_at) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [surveyId, title, description, week_number, year, ends_at]
      );

      res.status(201).json({
        success: true,
        message: 'Survey created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Create Survey Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create survey'
      });
    } finally {
      client.release();
    }
  }

  async getActiveSurvey(req, res) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM surveys 
         WHERE is_active = true 
         AND ends_at > NOW() 
         ORDER BY created_at DESC 
         LIMIT 1`
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No active survey found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Get Active Survey Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active survey'
      });
    } finally {
      client.release();
    }
  }

  async getAllSurveys(req, res) {
    const client = await pool.connect();
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const result = await client.query(
        'SELECT * FROM surveys ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );

      const countResult = await client.query('SELECT COUNT(*) FROM surveys');
      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          surveys: result.rows,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get All Surveys Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch surveys'
      });
    } finally {
      client.release();
    }
  }

  async submitResponse(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { disease_name, cure_description, why_description } = req.body;

      if (!disease_name || !cure_description || !why_description) {
        return res.status(400).json({
          success: false,
          message: 'Disease name, cure description, and why description are required'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Disease image is required'
        });
      }

      const surveyResult = await client.query(
        'SELECT * FROM surveys WHERE id = $1 AND is_active = true AND ends_at > NOW()',
        [id]
      );

      if (surveyResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Survey not found or has ended'
        });
      }

      // Upload image to Cloudinary
      const uploadResult = await cloudinaryService.uploadImage(req.file.buffer, `surveys/${id}`);

      const result = await client.query(
        `INSERT INTO survey_responses (survey_id, user_id, disease_name, image_url, cure_description, why_description) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [id, req.user.userId, disease_name, uploadResult.url, cure_description, why_description]
      );

      res.status(201).json({
        success: true,
        message: 'Survey response submitted successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Submit Response Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit survey response'
      });
    } finally {
      client.release();
    }
  }

  async getSurveyResponses(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const result = await client.query(
        `SELECT sr.*, u.name as user_name, u.email as user_email 
         FROM survey_responses sr 
         JOIN users u ON sr.user_id = u.id 
         WHERE sr.survey_id = $1 
         ORDER BY sr.submitted_at DESC 
         LIMIT $2 OFFSET $3`,
        [id, limit, offset]
      );

      const countResult = await client.query(
        'SELECT COUNT(*) FROM survey_responses WHERE survey_id = $1',
        [id]
      );
      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          responses: result.rows,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get Survey Responses Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch survey responses'
      });
    } finally {
      client.release();
    }
  }
}

module.exports = new SurveyController();