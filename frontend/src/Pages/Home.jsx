import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, MessageSquare, Camera, Globe } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen home-bg">
      {/* Glass Overlay with soft farm gradient */}
      <div className="min-h-screen home-overlay flex flex-col">
        <nav className="bg-white/90 backdrop-blur-md shadow-sm border-b border-emerald-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Sprout className="text-primary-700 w-8 h-8" />
                <span className="text-2xl font-bold bg-gradient-to-r from-primary-800 via-emerald-700 to-amber-700 bg-clip-text text-transparent">
                  AgroShakti
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/auth"
                  className="btn-secondary hidden sm:inline-flex"
                >
                  Login
                </Link>
                <Link
                  to="/auth"
                  className="btn-primary"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 flex items-center">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
              {/* Hero copy */}
              <div>
                <p className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-emerald-800/90 text-emerald-50 tracking-wide shadow-sm mb-4">
                  Built for Indian farmers — crops, soil, weather & schemes
                </p>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight bg-gradient-to-br from-emerald-900 via-emerald-800 to-amber-800 bg-clip-text text-transparent">
                  Your AI-powered farming partner in the field
                </h1>
                <p className="text-base md:text-lg text-emerald-950/80 max-w-xl">
                  Ask in your own language about crops, soil health, government schemes,
                  pests, weather and more. AgroShakti listens, explains and guides you
                  like a trusted village expert.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    to="/auth"
                    className="btn-primary text-base px-8 py-3"
                  >
                    Start chatting with AgroShakti
                  </Link>
                  <Link
                    to="/auth"
                    className="btn-secondary text-base px-8 py-3"
                  >
                    Login to your farm dashboard
                  </Link>
                </div>
              </div>

              {/* Feature cards */}
              <div className="grid sm:grid-cols-2 gap-5 md:gap-6">
                <div className="card bg-white/95 border border-emerald-100 shadow-md">
                  <MessageSquare className="w-10 h-10 text-primary-700 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-1 text-emerald-900 text-center">
                    AI Kisan Chatbot
                  </h3>
                  <p className="text-sm text-emerald-950/80 text-center">
                    Ask about seeds, fertilizers, irrigation, pests and best practices.
                    Get simple, practical advice anytime.
                  </p>
                </div>

                <div className="card bg-white/95 border border-emerald-100 shadow-md">
                  <Camera className="w-10 h-10 text-primary-700 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-1 text-emerald-900 text-center">
                    Disease Detection
                  </h3>
                  <p className="text-sm text-emerald-950/80 text-center">
                    Upload a photo of your crop and let AgroShakti detect diseases
                    and suggest treatments.
                  </p>
                </div>

                <div className="card bg-white/95 border border-amber-100 shadow-md sm:col-span-2">
                  <div className="flex items-start gap-3">
                    <Globe className="w-8 h-8 text-amber-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold mb-1 text-amber-900">
                        Bharat-wide language support
                      </h3>
                      <p className="text-sm text-amber-950/80">
                        Talk to AgroShakti in English, Hindi and other Indian languages
                        with text or voice. Designed for real farmers, not just apps.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
