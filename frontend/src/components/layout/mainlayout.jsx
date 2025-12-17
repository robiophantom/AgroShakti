import React from 'react';
import Navbar from '../common/navbar';
import Sidebar from '../common/sidebar';
import FloatingChatButton from '../common/FloatingChatButton';

const MainLayout = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar setActiveTab={setActiveTab} />
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      {/* Floating Chat Button - Always available */}
      <FloatingChatButton />
    </div>
  );
};

export default MainLayout;