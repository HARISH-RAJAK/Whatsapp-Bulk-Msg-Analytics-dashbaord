import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('clickncult_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session on load
    api.getMe()
      .then((res) => {
        if (res?.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('clickncult_user', JSON.stringify(res.data.user));
        } else {
          setUser(null);
          localStorage.removeItem('clickncult_user');
        }
      })
      .catch(() => {
        // If unauthenticated
        setUser(null);
        localStorage.removeItem('clickncult_user');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res?.data?.user) {
      setUser(res.data.user);
      localStorage.setItem('clickncult_user', JSON.stringify(res.data.user));
    }
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      localStorage.removeItem('clickncult_user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

