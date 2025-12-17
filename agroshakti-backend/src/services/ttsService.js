const textToSpeech = require('@google-cloud/text-to-speech');
const axios = require('axios');

// Initialize Google Cloud TTS client (will use credentials from environment or default)
let ttsClient = null;

// Try to initialize Google Cloud TTS, fallback to free alternatives if not available
try {
  // Google Cloud TTS requires GOOGLE_APPLICATION_CREDENTIALS or service account key
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_CLOUD_PROJECT) {
    ttsClient = new textToSpeech.TextToSpeechClient();
    console.log('✅ Google Cloud TTS initialized');
  } else {
    console.log('⚠️ Google Cloud TTS credentials not found, will use free alternatives');
  }
} catch (error) {
  console.log('⚠️ Google Cloud TTS initialization failed, will use free alternatives:', error.message);
}

class TTSService {
  
  /**
   * Get natural human-like voice using Google Cloud TTS
   * Falls back to free alternatives if Google Cloud is not configured
   */
  async synthesizeSpeech(text, language = 'en-US', voiceName = null) {
    // If Google Cloud TTS is available, use it
    if (ttsClient) {
      try {
        return await this.useGoogleCloudTTS(text, language, voiceName);
      } catch (error) {
        console.error('Google Cloud TTS error:', error.message);
        // Fallback to free service
        return await this.useFreeTTS(text, language);
      }
    }
    
    // Use free TTS service
    return await this.useFreeTTS(text, language);
  }

  /**
   * Google Cloud TTS - Natural, human-like voices
   */
  async useGoogleCloudTTS(text, language, voiceName) {
    const langCode = language.split('-')[0];
    
    // Voice mapping for Indian languages
    const voiceMap = {
      'en': { name: 'en-US-Neural2-F', gender: 'FEMALE' },
      'hi': { name: 'hi-IN-Neural2-A', gender: 'FEMALE' },
      'pa': { name: 'pa-IN-Standard-A', gender: 'FEMALE' },
      'bn': { name: 'bn-IN-Standard-A', gender: 'FEMALE' },
      'te': { name: 'te-IN-Standard-A', gender: 'FEMALE' },
      'mr': { name: 'mr-IN-Standard-A', gender: 'FEMALE' },
      'ta': { name: 'ta-IN-Standard-A', gender: 'FEMALE' },
      'gu': { name: 'gu-IN-Standard-A', gender: 'FEMALE' }
    };

    const voiceConfig = voiceMap[langCode] || voiceMap['en'];
    const selectedVoice = voiceName || voiceConfig.name;

    const request = {
      input: { text: text },
      voice: {
        languageCode: language,
        name: selectedVoice,
        ssmlGender: voiceConfig.gender
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0,
        volumeGainDb: 0
      }
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    const audioContent = response.audioContent;

    return {
      audio: audioContent.toString('base64'),
      format: 'mp3',
      provider: 'google-cloud'
    };
  }

  /**
   * Free TTS using gTTS (Google Text-to-Speech) - Natural voices, no API key needed
   * Uses a public proxy service
   */
  async useFreeTTS(text, language) {
    try {
      // Use a free TTS service that provides natural voices
      // Option: Use Google Translate TTS (free, no API key, natural voices)
      return await this.useGoogleTranslateTTS(text, language);
    } catch (error) {
      console.error('Free TTS error:', error.message);
      throw new Error('TTS service unavailable. Please configure Google Cloud TTS for best quality.');
    }
  }

  /**
   * Free TTS using Google Translate TTS - Natural voices, no API key needed
   */
  async useGoogleTranslateTTS(text, language) {
    const langCode = language.split('-')[0];
    
    // Use gTTS (Google Text-to-Speech) via a public API
    // This provides natural, human-like voices for free
    try {
      // Using a public gTTS API service
      const ttsUrl = `https://api.voicerss.org/`;
      
      // Note: This requires a free API key from voicerss.org
      // For immediate use without API key, we'll use a different approach
      
      // Alternative: Use Google Translate TTS (public endpoint)
      const translateTtsUrl = `https://translate.google.com/translate_tts`;
      
      const response = await axios.get(translateTtsUrl, {
        params: {
          ie: 'UTF-8',
          q: text.substring(0, 200), // Limit text length
          tl: langCode,
          client: 'tw-ob',
          total: 1,
          idx: 0,
          textlen: Math.min(text.length, 200)
        },
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://translate.google.com/'
        },
        timeout: 15000
      });

      if (response.data && response.data.byteLength > 0) {
        return {
          audio: Buffer.from(response.data).toString('base64'),
          format: 'mp3',
          provider: 'google-translate-free'
        };
      }
      
      throw new Error('Empty response from TTS service');
    } catch (error) {
      console.error('Google Translate TTS error:', error.message);
      // Return a message suggesting Google Cloud TTS setup
      throw new Error('Free TTS service unavailable. For best quality, please configure Google Cloud TTS. See README for setup instructions.');
    }
  }
}

module.exports = new TTSService();

