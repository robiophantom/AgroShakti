const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { FLASK_ENDPOINTS } = require('../config/constants');

const FLASK_ML_BASE = process.env.FLASK_ML_BASE_URL || 'http://localhost:8000';
const FLASK_DISEASE_BASE = process.env.FLASK_DISEASE_DETECTION_URL || 'http://localhost:8001';

// AI Fallback Configuration
const AI_FALLBACK_PROVIDER = process.env.AI_FALLBACK_PROVIDER || 'gemini';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

class FlaskService {
  /* =======================
     AI FALLBACK HANDLERS
     ======================= */
  
  async callGroqFallback(message, sessionId) {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
      throw new Error('Groq API key not configured');
    }

    try {
      console.log('🤖 Calling Groq API with key:', GROQ_API_KEY.substring(0, 10) + '...');
      
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'You are AgroShakti AI, a helpful agricultural assistant. Provide practical farming advice, answer questions about crops, soil, weather, diseases, and agricultural practices in a friendly and informative manner.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      console.log('✅ Groq API Success!');
      
      return {
        response: response.data.choices[0].message.content,
        session_id: sessionId,
        fallback_used: 'groq',
        model: 'llama-3.1-8b-instant'
      };
    } catch (error) {
      console.error('❌ Groq Fallback Error Details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error;
    }
  }

  async callGeminiFallback(message, sessionId) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key not configured');
  }

  try {
    console.log('🤖 Calling Gemini API...');
    
    // ✅ FIXED: Changed to v1 API and correct model name
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `You are AgroShakti AI, a helpful agricultural assistant. Provide practical farming advice.\n\nUser question: ${message}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
          topP: 0.8,
          topK: 40
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      },
      { 
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 
      }
    );
    
    console.log('✅ Gemini API Success!');
    
    return {
      response: response.data.candidates[0].content.parts[0].text,
      session_id: sessionId,
      fallback_used: 'gemini',
      model: 'gemini-2.5-flash' // ✅ Updated model name
    };
  } catch (error) {
    console.error('❌ Gemini Fallback Error Details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      errorType: error.response?.data?.error?.message || 'Unknown error'
    });
    
    // Provide more helpful error context
    if (error.response?.status === 404) {
      console.error('💡 Hint: Model not found. Using gemini-2.5-flash (latest model)');
    } else if (error.response?.status === 429) {
      console.error('💡 Hint: Rate limit exceeded. Free tier: 15 req/min, 1500 req/day');
    } else if (error.response?.status === 400) {
      console.error('💡 Hint: Bad request. Check API key and request format');
    }
    
    throw error;
  }
}


  async callAIFallback(message, sessionId) {
    console.log('\n🔄 Activating AI Fallback System...');
    
    const fallbacks = [
      { name: 'groq', handler: this.callGroqFallback.bind(this), key: GROQ_API_KEY },
      { name: 'gemini', handler: this.callGeminiFallback.bind(this), key: GEMINI_API_KEY }
    ];

    // Filter valid API keys
    const availableFallbacks = fallbacks.filter(f => 
      f.key && 
      f.key !== '' && 
      !f.key.includes('your_') && 
      f.key !== 'undefined'
    );

    console.log(`📊 Available fallbacks: ${availableFallbacks.map(f => f.name).join(', ')}`);

    if (availableFallbacks.length === 0) {
      console.error('❌ No AI fallback providers configured');
      return {
        response: "I apologize, but the chatbot service is currently unavailable and no backup AI services are configured. Please check your API key configuration.",
        session_id: sessionId,
        fallback_used: 'none',
        error: true
      };
    }

    // Try preferred provider first
    const preferredFallback = availableFallbacks.find(f => f.name === AI_FALLBACK_PROVIDER);
    if (preferredFallback) {
      try {
        console.log(`\n🎯 Trying preferred fallback: ${preferredFallback.name}`);
        const result = await preferredFallback.handler(message, sessionId);
        console.log('✅ Fallback successful!\n');
        return result;
      } catch (error) {
        console.log(`⚠️ Preferred fallback (${preferredFallback.name}) failed: ${error.message}`);
      }
    }

    // Try other available fallbacks
    for (const fallback of availableFallbacks) {
      if (fallback.name !== AI_FALLBACK_PROVIDER) {
        try {
          console.log(`\n🔄 Trying fallback: ${fallback.name}`);
          const result = await fallback.handler(message, sessionId);
          console.log('✅ Fallback successful!\n');
          return result;
        } catch (error) {
          console.log(`⚠️ Fallback ${fallback.name} failed: ${error.message}`);
        }
      }
    }

    // All fallbacks failed
    console.error('❌ All AI fallbacks failed\n');
    return {
      response: "I apologize, but I'm currently unable to process your request. Our AI service is temporarily unavailable. Please try again in a moment.",
      session_id: sessionId,
      fallback_used: 'none',
      error: true
    };
  }

  /* =======================
     PRIMARY FLASK CHATBOT
     ======================= */
  async callChatbot(message, sessionId) {
    try {
      const response = await axios.post(
        `${FLASK_ML_BASE}${FLASK_ENDPOINTS.CHATBOT}`,
        { message, session_id: sessionId },
        { timeout: 30000 }
      );
      return response.data;
    } catch (error) {
      console.error('⚠️ Flask Chatbot Error:', error.message);
      
      // Use AI fallback if Flask service is unavailable
      try {
        return await this.callAIFallback(message, sessionId);
      } catch (fallbackError) {
        console.error('❌ AI Fallback also failed:', fallbackError.message);
        throw new Error('Failed to get response from chatbot service');
      }
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
    try {
      const response = await axios.post(
        `${FLASK_ML_BASE}${FLASK_ENDPOINTS.DISEASE_CURE}`,
        diseaseInfo,
        { timeout: 30000 }
      );
      return response.data;
    } catch (error) {
      console.error('Flask Disease Cure Error:', error.message);
      throw new Error('Failed to get disease cure recommendation');
    }
  }
}

module.exports = new FlaskService();