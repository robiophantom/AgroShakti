import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Hooks/useauth';
import { Sprout, LogOut, ChevronDown } from 'lucide-react';
import LanguageSelector from './languageselector';
import { AVATAR_OPTIONS } from './AvatarSelector';

const Navbar = ({ setActiveTab }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Get user's avatar preference or default
  const userAvatar = user?.avatar || 'farmer1';
  const selectedAvatarData = AVATAR_OPTIONS.find(a => a.id === userAvatar) || AVATAR_OPTIONS[0];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSelectProfile = () => {
    setMenuOpen(false);
    if (setActiveTab) {
      setActiveTab('profile');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Sprout className="text-primary-600 w-8 h-8" />
            <span className="text-2xl font-bold text-gray-900">AgroShakti</span>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSelector />

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${selectedAvatarData.color}`}>
                  <span className="text-lg">{selectedAvatarData.icon}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.name || 'User'}
                </span>
                <ChevronDown size={14} className="text-gray-500" />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg z-20 overflow-hidden"
                  >
                    <motion.button
                      type="button"
                      onClick={handleSelectProfile}
                      whileHover={{ x: 4, backgroundColor: '#f9fafb' }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                    >
                      View profile
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={handleSelectProfile}
                      whileHover={{ x: 4, backgroundColor: '#f9fafb' }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                    >
                      Update profile
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={handleLogout}
                      whileHover={{ x: 4, backgroundColor: '#fef2f2' }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut size={14} />
                      <span>Logout</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;