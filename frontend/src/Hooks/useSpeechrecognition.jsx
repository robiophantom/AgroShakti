import { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition as useSpeech } from 'react-speech-recognition';

export const useSpeechRecognition = (language = 'en-US') => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeech();

  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(browserSupportsSpeechRecognition);
  }, [browserSupportsSpeechRecognition]);

  const startListening = () => {
    SpeechRecognition.startListening({ 
      continuous: true, // Continuous mode for auto-complete
      language: language,
      interimResults: true // Get interim results for better UX
    });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  return {
    transcript,
    listening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  };
};