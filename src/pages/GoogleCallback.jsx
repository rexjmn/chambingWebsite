import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.scss';

const GoogleCallback = () => {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const completeGoogleLogin = async () => {
      try {
        await refreshUser();
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (!storedUser?.foto_perfil) {
          localStorage.setItem('chambing_needs_onboarding', 'true');
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch {
        setError('No se pudo completar el inicio de sesión con Google.');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    completeGoogleLogin();
  }, []);

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <p style={{ textAlign: 'center', color: '#ef4444' }}>{error}</p>
            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
              Redirigiendo al login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <p style={{ textAlign: 'center', color: '#475569' }}>
            Completando inicio de sesión con Google...
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleCallback;
