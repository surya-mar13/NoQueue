import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('noqueue_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('noqueue_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('noqueue_token');
      if (storedToken) {
        try {
          const res = await axiosClient.get('/auth/me');
          if (res.success) {
            setUser(res.data);
            localStorage.setItem('noqueue_user', JSON.stringify(res.data));
          }
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    if (res.success) {
      const { user: userData, token: jwtToken } = res.data;
      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem('noqueue_token', jwtToken);
      localStorage.setItem('noqueue_user', JSON.stringify(userData));
      return userData;
    }
  };

  const register = async (name, email, password, role = 'user') => {
    const res = await axiosClient.post('/auth/register', { name, email, password, role });
    if (res.success) {
      const { user: userData, token: jwtToken } = res.data;
      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem('noqueue_token', jwtToken);
      localStorage.setItem('noqueue_user', JSON.stringify(userData));
      return userData;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('noqueue_token');
    localStorage.removeItem('noqueue_user');
  };

  const isAdmin = user?.role === 'admin';
  const isVendor = user?.role === 'vendor' || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin, isVendor }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};