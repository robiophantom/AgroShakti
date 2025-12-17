import api, { ACCESS_KEY, REFRESH_KEY } from './Api';

// Auth service wired to agroshakti-backend `/api/auth/*` endpoints
export const authService = {
  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    // backend returns { success, message, data: { user, accessToken, refreshToken } }
    const payload = data?.data || {};
    const { user, accessToken, refreshToken } = payload;
    if (accessToken) {
      localStorage.setItem(ACCESS_KEY, accessToken);
    }
    if (refreshToken) {
      localStorage.setItem(REFRESH_KEY, refreshToken);
    }
    return payload;
  },

  async signup(userData) {
    const { data } = await api.post('/auth/register', userData);
    // returns created user only
    return data?.data;
  },

  async getCurrentUser() {
    const { data } = await api.get('/auth/me');
    return data?.data;
  },

  async logout() {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Ignore backend logout errors, still clear client state
    } finally {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
  },

  async updateProfile(payload) {
    const { data } = await api.put('/auth/profile', payload);
    return data?.data;
  }
};