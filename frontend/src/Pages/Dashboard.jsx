import React, { useState } from 'react';
import MainLayout from '../components/layout/mainlayout';
import ChatInterface from '../components/chat/chatinterface';
import DiseaseDetection from '../components/Disease/DiseaseDetection';
import SchemesPanel from '../components/schemes/SchemesPanel';
import SurveyPanel from '../components/surveys/SurveyPanel';
import FeedbackPanel from '../components/feedback/FeedbackPanel';
import ProfilePanel from '../components/profile/ProfilePanel';
import AdminPanel from '../components/admin/AdminPanel';
import { useAuth } from '../Hooks/useauth';

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  // Default tab: chat for farmers, admin dashboard for admins
  const [activeTab, setActiveTab] = useState(isAdmin ? 'admin' : 'chat');

  const renderTab = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatInterface />;
      case 'disease':
        return <DiseaseDetection />;
      case 'schemes':
        return <SchemesPanel />;
      case 'surveys':
        return <SurveyPanel />;
      case 'feedback':
        return <FeedbackPanel />;
      case 'profile':
        return <ProfilePanel />;
      case 'admin':
        return isAdmin ? <AdminPanel /> : <ChatInterface />;
      default:
        return isAdmin ? <AdminPanel /> : <ChatInterface />;
    }
  };

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderTab()}
    </MainLayout>
  );
};

export default Dashboard;