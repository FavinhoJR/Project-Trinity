import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Decodificar el token para obtener información del usuario
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.sub,
          email: payload.email,
          role: payload.role
        });
      } catch (error) {
        console.error('Error decoding token:', error);
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      console.log('🔧 API_URL usado para login:', API_URL);
      console.log('Intentando login con:', { email, password });
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (response.ok && data.token) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        
        // Decodificar el token
        try {
          const payload = JSON.parse(atob(data.token.split('.')[1]));
          console.log('Token decodificado:', payload);
          
          setUser({
            id: payload.sub,
            email: payload.email,
            role: payload.role
          });
          
          return { success: true };
        } catch (decodeError) {
          console.error('Error decodificando token:', decodeError);
          return { success: false, error: 'Error en el token recibido' };
        }
      } else {
        console.error('Error en login:', data);
        return { success: false, error: data.error || 'Credenciales incorrectas' };
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      return { success: false, error: `Error de conexión con ${API_URL}` };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
    getAuthHeaders
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
