import axios from 'axios';

// Backend base URL: point to Express server (includes /api prefix)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const ACCESS_KEY = 'agro_access_token';
export const REFRESH_KEY = 'agro_refresh_token';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If unauthorized, clear tokens and redirect to auth page
    if (error.response?.status === 401) {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;