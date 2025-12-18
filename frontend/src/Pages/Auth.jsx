import React, { useState } from 'react';
import { Sprout } from 'lucide-react';
import Login from '../components/auth/login';
import Signup from '../components/auth/signup';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen page-bg">
      {/* Glass overlay */}
      <div className="min-h-screen page-overlay flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Sprout className="text-primary-600 w-12 h-12" />
              <span className="text-3xl font-bold text-gray-900">
                AgroShakti
              </span>
            </div>
            <p className="text-gray-700">
              Your AI Agricultural Assistant
            </p>
          </div>

          {/* Card */}
          <div className="card bg-white/95 backdrop-blur-md">
            <div className="flex mb-6 border-b">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 font-medium transition-colors ${
                  isLogin
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 font-medium transition-colors ${
                  !isLogin
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500'
                }`}
              >
                Sign Up
              </button>
            </div>

            {isLogin ? <Login /> : <Signup />}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
