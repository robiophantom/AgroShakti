import React, { useState, useEffect } from 'react';
import { User, Bot } from 'lucide-react';
import { useLanguage } from '../../Context/Languagecontext';
import { ttsService } from '../../Services/TTS';

const MessageBubble = ({ message }) => {
  const isUser = message.sender === 'user';
  const { currentLanguage } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState(null);
  const [voices, setVoices] = useState([]);

  // Load voices when component mounts
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };

    // Load voices immediately
    loadVoices();
    
    // Some browsers load voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Also try loading after a short delay (some browsers need this)
    const timeoutId = setTimeout(loadVoices, 500);

    return () => {
      clearTimeout(timeoutId);
      // Clean up any ongoing speech when component unmounts
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = async () => {
    if (isSpeaking) {
      // Stop speaking
      if (speechSynthesis) {
        if (speechSynthesis.pause) {
          speechSynthesis.pause();
        }
        if (speechSynthesis.stop) {
          speechSynthesis.stop();
        }
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setSpeechSynthesis(null);
      return;
    }

    // Try backend TTS first (natural human-like voice)
    try {
      const langMap = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'pa': 'pa-IN',
        'bn': 'bn-IN',
        'te': 'te-IN',
        'mr': 'mr-IN',
        'ta': 'ta-IN',
        'gu': 'gu-IN'
      };
      const targetLang = langMap[currentLanguage] || 'en-US';
      
      setIsSpeaking(true);
      console.log('Requesting natural TTS from backend...');
      
      const audioData = await ttsService.synthesizeSpeech(message.text, targetLang);
      
      if (audioData && audioData.audioBase64) {
        console.log('Playing natural voice audio...');
        await ttsService.playAudio(audioData.audioBase64, audioData.format);
        setIsSpeaking(false);
        setSpeechSynthesis(null);
        return;
      }
    } catch (error) {
      console.warn('Backend TTS failed, falling back to browser TTS:', error.message);
      // Fall through to browser TTS
    }

    // Fallback to browser TTS if backend TTS fails
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis is not supported in this browser');
      alert('Text-to-speech is not supported in your browser. Please use a modern browser like Chrome, Edge, or Safari.');
      setIsSpeaking(false);
      return;
    }

    try {
      // Get available voices (reload if needed)
      let availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length === 0) {
        // Wait for voices to load
        availableVoices = voices.length > 0 ? voices : [];
        if (availableVoices.length === 0) {
          // Force reload voices
          window.speechSynthesis.getVoices();
          setTimeout(() => {
            availableVoices = window.speechSynthesis.getVoices();
            speakWithVoices(availableVoices);
          }, 100);
          return;
        }
      }
      
      speakWithVoices(availableVoices);
    } catch (error) {
      console.error('Error starting speech:', error);
      setIsSpeaking(false);
      alert('Failed to start speech. Please try again.');
    }
  };

  const speakWithVoices = (availableVoices) => {
    // Set language based on current language context
    const langMap = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'pa': 'pa-IN',
      'bn': 'bn-IN',
      'te': 'te-IN',
      'mr': 'mr-IN',
      'ta': 'ta-IN',
      'gu': 'gu-IN'
    };
    const targetLang = langMap[currentLanguage] || 'en-US';
    const langCode = targetLang.split('-')[0];
    
    // Find the best voice for the target language
    let selectedVoice = null;
    if (availableVoices.length > 0) {
      // Try to find a voice that matches the language
      selectedVoice = availableVoices.find(v => 
        v.lang === targetLang
      ) || availableVoices.find(v => 
        v.lang.startsWith(langCode)
      ) || availableVoices.find(v => 
        v.lang.includes('en')
      ) || availableVoices[0];
      
      console.log('Selected voice:', selectedVoice?.name || 'Default', 'Language:', selectedVoice?.lang || targetLang);
      console.log('Available voices:', availableVoices.length);
    }

    // Process text to add natural pauses
    const processedText = message.text
      .replace(/([.!?])\s+/g, '$1 ') // Ensure space after punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (!processedText) {
      console.error('No text to speak');
      return;
    }

    console.log('Text to speak:', processedText.substring(0, 100) + (processedText.length > 100 ? '...' : ''));
    console.log('Text length:', processedText.length);

    const utterance = new SpeechSynthesisUtterance(processedText);
    
    // Use selected voice
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('Using voice:', selectedVoice.name, selectedVoice.lang);
    } else {
      console.warn('No voice selected, using default');
    }
    
    utterance.lang = targetLang;
    
    // Better voice settings for natural flow
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Full volume

    // Event handlers
    utterance.onstart = (event) => {
      setIsSpeaking(true);
      console.log('Speech started - Event:', event);
      console.log('Speech synthesis speaking:', window.speechSynthesis.speaking);
      console.log('Speech synthesis pending:', window.speechSynthesis.pending);
    };

    utterance.onend = (event) => {
      setIsSpeaking(false);
      setSpeechSynthesis(null);
      console.log('Speech ended - Event:', event);
    };

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      console.error('Error details:', {
        error: error.error,
        type: error.type,
        charIndex: error.charIndex,
        char: error.char,
        elapsedTime: error.elapsedTime,
        name: error.name
      });
      setIsSpeaking(false);
      setSpeechSynthesis(null);
      
      // Provide user feedback
      if (error.error === 'not-allowed') {
        alert('Speech is blocked. Please allow audio in your browser settings.');
      } else if (error.error === 'network') {
        alert('Network error. Please check your connection.');
      } else if (error.error === 'synthesis-failed') {
        alert('Speech synthesis failed. The text might not be supported in this language. Trying with English voice...');
        // Fallback to English
        tryFallbackEnglish(processedText, availableVoices);
      } else {
        console.error('Unknown error:', error);
        alert(`Speech error: ${error.error || 'Unknown error'}. Please check console for details.`);
      }
    };

    // Cancel any ongoing speech before starting new one
    window.speechSynthesis.cancel();
    
    // Wait a bit longer to ensure cancellation is processed
    setTimeout(() => {
      try {
        // Check if speech synthesis is available
        if (!window.speechSynthesis) {
          throw new Error('Speech synthesis not available');
        }
        
        // Check browser state
        console.log('Speech synthesis state:', {
          speaking: window.speechSynthesis.speaking,
          pending: window.speechSynthesis.pending,
          paused: window.speechSynthesis.paused
        });
        
        window.speechSynthesis.speak(utterance);
        setSpeechSynthesis(utterance);
        
        // Verify it started after a short delay
        setTimeout(() => {
          const isSpeaking = window.speechSynthesis.speaking;
          const isPending = window.speechSynthesis.pending;
          
          if (!isSpeaking && !isPending) {
            console.warn('Speech did not start. Possible issues:');
            console.warn('1. Browser autoplay policy blocking audio');
            console.warn('2. Tab is muted (check browser tab icon)');
            console.warn('3. System volume is muted');
            console.warn('4. Voice not available for this language');
            console.warn('5. Browser does not support this language');
            
            // Try with English as fallback
            console.log('Attempting fallback to English...');
            tryFallbackEnglish(processedText, availableVoices);
          } else {
            console.log('Speech is active:', { speaking: isSpeaking, pending: isPending });
          }
        }, 300);
        
        console.log('Speaking:', processedText.substring(0, 50) + '...');
      } catch (error) {
        console.error('Error speaking:', error);
        setIsSpeaking(false);
        alert('Failed to speak. Please try again.');
      }
    }, 200);
  };

  const tryFallbackEnglish = (text, availableVoices) => {
    const englishVoice = availableVoices.find(v => 
      v.lang.includes('en') && v.localService !== false
    ) || availableVoices.find(v => v.lang.includes('en')) || availableVoices[0];

    if (!englishVoice) {
      alert('No English voice available for fallback.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = englishVoice;
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      console.log('Fallback English speech started');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeechSynthesis(null);
    };

    utterance.onerror = (error) => {
      console.error('Fallback speech error:', error);
      setIsSpeaking(false);
      setSpeechSynthesis(null);
    };

    window.speechSynthesis.speak(utterance);
    setSpeechSynthesis(utterance);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start space-x-3 max-w-[75%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
          isUser 
            ? 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg' 
            : isSpeaking
            ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg scale-110'
            : 'bg-gradient-to-br from-green-500 to-green-600 shadow-md'
        }`}>
          {isUser ? (
            <User size={20} className="text-white" />
          ) : (
            <div className={`relative ${isSpeaking ? 'robot-speaking' : ''}`}>
              <Bot size={20} className="text-white" />
              {isSpeaking && (
                <>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-green-300 rounded-full animate-ping opacity-75"></div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className={`rounded-2xl px-4 py-3 shadow-sm transition-all duration-300 ${
          isUser
            ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white'
            : 'bg-white border border-gray-200 text-gray-800'
        }`}>
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
          <div className={`flex items-center justify-between mt-2 ${
            isUser ? 'text-primary-100' : 'text-gray-500'
          }`}>
            <p className="text-xs">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
            {!isUser && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeak();
                }}
                className={`ml-3 p-1.5 rounded-full transition-all duration-300 cursor-pointer z-10 ${
                  isSpeaking 
                    ? 'bg-green-100 text-green-700 scale-110 animate-pulse' 
                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                }`}
                title={isSpeaking ? 'Stop speaking' : 'Listen to response'}
                aria-label={isSpeaking ? 'Stop speaking' : 'Listen to response'}
              >
                <div className="relative pointer-events-none">
                  <Bot size={16} className={isSpeaking ? 'animate-bounce' : ''} />
                  {isSpeaking && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-green-600 rounded-full animate-ping"></div>
                    </div>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;