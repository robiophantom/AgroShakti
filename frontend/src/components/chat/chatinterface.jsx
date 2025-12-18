import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../Context/Languagecontext';
import { useAuth } from '../../Hooks/useauth';
import { chatbotService } from '../../Services/Chatbot';
import toast from 'react-hot-toast';
import MessageBubble from './Messagebubble.';
import InputPanel from './inputpannel';
import { Trash2, History, X, Clock, MessageSquare } from 'lucide-react';
import api from '../../Services/Api';
import { ttsService } from '../../Services/TTS';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const cancelRef = useRef(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editText, setEditText] = useState('');
  
  // Use user's language preference if available, otherwise use current language from context
  const userLanguage = user?.language_preference || currentLanguage || 'en';

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Stop any ongoing speech when leaving the chat interface
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      ttsService.stopAudio?.();
    };
  }, []);

  const loadChatHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data } = await api.get('/history/chat', { params: { limit: 20 } });
      const history = data?.data?.history || [];
      // Group by session_id and format for display
      const groupedHistory = history.reduce((acc, item) => {
        const sessionId = item.session_id || 'default';
        if (!acc[sessionId]) {
          acc[sessionId] = {
            session_id: sessionId,
            messages: [],
            lastMessage: item.created_at
          };
        }
        acc[sessionId].messages.push({
          text: item.message,
          response: item.response,
          timestamp: item.created_at
        });
        return acc;
      }, {});
      setChatHistory(Object.values(groupedHistory));
    } catch (error) {
      console.error('Failed to load chat history:', error);
      toast.error('Failed to load chat history');
    } finally {
      setLoadingHistory(false);
    }
  };
  const getSessionTitle = (session) => {
    const first = session.messages?.[0]?.text || 'Conversation';
    const trimmed = first.replace(/\s+/g, ' ').trim();
    if (!trimmed) return 'Conversation';
    return trimmed.length > 40 ? `${trimmed.slice(0, 37)}...` : trimmed;
  };


  const handleHistoryClick = () => {
    setShowHistory(!showHistory);
    if (!showHistory && chatHistory.length === 0) {
      loadChatHistory();
    }
  };

  const loadHistorySession = (session) => {
    const sessionMessages = [];
    session.messages.forEach((msg, idx) => {
      sessionMessages.push({
        id: `history-${session.session_id}-${idx}-user`,
        text: msg.text,
        sender: 'user',
        timestamp: new Date(msg.timestamp),
        autoSpeak: false
      });
      if (msg.response) {
        sessionMessages.push({
          id: `history-${session.session_id}-${idx}-bot`,
          text: msg.response,
          sender: 'bot',
          timestamp: new Date(msg.timestamp),
          autoSpeak: false
        });
      }
    });
    setMessages(sessionMessages);
    setShowHistory(false);
    toast.success('Chat history loaded');
  };

  const handleDeleteHistory = async (e, sessionId) => {
    e.stopPropagation(); // Prevent loading the session when clicking delete
    
    if (!window.confirm('Are you sure you want to delete this chat history? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/history/chat/${sessionId}`);
      toast.success('Chat history deleted successfully');
      // Remove from local state
      setChatHistory(prev => prev.filter(session => session.session_id !== sessionId));
      // If the deleted session is currently loaded, clear messages
      // Check if any message has an id that contains this session_id
      const isCurrentSession = messages.some(msg => {
        if (typeof msg.id === 'string' && msg.id.startsWith('history-')) {
          // Extract session_id from history message id format: "history-{sessionId}-{idx}-{sender}"
          const parts = msg.id.split('-');
          return parts.length >= 2 && parts[1] === sessionId;
        }
        return false;
      });
      
      if (isCurrentSession) {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete chat history:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete chat history');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (query, options = {}) => {
    const fromVoice = options.fromVoice === true;
    cancelRef.current = false;
    const userMessage = {
      id: Date.now(),
      text: query,
      sender: 'user',
      timestamp: new Date(),
      autoSpeak: false
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await chatbotService.sendQuery(query, userLanguage);

      const botMessage = {
        id: Date.now() + 1,
        text: response?.response || response?.message || 'No response received',
        sender: 'bot',
        timestamp: new Date(),
        // Auto-speak only when the question came from voice
        autoSpeak: fromVoice
      };

      // If user cancelled while we were waiting, ignore this response
      if (cancelRef.current) {
        return;
      }

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      toast.error('Failed to get response');
      console.error('Chat error:', error);
    } finally {
      if (!cancelRef.current) {
        setLoading(false);
      }
    }
  };

  const handleStopGeneration = () => {
    if (!loading) return;
    cancelRef.current = true;
    setLoading(false);
    // Also stop any ongoing TTS audio if it was speaking the partial response
    ttsService.stopAudio?.();
    toast.success('Stopped generating response');
  };

  const handleEditLastUserMessage = () => {
    if (!messages.length || loading) return;

    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.sender === 'user');
    if (!lastUserMessage) return;

    setEditText(lastUserMessage.text || '');
    setEditModalOpen(true);
  };

  const handleConfirmEdit = () => {
    const text = editText.trim();
    if (!text) return;

    // Remove last user message and everything after it
    const newMessages = [...messages];
    let lastUserIndex = -1;
    for (let i = newMessages.length - 1; i >= 0; i--) {
      if (newMessages[i].sender === 'user') {
        lastUserIndex = i;
        break;
      }
    }
    if (lastUserIndex !== -1) {
      newMessages.splice(lastUserIndex);
      setMessages(newMessages);
    }

    setEditModalOpen(false);
    handleSendMessage(text, { fromVoice: false });
  };

  const handleClearChat = () => {
    // Stop any ongoing speech when clearing chat
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    ttsService.stopAudio?.();
    setMessages([]);
    toast.success('Chat cleared');
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowHistory(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-4 border-b bg-gradient-to-r from-green-600 to-green-700 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History size={20} />
                    <h3 className="font-semibold text-lg">Chat History</h3>
                  </div>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
                  </div>
                ) : chatHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No chat history found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatHistory.map((session, idx) => (
                      <motion.div
                        key={session.session_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-3 border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all bg-white group relative"
                      >
                        <div 
                          onClick={() => loadHistorySession(session)}
                          className="cursor-pointer pr-8"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <Clock size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-500 flex-1">
                              {new Date(session.lastMessage).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2 group-hover:text-green-700 transition-colors">
                            {getSessionTitle(session)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteHistory(e, session.session_id)}
                          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                          title="Delete this chat history"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="p-4 border-b bg-white/80 backdrop-blur-sm flex justify-between items-center shadow-sm">
        <div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
            Chat Assistant
          </h2>
          <p className="text-sm text-gray-500">
            Ask me anything about agriculture
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleHistoryClick}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 flex items-center gap-1.5"
            title="View chat history"
          >
            <History size={18} />
            <span className="text-sm font-medium hidden sm:inline">History</span>
          </button>
          <button
            onClick={handleClearChat}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            title="Clear chat"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gradient-to-b from-transparent to-gray-50/50">
        {messages.length === 0 ? (
          <motion.div 
            className="h-full flex flex-col items-center justify-center space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Animated Robot with Namaste Gesture */}
            <div className="robot-greeting-container">
              <div className="robot-avatar">
                <div className="robot-head">
                  <div className="robot-antenna">
                    <div className="robot-antenna-tip"></div>
                  </div>
                  <div className="robot-face">
                    <div className="robot-eyes">
                      <div className="robot-eye"></div>
                      <div className="robot-eye"></div>
                    </div>
                    <div className="robot-mouth"></div>
                  </div>
                </div>
                <div className="robot-body">
                  <div className="robot-logo"></div>
                </div>
                <div className="robot-arms-container">
                  <div className="robot-arm left-arm">
                    <div className="robot-hand left-hand"></div>
                  </div>
                  <div className="robot-arm right-arm">
                    <div className="robot-hand right-hand"></div>
                  </div>
                </div>
                <div className="robot-shadow"></div>
              </div>
            </div>
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                Hi! Welcome to AgroShakti 👋
              </h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                Ask about crops, soil health, weather, government schemes, or best farming practices.
              </p>
            </motion.div>
            <motion.div 
              className="flex flex-wrap gap-3 justify-center max-w-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {['Best crop for my land?', 'How to improve soil?', 'Pest control tips', 'Weather for this week?'].map((suggestion, index) => (
                <motion.button
                  key={suggestion}
                  type="button"
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    delay: 0.4 + index * 0.1,
                    type: 'spring',
                    stiffness: 200,
                    damping: 15
                  }}
                  className="px-5 py-2.5 rounded-full border-2 border-green-200 bg-white text-sm font-medium text-green-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:border-green-400 hover:shadow-md transition-all duration-200"
                  whileHover={{ scale: 1.08, y: -3, boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSendMessage(suggestion)}
                >
                  {suggestion}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => {
              const isLastUser =
                message.sender === 'user' &&
                messages.slice().reverse().find((m) => m.sender === 'user') ===
                  message;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  <MessageBubble
                    message={message}
                    autoSpeak={!!message.autoSpeak}
                    canEdit={isLastUser && !loading}
                    onEdit={handleEditLastUserMessage}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl px-5 py-4 border border-green-100 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2.5 h-2.5 bg-green-600 rounded-full"
                      animate={{
                        y: [0, -8, 0],
                        opacity: [0.5, 1, 0.5],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>
                <span className="text-sm text-green-700 font-medium">AI is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Edit & resend modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-5 border border-emerald-100">
            <h3 className="text-lg font-semibold text-emerald-900 mb-2">
              Edit your last question
            </h3>
            <p className="text-xs text-emerald-700 mb-3">
              Update your question and AgroShakti will answer again with the edited version.
            </p>
            <textarea
              className="w-full min-h-[100px] border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEdit}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Send edited question
              </button>
            </div>
          </div>
        </div>
      )}

      <InputPanel
        onSendMessage={handleSendMessage}
        disabled={loading}
        isGenerating={loading}
        onStop={handleStopGeneration}
      />
    </div>
  );
};

export default ChatInterface;