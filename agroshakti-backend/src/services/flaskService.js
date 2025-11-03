const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { FLASK_ENDPOINTS } = require('../config/constants');

const FLASK_ML_BASE = process.env.FLASK_ML_BASE_URL || 'http://localhost:8000';
const FLASK_DISEASE_BASE = process.env.FLASK_DISEASE_DETECTION_URL || 'http://localhost:8001';

class FlaskService {
  
  async callChatbot(message, sessionId) {
    try {
      const response = await axios.post(`${FLASK_ML_BASE}${FLASK_ENDPOINTS.CHATBOT}`, {
        message,
        session_id: sessionId
      }, {
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      console.error('Flask Chatbot Error:', error.message);
      throw new Error('Failed to get response from chatbot service');
    }
  }

  async analyzeSoil(soilData) {
    try {
      const response = await axios.post(`${FLASK_ML_BASE}${FLASK_ENDPOINTS.SOIL_ANALYSIS}`, soilData, {
        timeout: 15000
      });
      return response.data;
    } catch (error) {
      console.error('Flask Soil Analysis Error:', error.message);
      throw new Error('Failed to analyze soil data');
    }
  }

  async estimateResources(resourceData) {
    try {
      const response = await axios.post(`${FLASK_ML_BASE}${FLASK_ENDPOINTS.RESOURCE_ESTIMATE}`, resourceData, {
        timeout: 15000
      });
      return response.data;
    } catch (error) {
      console.error('Flask Resource Estimation Error:', error.message);
      throw new Error('Failed to estimate resources');
    }
  }

  async getWeatherAdvisory(weatherData) {
    try {
      const response = await axios.post(`${FLASK_ML_BASE}${FLASK_ENDPOINTS.WEATHER_ADVISORY}`, weatherData, {
        timeout: 15000
      });
      return response.data;
    } catch (error) {
      console.error('Flask Weather Advisory Error:', error.message);
      throw new Error('Failed to get weather advisory');
    }
  }

  async searchSchemes(query) {
    try {
      const response = await axios.post(`${FLASK_ML_BASE}${FLASK_ENDPOINTS.SCHEME_RECOMMENDATIONS}`, query, {
        timeout: 15000
      });
      return response.data;
    } catch (error) {
      console.error('Flask Scheme Search Error:', error.message);
      throw new Error('Failed to search schemes');
    }
  }

  async detectDisease(imagePath) {
    try {
      const formData = new FormData();
      formData.append('image', fs.createReadStream(imagePath));

      const response = await axios.post(`${FLASK_DISEASE_BASE}${FLASK_ENDPOINTS.DISEASE_DETECTION}`, formData, {
        headers: formData.getHeaders(),
        timeout: 30000
      });
      
      return response.data;
    } catch (error) {
      console.error('Flask Disease Detection Error:', error.message);
      throw new Error('Failed to detect disease');
    }
  }

  async getDiseaseCure(diseaseInfo) {
    try {
      const response = await axios.post(`${FLASK_ML_BASE}${FLASK_ENDPOINTS.DISEASE_CURE}`, diseaseInfo, {
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      console.error('Flask Disease Cure Error:', error.message);
      throw new Error('Failed to get disease cure recommendation');
    }
  }
}

module.exports = new FlaskService();