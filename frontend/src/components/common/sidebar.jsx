import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Camera, FileText, ClipboardList, Star, User as UserIcon, Shield, ChevronUp, ChevronDown } from 'lucide-react';

import { useAuth } from '../../Hooks/useauth';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [open, setOpen] = useState(true);

  const tabs = [
    // Chat only for farmers (not in admin dashboard)
    !isAdmin ? { id: 'chat', name: 'Chat Assistant', icon: MessageSquare } : null,
    { id: 'disease', name: 'Disease Detection', icon: Camera },
    { id: 'schemes', name: 'Schemes', icon: FileText },
    { id: 'surveys', name: 'Surveys', icon: ClipboardList },
    { id: 'feedback', name: 'Feedback & Reports', icon: Star },
    { id: 'profile', name: 'Profile', icon: UserIcon },
    isAdmin ? { id: 'admin', name: 'Admin Dashboard', icon: Shield } : null,
  ].filter(Boolean);

  return (
    <aside className="w-64 bg-white border-r min-h-[calc(100vh-4rem)]">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Features
          </h2>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="p-1 rounded hover:bg-gray-100"
            aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{tab.name}</span>
                  </motion.button>
                );
              })}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
};

export default Sidebar;