import api from './Api';

// Translation service - translates text between languages
// Uses backend translation endpoint (which can use LibreTranslate, Google Translate, etc.)
export const translationService = {
  /**
   * Translate text from source language to target language
   * @param {string} text - Text to translate
   * @param {string} sourceLang - Source language code (e.g., 'hi', 'en')
   * @param {string} targetLang - Target language code (e.g., 'en', 'hi')
   * @returns {Promise<string>} Translated text
   */
  async translate(text, sourceLang, targetLang) {
    // If same language, return as is
    if (sourceLang === targetLang) {
      return text;
    }

    // If text is empty, return as is
    if (!text || text.trim() === '') {
      return text;
    }

    try {
      const response = await api.post('/hooks/translate', {
        text,
        source_lang: sourceLang,
        target_lang: targetLang
      });
      return response.data?.data?.translated_text || text;
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback: return original text if translation fails
      return text;
    }
  },

  /**
   * Translate user input to English (for LLM)
   * @param {string} text - User input in any language
   * @param {string} userLang - User's language code
   * @returns {Promise<string>} English text
   */
  async translateToEnglish(text, userLang) {
    if (userLang === 'en') {
      return text;
    }
    return this.translate(text, userLang, 'en');
  },

  /**
   * Translate English LLM response to user's language
   * @param {string} text - English text from LLM
   * @param {string} userLang - User's language code
   * @returns {Promise<string>} Translated text
   */
  async translateFromEnglish(text, userLang) {
    if (userLang === 'en') {
      return text;
    }
    return this.translate(text, 'en', userLang);
  }
};

