module.exports = {
  ROLES: {
    FARMER: 'farmer',
    ADMIN: 'admin'
  },
  
  HOOK_TYPES: {
    CHATBOT: 'chatbot',
    SOIL: 'soil',
    RESOURCE: 'resource',
    WEATHER: 'weather',
    SCHEME: 'scheme',
    DISEASE: 'disease'
  },

  REPORT_TYPES: {
    BUG: 'bug',
    INAPPROPRIATE: 'inappropriate_content',
    OTHER: 'other'
  },

  REPORT_STATUS: {
    PENDING: 'pending',
    RESOLVED: 'resolved',
    REJECTED: 'rejected'
  },

  FLASK_ENDPOINTS: {
    CHATBOT: '/chatbot',
    SOIL_ANALYSIS: '/soil-analysis',
    RESOURCE_ESTIMATE: '/resource-estimate',
    WEATHER_ADVISORY: '/weather-advisory',
    SCHEME_RECOMMENDATIONS: '/scheme-recommendations',
    DISEASE_DETECTION: '/detect-disease',
    DISEASE_CURE: '/disease-cure'
  }
};