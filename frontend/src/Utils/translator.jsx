import api from '../Services/Api';

export const translateText = async (text, targetLang, sourceLang = 'auto') => {
  try {
    const response = await api.post('/translate', {
      text,
      targetLang,
      sourceLang
    });
    return response.data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};

export const detectLanguage = async (text) => {
  try {
    const response = await api.post('/translate/detect', { text });
    return response.data.language;
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en';
  }
};