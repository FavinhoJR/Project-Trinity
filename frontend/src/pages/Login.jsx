import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Alert from '../components/Common/Alert';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      if (!result.success) {
        setError(result.error || 'Credenciales inválidas. Por favor, intente nuevamente.');
      }
    } catch (err) {
      setError('Error de conexión. Por favor, verifique su conexión a internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-container">
      {/* Background decorativo */}
      <div className="login-background">
        <div className="login-circle login-circle-1"></div>
        <div className="login-circle login-circle-2"></div>
        <div className="login-circle login-circle-3"></div>
      </div>

      <div className="login-content">
        {/* Logo y título */}
        <div className="login-header">
          <div className="login-logo">
            <Sparkles className="login-logo-icon" strokeWidth={1.5} />
          </div>
          <h1 className="login-title">TRINITY</h1>
          <p className="login-subtitle">ESTÉTICA & SPA</p>
          <div className="login-divider"></div>
        </div>

        {/* Formulario */}
        <div className="login-card">
          <h2 className="login-welcome">Bienvenido</h2>
          <p className="login-description">Ingrese sus credenciales para continuar</p>

          {error && (
            <Alert 
              type="error" 
              message={error} 
              onClose={() => setError('')}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="login-label">Correo Electrónico</label>
              <div className="login-input-wrapper">
                <Mail className="login-input-icon" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="login-input"
                  placeholder="correo@ejemplo.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="login-label">Contraseña</label>
              <div className="login-input-wrapper">
                <Lock className="login-input-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="login-input"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-password-toggle"
                  disabled={loading}
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <Sparkles size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>© 2025 Trinity Estética & SPA</p>
          <p>Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
