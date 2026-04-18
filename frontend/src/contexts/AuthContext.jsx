import React, { createContext, useContext, useEffect, useState } from 'react';
import apiService from '../services/api';

const AuthContext = createContext(null);

function decodeToken(token) {
  if (!token) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      nombre: payload.nombre || null
    };
  } catch {
    return null;
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => decodeToken(localStorage.getItem('token')));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const decodedUser = decodeToken(token);

    if (token && !decodedUser) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    setUser(decodedUser);
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      const data = await apiService.login(email, password);

      if (!data?.token) {
        return { success: false, error: 'Credenciales incorrectas' };
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user || decodeToken(data.token));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'No se pudo iniciar sesión' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: () => Boolean(token && user),
    hasRole: (roles) => {
      if (!user) {
        return false;
      }

      return Array.isArray(roles) ? roles.includes(user.role) : user.role === roles;
    },
    getAuthHeaders: () => (token ? { Authorization: `Bearer ${token}` } : {})
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
