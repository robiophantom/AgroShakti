import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, MessageSquare, Camera, Globe } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Sprout className="text-primary-600 w-8 h-8" />
              <span className="text-2xl font-bold text-gray-900">AgroShakti</span>
            </div>
            <Link to="/auth" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Your AI-Powered Agricultural Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get instant answers to farming questions and detect plant diseases using advanced AI technology
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="card text-center">
            <MessageSquare className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI Chatbot</h3>
            <p className="text-gray-600">
              Ask questions about crops, pests, farming techniques, and get expert advice instantly
            </p>
          </div>

          <div className="card text-center">
            <Camera className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Disease Detection</h3>
            <p className="text-gray-600">
              Upload plant images to identify diseases and receive treatment recommendations
            </p>
          </div>

          <div className="card text-center">
            <Globe className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Multi-Language Support</h3>
            <p className="text-gray-600">
              Interact in your preferred language with text and voice input options
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link to="/auth" className="btn-primary text-lg px-8 py-3">
            Start Using AgroShakti
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Home;