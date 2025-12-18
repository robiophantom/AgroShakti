import React from 'react';
import Navbar from '../common/navbar';
import Sidebar from '../common/sidebar';
import FloatingChatButton from '../common/FloatingChatButton';

const MainLayout = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100/80 to-amber-50">
      <Navbar setActiveTab={setActiveTab} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex gap-4">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 bg-white/95 backdrop-blur-md rounded-2xl shadow-md p-4 md:p-6 min-h-[calc(100vh-5rem)] overflow-hidden">
          {children}
        </main>
      </div>
      {/* Floating Chat Button - Admin quick access to chat */}
      <FloatingChatButton />
    </div>
  );
};

export default MainLayout;