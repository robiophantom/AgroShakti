import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, MessageSquare } from 'lucide-react';
import { useLanguage } from '../../Context/Languagecontext';
import { useSpeechRecognition } from '../../Hooks/useSpeechrecognition';
import { getSpeechLanguageCode } from '../../Utils/SpeechRecognition';
import toast from 'react-hot-toast';

const InputPanel = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');
  const [inputMode, setInputMode] = useState('text');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const { currentLanguage } = useLanguage();
  const lastTranscriptRef = useRef('');
  const silenceTimeoutRef = useRef(null);
  
  const speechLangCode = getSpeechLanguageCode(currentLanguage);
  const {
    transcript,
    listening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition(speechLangCode);

  // Auto-complete speech when sentence ends
  useEffect(() => {
    if (transcript && listening && isVoiceActive) {
      // Update input with current transcript
      setInput(transcript);
      
      // Check if sentence ended (period, question mark, exclamation, or language-specific endings)
      // Support for multiple languages: English, Hindi, Punjabi, etc.
      const sentenceEnders = /[.!?।॥।\u0964]\s*$/;
      const trimmedTranscript = transcript.trim();
      const hasEnded = sentenceEnders.test(trimmedTranscript);
      
      // Also check for silence (no change in transcript for 2 seconds)
      if (transcript !== lastTranscriptRef.current) {
        lastTranscriptRef.current = transcript;
        
        // Clear previous timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        
        // Set new timeout - if transcript doesn't change for 2s, auto-complete
        silenceTimeoutRef.current = setTimeout(() => {
          if (listening && trimmedTranscript) {
            handleAutoCompleteSpeech(trimmedTranscript);
          }
        }, 2000);
      }
      
      // If sentence ended, auto-complete immediately (with small delay for natural feel)
      if (hasEnded && trimmedTranscript) {
        clearTimeout(silenceTimeoutRef.current);
        setTimeout(() => {
          if (listening && transcript.trim() === trimmedTranscript) {
            handleAutoCompleteSpeech(trimmedTranscript);
          }
        }, 300);
      }
    }
    
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [transcript, listening, isVoiceActive]);

  const handleAutoCompleteSpeech = (text) => {
    if (text.trim() && !disabled) {
      stopListening();
      setIsVoiceActive(false);
      onSendMessage(text.trim());
      resetTranscript();
      setInput('');
      lastTranscriptRef.current = '';
    }
  };

  useEffect(() => {
    if (transcript && !listening && isVoiceActive) {
      setInput(transcript);
    }
  }, [transcript, listening, isVoiceActive]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
      resetTranscript();
    }
  };

  const handleTextMode = () => {
    setInputMode('text');
    setIsVoiceActive(false);
    stopListening();
    resetTranscript();
  };

  const handleVoiceMode = () => {
    if (!isSupported) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }
    setInputMode('voice');
    setIsVoiceActive(true);
    startListening();
  };

  const handleMicClick = () => {
    if (listening) {
      // Stop and send if there's transcript
      if (transcript.trim()) {
        handleAutoCompleteSpeech(transcript);
      } else {
        stopListening();
        setIsVoiceActive(false);
      }
    } else {
      startListening();
      setIsVoiceActive(true);
    }
  };

  return (
    <div className="p-4 border-t bg-gradient-to-r from-white to-gray-50 backdrop-blur-sm shadow-lg">
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        {/* Separate Text Input Button */}
        <button
          type="button"
          onClick={handleTextMode}
          className={`p-3 rounded-xl transition-all duration-200 ${
            inputMode === 'text'
              ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg scale-105'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-green-300 hover:text-green-600 shadow-sm'
          }`}
          title="Text input"
        >
          <MessageSquare size={20} />
        </button>

        {/* Separate Voice Input Button */}
        <button
          type="button"
          onClick={handleVoiceMode}
          className={`p-3 rounded-xl transition-all duration-200 ${
            inputMode === 'voice'
              ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg scale-105'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-green-300 hover:text-green-600 shadow-sm'
          }`}
          title="Voice input"
        >
          <Mic size={20} />
        </button>

        {inputMode === 'text' ? (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 input-field bg-white border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3 shadow-sm transition-all"
            disabled={disabled}
          />
        ) : (
          <div className={`flex-1 flex items-center space-x-3 px-4 py-3 bg-white border-2 rounded-xl transition-all ${
            listening 
              ? 'border-red-400 shadow-lg shadow-red-100' 
              : 'border-gray-200 shadow-sm'
          }`}>
            <button
              type="button"
              onClick={handleMicClick}
              className={`p-2.5 rounded-full transition-all duration-200 ${
                listening
                  ? 'bg-red-500 text-white animate-pulse scale-110 shadow-lg'
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              }`}
            >
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <span className={`flex-1 text-sm font-medium transition-colors ${
              listening ? 'text-red-600' : 'text-gray-600'
            }`}>
              {listening ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  Listening... (speak naturally, it will auto-complete)
                </span>
              ) : (
                transcript || 'Click mic to speak'
              )}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={disabled || (!input.trim() && !transcript)}
          className="p-3 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-md transform hover:scale-105 disabled:transform-none"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default InputPanel;