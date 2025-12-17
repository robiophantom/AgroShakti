import api from './Api';
import { translationService } from './Translation';

// Chatbot wired to backend `/api/hooks/chatbot`
export const chatbotService = {
  async sendQuery(query, language = 'en', sessionId = null) {
    // Store original message in user's language
    const originalMessage = query;
    
    // Translate user input to English if needed (for Flask LLM)
    let englishMessage = query;
    if (language !== 'en') {
      try {
        englishMessage = await translationService.translateToEnglish(query, language);
      } catch (error) {
        console.error('Translation error:', error);
        // If translation fails, send original (LLM might still understand)
        englishMessage = query;
      }
    }

    // Send English message to backend (which will translate response back)
    const { data } = await api.post('/hooks/chatbot', {
      message: englishMessage, // English for LLM
      original_message: originalMessage, // Original in user's language for history
      session_id: sessionId,
      language // User's language for response translation
    });
    // backend returns { success, data: { response, session_id } }
    // Response is already translated to user's language by backend
    return data?.data;
  },

  async getChatHistory(params = {}) {
    const { data } = await api.get('/history/chat', { params });
    return data?.data;
  },

  // Not directly supported; keeps API for compatibility (no-op on backend)
  async clearHistory() {
    return { success: true };
  }
};