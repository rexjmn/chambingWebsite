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
        if (!storedUser) throw new Error('No user after refresh');

        const onboardingDone = localStorage.getItem(`chambing_onboarding_done_${storedUser.id}`);

        if (!onboardingDone) {
          navigate('/onboarding', { replace: true });
          return;
        }

        const returnUrl = sessionStorage.getItem('chambing_return_url');
        sessionStorage.removeItem('chambing_return_url');

        if (returnUrl && returnUrl !== '/login' && returnUrl !== '/register') {
          navigate(returnUrl, { replace: true });
        } else {
          navigate(storedUser.tipo_usuario === 'cliente' ? '/service' : '/dashboard', { replace: true });
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
