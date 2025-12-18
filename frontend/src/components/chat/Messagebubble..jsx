import React, { useState, useEffect } from 'react';
import { User, Bot, Copy, ThumbsUp, ThumbsDown, Flag } from 'lucide-react';
import { useLanguage } from '../../Context/Languagecontext';
import { ttsService } from '../../Services/TTS';
import { feedbackService } from '../../Services/Feedback';
import toast from 'react-hot-toast';

const MessageBubble = ({ message, autoSpeak = false, canEdit = false, onEdit }) => {
  const isUser = message.sender === 'user';
  const { currentLanguage } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasAutoSpoken, setHasAutoSpoken] = useState(false);
  const [reaction, setReaction] = useState(null); // 'up' | 'down' | null

  // Clean up any ongoing speech for this bubble when it unmounts
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        ttsService.stopAudio?.();
      }
    };
  }, [isSpeaking]);

  // Internal helper: start backend TTS for this message
  const startSpeak = async () => {
    // Always stop any current audio before starting this one
    ttsService.stopAudio?.();

    try {
      const langMap = {
        en: 'en-US',
        hi: 'hi-IN',
        pa: 'pa-IN',
        bn: 'bn-IN',
        te: 'te-IN',
        mr: 'mr-IN',
        ta: 'ta-IN',
        gu: 'gu-IN',
      };
      const targetLang = langMap[currentLanguage] || 'en-US';

      setIsSpeaking(true);
      const audioData = await ttsService.synthesizeSpeech(
        message.text,
        targetLang
      );

      if (audioData && audioData.audioBase64) {
        await ttsService.playAudio(audioData.audioBase64, audioData.format);
      }
    } catch (error) {
      console.error('TTS error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  // Auto-play bot responses that are marked for autoSpeak (e.g. after voice input)
  useEffect(() => {
    if (!isUser && autoSpeak && !hasAutoSpoken && !isSpeaking) {
      // Fire and forget; internal state will manage itself
      startSpeak();
      setHasAutoSpoken(true);
    }
  }, [autoSpeak, isUser, hasAutoSpoken, isSpeaking]);

  // Speaker button: always (re)start speaking this message from the beginning
  const handleSpeak = async () => {
    await startSpeak();
  };

  // Stop button: interrupt/stop current audio
  const handleStop = () => {
    ttsService.stopAudio?.();
    setIsSpeaking(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text || '');
      toast.success('Copied answer');
    } catch {
      toast.error('Could not copy');
    }
  };

  const handleReaction = async (type) => {
    const next = reaction === type ? null : type;
    setReaction(next);

    // Fire-and-forget feedback (rating 5 for like, 1 for dislike)
    if (next) {
      try {
        await feedbackService.submitFeedback({
          feature_type: 'chatbot',
          rating: next === 'up' ? 5 : 1,
          comment: message.text?.slice(0, 500) || '',
        });
      } catch (e) {
        console.error('Feedback failed', e);
      }
    }
  };

  const handleReport = async () => {
    const description = window.prompt(
      'Describe what is wrong with this answer (optional):',
      message.text?.slice(0, 200) || ''
    );
    if (description === null) return;

    try {
      await feedbackService.submitReport({
        report_type: 'inappropriate_content',
        description: description || message.text || 'Issue with chatbot answer',
      });
      toast.success('Reported to admin');
    } catch (e) {
      console.error('Report failed', e);
      toast.error('Could not send report');
    }
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
          <div
            className={`flex items-center justify-between mt-2 ${
              isUser ? 'text-primary-100' : 'text-gray-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <p className="text-xs">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {isUser && canEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit && onEdit();
                  }}
                  className="text-[11px] underline underline-offset-2 hover:text-emerald-100"
                >
                  Edit & resend
                </button>
              )}
            </div>
            {!isUser && (
              <div className="flex items-center gap-2">
                {/* Message actions: copy / like / dislike / report */}
                <div className="hidden sm:flex items-center gap-1 mr-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy();
                    }}
                    className="p-1 rounded-full text-gray-400 hover:text-emerald-700 hover:bg-emerald-50"
                    title="Copy answer"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReaction('up');
                    }}
                    className={`p-1 rounded-full hover:bg-emerald-50 ${
                      reaction === 'up'
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-gray-400 hover:text-emerald-700'
                    }`}
                    title="Helpful"
                  >
                    <ThumbsUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReaction('down');
                    }}
                    className={`p-1 rounded-full hover:bg-rose-50 ${
                      reaction === 'down'
                        ? 'text-rose-700 bg-rose-50'
                        : 'text-gray-400 hover:text-rose-700'
                    }`}
                    title="Not helpful"
                  >
                    <ThumbsDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReport();
                    }}
                    className="p-1 rounded-full text-gray-400 hover:text-amber-700 hover:bg-amber-50"
                    title="Report this answer"
                  >
                    <Flag size={14} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeak();
                  }}
                  className={`p-1.5 rounded-full transition-all duration-300 cursor-pointer z-10 ${
                    isSpeaking
                      ? 'bg-green-100 text-green-700 scale-110 animate-pulse'
                      : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                  }`}
                  title="Listen to response"
                  aria-label="Listen to response"
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
                {isSpeaking && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStop();
                    }}
                    className="px-2 py-1 text-[11px] rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  >
                    Stop
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;