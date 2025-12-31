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

const LoginForm = () => {
  const { t, common } = useTranslations();
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';
  const message = location.state?.message;

  // Schema de validación con seguridad mejorada
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

  const onSubmit = async (data) => {
    try {
      const sanitizedData = {
        email: sanitizeInput(data.email).toLowerCase(),
        password: data.password,
      };

      logger.form('Intentando login', { email: sanitizedData.email });
      await login(sanitizedData);
      logger.form('Login exitoso, redirigiendo');
      navigate(from, { replace: true });
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
