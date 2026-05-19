import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const userRoles = [
    ...(Array.isArray(user?.roles) ? user.roles : []),
    ...(user?.tipo_usuario ? [String(user.tipo_usuario)] : []),
  ].map((role) => role.toLowerCase());

  // Solo bloquear la UI si aún no hay usuario (evita desmontar /onboarding en refreshUser)
  if (loading && !user) {
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

  if (!user) {
    sessionStorage.setItem('chambing_return_url', location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }

  const onboardingExempt =
    location.pathname === '/onboarding' ||
    location.pathname.startsWith('/auth/');

  if (user.onboarding_completado === false && !onboardingExempt) {
    return <Navigate to="/onboarding" replace />;
  }

  // Si se requieren roles específicos, verificar
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.includes(String(role).toLowerCase()),
    );
    
    if (!hasRequiredRole) {
      // Si no tiene el rol requerido, redirigir al dashboard normal
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Usuario autenticado y con el rol correcto
  return children;
};

export default ProtectedRoute;