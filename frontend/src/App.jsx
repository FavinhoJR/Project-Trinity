import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Customers from './pages/Customers';
import Services from './pages/Services';
import Users from './pages/Users';
import Reports from './pages/Reports';

// Protected Route Component
const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, hasRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading"></div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !hasRole(roles)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/appointments" element={
        <ProtectedRoute roles={['admin', 'recepcion', 'estilista']}>
          <Appointments />
        </ProtectedRoute>
      } />
      
      <Route path="/customers" element={
        <ProtectedRoute roles={['admin', 'recepcion']}>
          <Customers />
        </ProtectedRoute>
      } />
      
      <Route path="/services" element={
        <ProtectedRoute roles={['admin', 'recepcion']}>
          <Services />
        </ProtectedRoute>
      } />
      
      <Route path="/users" element={
        <ProtectedRoute roles={['admin']}>
          <Users />
        </ProtectedRoute>
      } />
      
      <Route path="/reports" element={
        <ProtectedRoute roles={['admin', 'recepcion']}>
          <Reports />
        </ProtectedRoute>
      } />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
