const pool = require('../config/database');
const flaskService = require('../services/flaskService');
const cloudinaryService = require('../services/r2Service');
const { HOOK_TYPES } = require('../config/constants');
const fs = require('fs');
const path = require('path');
const os = require('os');

class HooksController {
  
  // Hook 1: Chatbot (Core LLM)
  async chatbot(req, res) {
    const client = await pool.connect();
    try {
      const { message, session_id } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      const sessionId = session_id || `session_${req.user.userId}_${Date.now()}`;

      const flaskResponse = await flaskService.callChatbot(message, sessionId);

      await client.query(
        `INSERT INTO chat_history (user_id, session_id, message, response, hook_type) 
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.userId, sessionId, message, flaskResponse.response || JSON.stringify(flaskResponse), HOOK_TYPES.CHATBOT]
      );

      res.json({
        success: true,
        data: {
          response: flaskResponse.response || flaskResponse,
          session_id: sessionId
        }
      });
    } catch (error) {
      console.error('Chatbot Hook Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process chatbot request'
      });
    } finally {
      client.release();
    }
  }

  // Hook 2: Soil Information via IoT
  async soilAnalysis(req, res) {
    const client = await pool.connect();
    try {
      const { device_id, ph_level, nitrogen, phosphorus, potassium, moisture, temperature } = req.body;

      if (!ph_level || !nitrogen || !phosphorus || !potassium) {
        return res.status(400).json({
          success: false,
          message: 'Ph level, nitrogen, phosphorus, and potassium are required'
        });
      }

      const soilData = {
        ph_level,
        nitrogen,
        phosphorus,
        potassium,
        moisture,
        temperature
      };

      const flaskResponse = await flaskService.analyzeSoil(soilData);

      await client.query(
        `INSERT INTO soil_data (user_id, device_id, ph_level, nitrogen, phosphorus, potassium, moisture, temperature, recommendation) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [req.user.userId, device_id, ph_level, nitrogen, phosphorus, potassium, moisture, temperature, 
         flaskResponse.recommendation || JSON.stringify(flaskResponse)]
      );

      res.json({
        success: true,
        data: flaskResponse
      });
    } catch (error) {
      console.error('Soil Analysis Hook Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to analyze soil data'
      });
    } finally {
      client.release();
    }
  }

  // Hook 3: Resource Estimation
  async resourceEstimation(req, res) {
    const client = await pool.connect();
    try {
      const { crop_name, land_area, land_unit, soil_quality } = req.body;

      if (!crop_name || !land_area) {
        return res.status(400).json({
          success: false,
          message: 'Crop name and land area are required'
        });
      }

      const resourceData = {
        crop_name,
        land_area,
        land_unit: land_unit || 'acres',
        soil_quality
      };

      const flaskResponse = await flaskService.estimateResources(resourceData);

      await client.query(
        `INSERT INTO resource_estimations (user_id, crop_name, land_area, land_unit, soil_quality, estimated_fertilizer, estimated_water, other_resources, advice) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [req.user.userId, crop_name, land_area, land_unit || 'acres', soil_quality,
         flaskResponse.estimated_fertilizer, flaskResponse.estimated_water, 
         flaskResponse.other_resources, flaskResponse.advice]
      );

      res.json({
        success: true,
        data: flaskResponse
      });
    } catch (error) {
      console.error('Resource Estimation Hook Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to estimate resources'
      });
    } finally {
      client.release();
    }
  }

  // Hook 4: Weather & Market Advisory
  async weatherAdvisory(req, res) {
    const client = await pool.connect();
    try {
      const { location, crop } = req.body;

      if (!location) {
        return res.status(400).json({
          success: false,
          message: 'Location is required'
        });
      }

      const weatherData = {
        location,
        crop
      };

      const flaskResponse = await flaskService.getWeatherAdvisory(weatherData);

      await client.query(
        `INSERT INTO weather_queries (user_id, location, weather_data, market_prices, crop_suitability) 
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.userId, location, 
         JSON.stringify(flaskResponse.weather_data || {}), 
         JSON.stringify(flaskResponse.market_prices || {}),
         flaskResponse.crop_suitability]
      );

      res.json({
        success: true,
        data: flaskResponse
      });
    } catch (error) {
      console.error('Weather Advisory Hook Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get weather advisory'
      });
    } finally {
      client.release();
    }
  }

  // Hook 5: Government Schemes Search via ML
  async schemeSearch(req, res) {
    try {
      const { query, filters } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const searchData = {
        query,
        filters: filters || {}
      };

      const flaskResponse = await flaskService.searchSchemes(searchData);

      res.json({
        success: true,
        data: flaskResponse
      });
    } catch (error) {
      console.error('Scheme Search Hook Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search schemes'
      });
    }
  }

  // Hook 6: Disease Detection (calls :8001 first, then :8000 if successful)
  async diseaseDetection(req, res) {
    const client = await pool.connect();
    let tempFilePath = null;
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Image is required'
        });
      }

      // Create temporary file for Flask service (it needs file path)
      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, `disease_${Date.now()}_${req.file.originalname}`);
      fs.writeFileSync(tempFilePath, req.file.buffer);

      // Step 1: Call Flask :8001 for disease detection
      const detectionResponse = await flaskService.detectDisease(tempFilePath);

      let cureRecommendation = null;
      let detectionSuccessful = false;
      let cloudinaryUrl = null;

      // Step 2: If disease detected, upload to Cloudinary and get cure
      if (detectionResponse.detected && detectionResponse.disease) {
        detectionSuccessful = true;
        
        // Upload image to Cloudinary
        const uploadResult = await cloudinaryService.uploadImage(req.file.buffer, 'disease-detection');
        cloudinaryUrl = uploadResult.url;

        const diseaseInfo = {
          disease_name: detectionResponse.disease,
          confidence: detectionResponse.confidence,
          image_url: cloudinaryUrl
        };

        const cureResponse = await flaskService.getDiseaseCure(diseaseInfo);
        cureRecommendation = cureResponse.cure_recommendation || JSON.stringify(cureResponse);
      } else {
        // Upload anyway for record keeping
        const uploadResult = await cloudinaryService.uploadImage(req.file.buffer, 'disease-detection');
        cloudinaryUrl = uploadResult.url;
      }

      // Save to database
      await client.query(
        `INSERT INTO disease_detections (user_id, image_url, detected_disease, confidence_score, cure_recommendation, detection_successful) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.user.userId, cloudinaryUrl, detectionResponse.disease, detectionResponse.confidence, 
         cureRecommendation, detectionSuccessful]
      );

      res.json({
        success: true,
        data: {
          detection: detectionResponse,
          cure: detectionSuccessful ? cureRecommendation : null,
          image_url: cloudinaryUrl,
          message: detectionSuccessful 
            ? 'Disease detected and cure recommendation provided' 
            : 'No disease detected or image unclear'
        }
      });
    } catch (error) {
      console.error('Disease Detection Hook Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to detect disease'
      });
    } finally {
      // Clean up temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      client.release();
    }
  }
}

module.exports = new HooksController();