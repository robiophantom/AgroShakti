import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X } from 'lucide-react';
import { useAuth } from '../../Hooks/useauth';
import ChatInterface from '../chat/chatinterface';

const FloatingChatButton = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isOpen, setIsOpen] = useState(false);

  // Only show floating button for admin users
  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            type="button"
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-6 right-6 w-16 h-16 bg-primary-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 group"
            aria-label="Open chat assistant"
            title="Chat Assistant"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Bot size={28} />
            </motion.div>
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-xl shadow-2xl z-50 flex flex-col border border-gray-200"
          >
            <div className="flex items-center justify-between p-4 border-b bg-primary-600 text-white rounded-t-xl">
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <div>
                  <h3 className="font-semibold">Chat Assistant</h3>
                  <p className="text-xs text-primary-100">Ask me anything about agriculture</p>
                </div>
              </div>
              <motion.button
                type="button"
                onClick={() => setIsOpen(false)}
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 rounded-lg hover:bg-primary-700 transition-colors"
                aria-label="Close chat"
              >
                <X size={18} />
              </motion.button>
            </div>
            <div className="flex-1 overflow-hidden rounded-b-xl">
              <ChatInterface />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatButton;
