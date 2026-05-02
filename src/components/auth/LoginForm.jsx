import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { sanitizeInput, isValidEmail } from '../../utils/security';
import { logger } from '../../utils/logger';
import '../../styles/auth.scss';
import { Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const GOOGLE_ICON = (
  <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const LoginForm = () => {
  const { t, common } = useTranslations();
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const message = location.state?.message;

  const schema = yup.object().shape({
    email: yup
      .string()
      .email(t('auth.validation.emailInvalid'))
      .required(t('auth.validation.required'))
      .test('is-valid-email', t('auth.validation.emailInvalid'), value => isValidEmail(value)),
    password: yup
      .string()
      .required(t('auth.validation.required')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const handleGoogleLogin = () => {
    const returnUrl = sessionStorage.getItem('chambing_return_url') || location.state?.from;
    if (returnUrl && returnUrl !== '/login' && returnUrl !== '/register') {
      sessionStorage.setItem('chambing_return_url', returnUrl);
    }
    const apiUrl = import.meta.env.VITE_API_URL ||
      (import.meta.env.PROD ? 'https://chambing.com/api' : 'http://localhost:3000/api');
    window.location.href = `${apiUrl}/auth/google`;
  };

  const onSubmit = async (data) => {
    try {
      const sanitizedData = {
        email: sanitizeInput(data.email).toLowerCase(),
        password: data.password,
      };

      logger.form('Intentando login', { email: sanitizedData.email });
      await login(sanitizedData);
      logger.form('Login exitoso, redirigiendo');

      const pendingOnboarding = localStorage.getItem('chambing_pending_onboarding');
      if (pendingOnboarding === sanitizedData.email) {
        localStorage.removeItem('chambing_pending_onboarding');
        navigate('/onboarding', { replace: true });
        return;
      }

      const returnUrl = sessionStorage.getItem('chambing_return_url');
      sessionStorage.removeItem('chambing_return_url');

      if (returnUrl && returnUrl !== '/login' && returnUrl !== '/register') {
        navigate(returnUrl, { replace: true });
      } else {
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        const userType = storedUser?.tipo_usuario || 'cliente';
        navigate(userType === 'cliente' ? '/service' : '/dashboard', { replace: true });
      }
    } catch (error) {
      logger.error('Error en login:', error.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-icon">
              <Lock size={32} />
            </div>
            <h1 className="auth-title">{t('auth.login.title')}</h1>
            <p className="auth-subtitle">{t('auth.login.subtitle')}</p>
          </div>

          {/* Success Message */}
          {message && (
            <div className="auth-alert alert-success">
              <CheckCircle size={20} className="alert-icon" />
              <span className="alert-message">{message}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="auth-alert alert-error">
              <AlertCircle size={20} className="alert-icon" />
              <span className="alert-message">{error}</span>
            </div>
          )}

          {/* Loading Bar */}
          {loading && (
            <div className="auth-loading">
              <div className="loading-bar"></div>
            </div>
          )}

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div className="form-group">
              <label className="form-label">
                {t('auth.login.email')}
                <span className="label-required">*</span>
              </label>
              <div className="input-wrapper">
                <Mail size={20} className="input-icon" />
                <input
                  {...register('email')}
                  type="email"
                  className={`form-input ${errors.email ? 'input-error' : ''}`}
                  placeholder={t('auth.login.email')}
                  autoComplete="email"
                  maxLength={255}
                />
              </div>
              {errors.email && (
                <div className="form-error">
                  <AlertCircle size={16} className="error-icon" />
                  {errors.email.message}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">
                {t('auth.login.password')}
                <span className="label-required">*</span>
              </label>
              <div className="input-wrapper">
                <Lock size={20} className="input-icon" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input input-with-end-icon ${errors.password ? 'input-error' : ''}`}
                  placeholder={t('auth.login.password')}
                  autoComplete="current-password"
                  maxLength={128}
                />
                <button
                  type="button"
                  className="toggle-password input-icon-end"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              {errors.password && (
                <div className="form-error">
                  <AlertCircle size={16} className="error-icon" />
                  {errors.password.message}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`form-submit ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
            >
              {loading ? t('auth.login.loginButtonLoading') : t('auth.login.loginButton')}
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <span className="divider-text">{common.or}</span>
            </div>

            {/* Google Login */}
            <button
              type="button"
              className="btn-google"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              {GOOGLE_ICON}
              Continuar con Google
            </button>

            {/* Footer */}
            <div className="auth-footer">
              <p className="footer-text">
                {t('auth.login.noAccount')}{' '}
                <Link to="/register" className="footer-link">
                  {t('auth.login.registerHere')}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
