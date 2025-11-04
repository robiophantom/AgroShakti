const pool = require('../config/database');

class HistoryController {
  
  async getChatHistory(req, res) {
    const client = await pool.connect();
    try {
      const { session_id, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM chat_history WHERE user_id = $1';
      const params = [req.user.userId];

      if (session_id) {
        query += ' AND session_id = $2';
        params.push(session_id);
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);

      const result = await client.query(query, params);

      const countQuery = session_id 
        ? 'SELECT COUNT(*) FROM chat_history WHERE user_id = $1 AND session_id = $2'
        : 'SELECT COUNT(*) FROM chat_history WHERE user_id = $1';
      
      const countParams = session_id ? [req.user.userId, session_id] : [req.user.userId];
      const countResult = await client.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          history: result.rows,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get Chat History Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chat history'
      });
    } finally {
      client.release();
    }
  }

  async getDiseaseHistory(req, res) {
    const client = await pool.connect();
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const result = await client.query(
        `SELECT * FROM disease_detections 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [req.user.userId, limit, offset]
      );

      const countResult = await client.query(
        'SELECT COUNT(*) FROM disease_detections WHERE user_id = $1',
        [req.user.userId]
      );
      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          history: result.rows,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get Disease History Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch disease detection history'
      });
    } finally {
      client.release();
    }
  }

  async getSoilHistory(req, res) {
    const client = await pool.connect();
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const result = await client.query(
        `SELECT * FROM soil_data 
         WHERE user_id = $1 
         ORDER BY recorded_at DESC 
         LIMIT $2 OFFSET $3`,
        [req.user.userId, limit, offset]
      );

      const countResult = await client.query(
        'SELECT COUNT(*) FROM soil_data WHERE user_id = $1',
        [req.user.userId]
      );
      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          history: result.rows,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get Soil History Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch soil data history'
      });
    } finally {
      client.release();
    }
  }

  async getWeatherHistory(req, res) {
    const client = await pool.connect();
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const result = await client.query(
        `SELECT * FROM weather_queries 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [req.user.userId, limit, offset]
      );

      const countResult = await client.query(
        'SELECT COUNT(*) FROM weather_queries WHERE user_id = $1',
        [req.user.userId]
      );
      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          history: result.rows,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get Weather History Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weather query history'
      });
    } finally {
      client.release();
    }
  }

  async getResourceHistory(req, res) {
    const client = await pool.connect();
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const result = await client.query(
        `SELECT * FROM resource_estimations 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [req.user.userId, limit, offset]
      );

      const countResult = await client.query(
        'SELECT COUNT(*) FROM resource_estimations WHERE user_id = $1',
        [req.user.userId]
      );
      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        data: {
          history: result.rows,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get Resource History Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch resource estimation history'
      });
    } finally {
      client.release();
    }
  }
}

module.exports = new HistoryController();