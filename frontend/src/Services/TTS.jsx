import api from './Api';

// Keep track of the currently playing HTMLAudioElement so we can stop it
let currentAudio = null;
let currentAudioUrl = null;

export const ttsService = {
  /**
   * Get natural human-like speech audio from backend
   */
  async synthesizeSpeech(text, language = 'en-US') {
    try {
      const { data } = await api.post('/hooks/text-to-speech', {
        text,
        language,
      });

      if (data?.success && data?.data?.audio) {
        return {
          audioBase64: data.data.audio,
          format: data.data.format || 'mp3',
          provider: data.data.provider,
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
   * Stop any currently playing backend audio
   */
  stopAudio() {
    try {
      if (currentAudio) {
        console.log('TTS: Stopping audio');
        // Pause and reset
        try {
          currentAudio.pause();
        } catch (e) {
          console.warn('TTS: pause failed', e);
        }
        try {
          currentAudio.currentTime = 0;
        } catch (e) {
          console.warn('TTS: reset currentTime failed', e);
        }
        // Detach source completely to be extra sure it stops
        try {
          currentAudio.src = '';
          currentAudio.load();
        } catch (e) {
          console.warn('TTS: clearing src failed', e);
        }
      }
      if (currentAudioUrl) {
        try {
          URL.revokeObjectURL(currentAudioUrl);
        } catch (e) {
          console.warn('TTS: revokeObjectURL failed', e);
        }
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    } finally {
      currentAudio = null;
      currentAudioUrl = null;
    }
  },

  /**
   * Pause currently playing backend audio (if any)
   */
  pauseAudio() {
    try {
      if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  },

  /**
   * Resume paused backend audio (if any)
   */
  resumeAudio() {
    try {
      if (currentAudio && currentAudio.paused) {
        currentAudio
          .play()
          .then(() => {
            console.log('Resumed TTS audio');
          })
          .catch((err) => {
            console.error('Error resuming audio:', err);
          });
      }
    } catch (error) {
      console.error('Error resuming audio:', error);
    }
  },

  /**
   * Play audio from base64 string (ensuring only one plays at a time)
   */
  playAudio(audioBase64, format = 'mp3') {
    return new Promise((resolve, reject) => {
      try {
        // Always stop any existing audio before starting a new one
        ttsService.stopAudio();

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
        currentAudio = audio;
        currentAudioUrl = audioUrl;

        audio.onended = () => {
          if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
          }
          if (currentAudio === audio) {
            currentAudio = null;
            currentAudioUrl = null;
          }
          resolve();
        };

        audio.onerror = (error) => {
          console.error('Audio playback error:', error);
          if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
          }
          if (currentAudio === audio) {
            currentAudio = null;
            currentAudioUrl = null;
          }
          reject(new Error('Failed to play audio'));
        };

        audio.oncanplaythrough = () => {
          audio
            .play()
            .then(() => {
              console.log('Natural voice audio playing...');
            })
            .catch((playError) => {
              console.error('Error playing audio:', playError);
              if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
              }
              if (currentAudio === audio) {
                currentAudio = null;
                currentAudioUrl = null;
              }
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
  },
};

