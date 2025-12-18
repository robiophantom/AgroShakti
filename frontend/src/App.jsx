import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './Hooks/useauth';
import Home from './Pages/Home';
import Dashboard from './Pages/Dashboard';
import AuthPage from './Pages/Auth';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route 
        path="/auth" 
        element={user ? <Navigate to="/dashboard" /> : <AuthPage />} 
      />
      <Route 
        path="/dashboard" 
        element={user ? <Dashboard /> : <Navigate to="/auth" />} 
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;