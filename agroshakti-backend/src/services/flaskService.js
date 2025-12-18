const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { FLASK_ENDPOINTS } = require('../config/constants');

const FLASK_ML_BASE = process.env.FLASK_ML_BASE_URL || 'http://localhost:8000';
const FLASK_DISEASE_BASE = process.env.FLASK_DISEASE_DETECTION_URL || 'http://localhost:8001';


class FlaskService {
  /* =======================
     PRIMARY FLASK CHATBOT
     ======================= */
  async callChatbot(message, sessionId) {
    try {
      const response = await axios.post(
        `${FLASK_ML_BASE}${FLASK_ENDPOINTS.CHATBOT}`,
        { message, session_id: sessionId },
        { timeout: 60000 }
      );
      return response.data;
    } catch (error) {
      console.error('⚠️ Flask Chatbot Error:', error.message);
    }
  }

  /* =======================
     SOIL ANALYSIS
     ======================= */
  async analyzeSoil(soilData) {
    try {
      const response = await axios.post(
        `${FLASK_ML_BASE}${FLASK_ENDPOINTS.SOIL_ANALYSIS}`,
        soilData,
        { timeout: 15000 }
      );
      return response.data;
    } catch (error) {
      console.error('Flask Soil Analysis Error:', error.message);
      throw new Error('Failed to analyze soil data');
    }
  }

  async estimateResources(resourceData) {
    try {
      const response = await axios.post(
        `${FLASK_ML_BASE}${FLASK_ENDPOINTS.RESOURCE_ESTIMATE}`,
        resourceData,
        { timeout: 15000 }
      );
      return response.data;
    } catch (error) {
      console.error('Flask Resource Estimation Error:', error.message);
      throw new Error('Failed to estimate resources');
    }
  }

  async getWeatherAdvisory(weatherData) {
    try {
      const response = await axios.post(
        `${FLASK_ML_BASE}${FLASK_ENDPOINTS.WEATHER_ADVISORY}`,
        weatherData,
        { timeout: 15000 }
      );
      return response.data;
    } catch (error) {
      console.error('Flask Weather Advisory Error:', error.message);
      throw new Error('Failed to get weather advisory');
    }
  }

  async searchSchemes(query) {
    try {
      const response = await axios.post(
        `${FLASK_ML_BASE}${FLASK_ENDPOINTS.SCHEME_RECOMMENDATIONS}`,
        query,
        { timeout: 15000 }
      );
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

      const response = await axios.post(
        `${FLASK_DISEASE_BASE}${FLASK_ENDPOINTS.DISEASE_DETECTION}`,
        formData,
        { headers: formData.getHeaders(), timeout: 30000 }
      );

      return response.data;
    } catch (error) {
      console.error('Flask Disease Detection Error:', error.message);
      throw new Error('Failed to detect disease');
    }
  }

  async getDiseaseCure(diseaseInfo) {
    /**
     * NEW BEHAVIOUR:
     * We no longer call a separate /disease-cure endpoint.
     * Instead, we reuse the same LLM chatbot endpoint (/chatbot on port 8000)
     * and send a carefully constructed question string.
     */
    const { disease_name, confidence, image_url } = diseaseInfo || {};

    const prompt = `
A vision model has detected the following on the farmer's crop:
- Disease name: ${disease_name || 'Unknown'}
- Confidence score: ${typeof confidence === 'number' ? confidence.toFixed(3) : 'N/A'}
${image_url ? `- Image URL (for reference): ${image_url}` : ''}

Based on this, provide a clear, practical cure recommendation
1) Explain what this disease is in 2–3 lines
2)List step-by-step treatment actions (exact sprays/chemicals or organic options, with dosage if known)
3) Mention precautions and follow-up monitoring
4)If the diagnosis might be wrong, mention what the farmer should double-check.

give answer in less than 1000 tokens complete for this cure
`.trim();

    const sessionId = `disease_cure_${Date.now()}`;

    try {
      const result = await this.callChatbot(prompt, sessionId);
      const text = result?.response || result;
      console.log(text)
      return {
        cure_recommendation: text
      };
    } catch (error) {
      console.error('Flask Disease Cure via Chatbot Error:', error.message);
      throw new Error('Failed to get disease cure recommendation');
    }
  }
}

module.exports = new FlaskService();