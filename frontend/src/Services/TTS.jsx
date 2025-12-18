import api from './Api';

export const ttsService = {
  /**
   * Get natural human-like speech audio from backend
   */
  async synthesizeSpeech(text, language = 'en-US') {
    try {
      const { data } = await api.post('/hooks/text-to-speech', {
        text,
        language
      });
      
      if (data?.success && data?.data?.audio) {
        return {
          audioBase64: data.data.audio,
          format: data.data.format || 'mp3',
          provider: data.data.provider
        };
      }
      
      throw new Error('TTS service returned invalid response');
    } catch (error) {
      console.error('TTS service error:', error);
      // Return null to indicate fallback to browser TTS
      return null;
    }
  },

  /**
   * Play audio from base64 string
   */
  playAudio(audioBase64, format = 'mp3') {
    return new Promise((resolve, reject) => {
      try {
        // Convert base64 to blob
        const audioData = atob(audioBase64);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < audioData.length; i++) {
          uint8Array[i] = audioData.charCodeAt(i);
        }
        
        const blob = new Blob([uint8Array], { type: `audio/${format}` });
        const audioUrl = URL.createObjectURL(blob);
        
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        
        audio.onerror = (error) => {
          console.error('Audio playback error:', error);
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Failed to play audio'));
        };
        
        audio.oncanplaythrough = () => {
          audio.play().then(() => {
            console.log('Natural voice audio playing...');
          }).catch((playError) => {
            console.error('Error playing audio:', playError);
            URL.revokeObjectURL(audioUrl);
            reject(playError);
          });
        };
        
        audio.onloadstart = () => {
          console.log('Loading natural voice audio...');
        };
      } catch (error) {
        console.error('Error creating audio:', error);
        reject(error);
      }
    });
  }
};

