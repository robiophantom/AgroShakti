import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Hooks/useauth';
import toast from 'react-hot-toast';
import { Mail, Lock, Phone } from 'lucide-react';

const Login = () => {
  const [loginMethod, setLoginMethod] = useState('email');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: ''
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loginMethod !== 'email') {
      toast.error('Phone login is not enabled yet. Please use email and password.');
      return;
    }

    if (!formData.email || !formData.password) {
      toast.error('Please enter email and password.');
      return;
    }

    try {
      await login({
        email: formData.email,
        password: formData.password
      });
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Login failed');
      console.error(error);
    }
  };

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setLoginMethod('email')}
          className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
            loginMethod === 'email'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          <Mail size={18} />
          Email
        </button>
        <button
          onClick={() => setLoginMethod('phone')}
          className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
            loginMethod === 'phone'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          <Phone size={18} />
          Phone
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {loginMethod === 'email' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="+91 1234567890"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full btn-primary"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;