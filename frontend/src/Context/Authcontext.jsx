import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../Services/Auth';
import { ACCESS_KEY, REFRESH_KEY } from '../Services/Api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const accessToken = localStorage.getItem(ACCESS_KEY);
      if (!accessToken) {
        setLoading(false);
        return;
      }
      const me = await authService.getCurrentUser();
      setUser(me);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const me = await authService.getCurrentUser();
      setUser(me);
      return me;
    } catch (error) {
      console.error('Refresh user failed:', error);
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const result = await authService.login(credentials);
      setUser(result.user);
      return result;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      // Only create the account; do NOT auto-login.
      const created = await authService.signup(userData);
      return created;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};