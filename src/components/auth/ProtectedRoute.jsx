import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading } = useAuth();

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(37, 64, 255, 0.1)',
          borderTopColor: '#2540FF',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: '#64748b', fontWeight: '500' }}>Verificando acceso...</p>
      </div>
    );
  }

  // Si no está autenticado, redirigir al home
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Si se requieren roles específicos, verificar
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user.tipo_usuario);
    
    if (!hasRequiredRole) {
      // Si no tiene el rol requerido, redirigir al dashboard normal
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Usuario autenticado y con el rol correcto
  return children;
};

export default ProtectedRoute;