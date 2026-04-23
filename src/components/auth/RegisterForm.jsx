import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  sanitizeInput,
  isValidEmail,
  isValidPhone,
  validatePasswordStrength,
  detectSQLInjection,
  detectXSS
} from '../../utils/security';
import { logger } from '../../utils/logger';
import '../../styles/auth.scss';
import {
  User, Mail, Phone, MapPin, Home,
  Lock, Eye, EyeOff, AlertCircle, Info,
  Briefcase, Search, Shield, Star, ChevronRight
} from 'lucide-react';
import heroWomanImg from '../../assets/images/herowoman.png';

const buildValidationSchema = (t) => yup.object().shape({
  nombre: yup.string()
    .required(t('auth.register.validation.nameRequired'))
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .test('no-sql-injection', t('auth.register.validation.invalidCharacters'), value => !detectSQLInjection(value))
    .test('no-xss', t('auth.register.validation.invalidCharacters'), value => !detectXSS(value)),
  apellido: yup.string()
    .required(t('auth.register.validation.lastNameRequired'))
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .test('no-sql-injection', t('auth.register.validation.invalidCharacters'), value => !detectSQLInjection(value))
    .test('no-xss', t('auth.register.validation.invalidCharacters'), value => !detectXSS(value)),
  email: yup.string()
    .email(t('auth.register.validation.emailInvalid'))
    .required(t('auth.register.validation.emailRequired'))
    .test('is-valid-email', t('auth.register.validation.emailInvalid'), value => isValidEmail(value)),
  telefono: yup.string()
    .required(t('auth.register.validation.phoneRequired'))
    .test('is-valid-phone', t('auth.register.validation.phoneInvalid'), value => isValidPhone(value)),
  departamento: yup.string().required(t('auth.register.validation.departmentRequired')),
  municipio: yup.string().required(t('auth.register.validation.municipalityRequired')),
  direccion_detalle: yup.string().optional().max(255, 'La dirección no puede exceder 255 caracteres'),
  password: yup.string()
    .min(8, t('auth.register.validation.passwordMin'))
    .required(t('auth.register.validation.passwordRequired')),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], t('auth.register.validation.passwordMatch'))
    .required(t('auth.register.validation.confirmPasswordRequired')),
  tipo_usuario: yup.string().oneOf(['cliente', 'trabajador']).required(t('auth.register.validation.userTypeRequired')),
});

const departamentosSV = [
  'Ahuachapán', 'Cabañas', 'Chalatenango', 'Cuscatlán', 'La Libertad',
  'La Paz', 'La Unión', 'Morazán', 'San Miguel', 'San Salvador',
  'San Vicente', 'Santa Ana', 'Sonsonate', 'Usulután'
];

const municipiosPorDepartamento = {
  'San Salvador': ['San Salvador', 'Mejicanos', 'Soyapango', 'Apopa', 'Delgado', 'Ilopango', 'San Marcos', 'Ayutuxtepeque', 'Cuscatancingo'],
  'La Libertad': ['Santa Tecla', 'Antiguo Cuscatlán', 'Nuevo Cuscatlán', 'San Juan Opico', 'Colón', 'La Libertad', 'Quezaltepeque'],
  'Santa Ana': ['Santa Ana', 'Metapán', 'Chalchuapa', 'Candelaria de la Frontera', 'Coatepeque', 'El Congo', 'Texistepeque'],
  'San Miguel': ['San Miguel', 'Usulután', 'Santiago de María', 'Chinameca', 'Nueva Guadalupe', 'San Rafael Oriente'],
  'Sonsonate': ['Sonsonate', 'Acajutla', 'Izalco', 'Nahuizalco', 'Sonzacate', 'Armenia', 'Caluco'],
};

const RegisterForm = () => {
  const { t } = useTranslations();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const { register: registerUser, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(buildValidationSchema(t)),
    defaultValues: { tipo_usuario: 'cliente' },
  });

  const watchTipo = watch('tipo_usuario');
  const watchDepartamento = watch('departamento');
  const watchPassword = watch('password');

  useEffect(() => {
    if (watchDepartamento) setValue('municipio', '');
  }, [watchDepartamento, setValue]);

  useEffect(() => {
    if (watchPassword) setPasswordStrength(validatePasswordStrength(watchPassword));
    else setPasswordStrength(null);
  }, [watchPassword]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 8000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const onSubmit = async (data) => {
    try {
      logger.form('Iniciando registro', { email: data.email });
      clearError();

      const sanitizedData = {
        nombre: sanitizeInput(data.nombre),
        apellido: sanitizeInput(data.apellido),
        email: sanitizeInput(data.email).toLowerCase(),
        telefono: data.telefono.replace(/\D/g, ''),
        departamento: data.departamento,
        municipio: data.municipio,
        direccion: sanitizeInput(data.direccion_detalle || ''),
        password: data.password,
        tipo_usuario: data.tipo_usuario,
      };

      await registerUser(sanitizedData);
      logger.form('Registro exitoso');

      // Signal that the next login should trigger onboarding
      localStorage.setItem('chambing_pending_onboarding', sanitizedData.email);

      navigate('/login', {
        state: {
          message: t('success.register') + ' ' + t('auth.login.subtitle'),
          email: sanitizedData.email
        }
      });
    } catch (error) {
      logger.error('Error en registro:', error.message);
    }
  };

  const getPasswordStrengthClass = () => {
    if (!passwordStrength) return '';
    if (passwordStrength.strength <= 2) return 'strength-weak';
    if (passwordStrength.strength <= 3) return 'strength-medium';
    return 'strength-strong';
  };

  const getPasswordStrengthText = () => {
    if (!passwordStrength) return '';
    if (passwordStrength.strength <= 2) return t('auth.register.passwordStrength.weak');
    if (passwordStrength.strength <= 3) return t('auth.register.passwordStrength.medium');
    return t('auth.register.passwordStrength.strong');
  };

  return (
    <div className="register-page">

      {/* ── Left brand panel (desktop only) ── */}
      <div className="register-brand" aria-hidden="true">
        <div className="register-brand__orb register-brand__orb--1" />
        <div className="register-brand__orb register-brand__orb--2" />
        <div className="register-brand__orb register-brand__orb--3" />

        <div className="register-brand__inner">
          {/* Logo */}
          <div className="register-brand__logo">
            <span className="register-brand__logo-mark">C</span>
            <span className="register-brand__logo-name">Chambing</span>
          </div>

          {/* Headline + trust */}
          <div className="register-brand__text-area">
            <h2 className="register-brand__headline">
              {watchTipo === 'trabajador'
                ? 'Tu próximo cliente te está buscando'
                : 'Encuentra al profesional ideal'}
            </h2>
            <p className="register-brand__sub">
              {watchTipo === 'trabajador'
                ? 'Crea tu perfil, muestra tus habilidades y comienza a recibir trabajo hoy mismo.'
                : 'Miles de profesionales verificados listos para ayudarte en El Salvador.'}
            </p>

            <div className="register-brand__trust">
              <div className="register-brand__trust-item">
                <Shield size={16} strokeWidth={2} />
                <span>Profesionales verificados</span>
              </div>
              <div className="register-brand__trust-item">
                <Star size={16} strokeWidth={2} />
                <span>+4.8 calificación promedio</span>
              </div>
              <div className="register-brand__trust-item">
                <Search size={16} strokeWidth={2} />
                <span>Fácil de usar desde tu celular</span>
              </div>
            </div>
          </div>

          {/* Hero image anchored at the bottom */}
          <div className="register-brand__image-wrap">
            <img
              src={heroWomanImg}
              alt="Profesional de servicios del hogar"
              className="register-brand__hero-img"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="register-form-panel">
        <div className="register-form-panel__scroll">

          {/* Mobile logo */}
          <div className="register-mobile-logo">
            <span className="register-brand__logo-mark">C</span>
            <span className="register-brand__logo-name">Chambing</span>
          </div>

          <div className="register-header">
            <h1 className="register-title">{t('auth.register.title')}</h1>
            <p className="register-subtitle">{t('auth.register.subtitle')}</p>
          </div>

          {/* Loading bar */}
          {loading && (
            <div className="auth-loading">
              <div className="loading-bar" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="auth-alert alert-error">
              <AlertCircle size={18} className="alert-icon" />
              <span className="alert-message">{error}</span>
              <button className="alert-close" onClick={clearError} aria-label="Cerrar">×</button>
            </div>
          )}

          <form className="register-form" onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* ── Role selection ── */}
            <div className="role-section">
              <p className="role-section__label">{t('auth.register.userType')}</p>
              <div className="role-cards">

                <button
                  type="button"
                  className={`role-card ${watchTipo === 'cliente' ? 'role-card--active' : ''}`}
                  onClick={() => setValue('tipo_usuario', 'cliente', { shouldValidate: true })}
                >
                  <div className="role-card__icon-wrap">
                    <Search size={22} strokeWidth={2} />
                  </div>
                  <div className="role-card__text">
                    <strong>Soy Cliente</strong>
                    <span>Busco profesionales</span>
                  </div>
                  {watchTipo === 'cliente' && (
                    <div className="role-card__check">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  className={`role-card ${watchTipo === 'trabajador' ? 'role-card--active' : ''}`}
                  onClick={() => setValue('tipo_usuario', 'trabajador', { shouldValidate: true })}
                >
                  <div className="role-card__icon-wrap">
                    <Briefcase size={22} strokeWidth={2} />
                  </div>
                  <div className="role-card__text">
                    <strong>Soy Trabajador</strong>
                    <span>Ofrezco mis servicios</span>
                  </div>
                  {watchTipo === 'trabajador' && (
                    <div className="role-card__check">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  )}
                </button>

              </div>
              {watchTipo === 'trabajador' && (
                <div className="role-helper">
                  <Info size={14} strokeWidth={2} />
                  <span>{t('auth.register.workerHelp')}</span>
                </div>
              )}
              <input type="hidden" {...register('tipo_usuario')} />
            </div>

            {/* ── Personal info ── */}
            <div className="form-section">
              <h3 className="form-section__title">
                <User size={16} strokeWidth={2.5} />
                {t('auth.register.sections.personalInfo')}
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    {t('auth.register.name')} <span className="label-required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      {...register('nombre')}
                      type="text"
                      className={`form-input ${errors.nombre ? 'input-error' : ''}`}
                      placeholder={t('auth.register.placeholders.name')}
                      maxLength={50}
                    />
                  </div>
                  {errors.nombre && (
                    <div className="form-error">
                      <AlertCircle size={14} className="error-icon" />
                      {errors.nombre.message}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t('auth.register.lastName')} <span className="label-required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      {...register('apellido')}
                      type="text"
                      className={`form-input ${errors.apellido ? 'input-error' : ''}`}
                      placeholder={t('auth.register.placeholders.lastName')}
                      maxLength={50}
                    />
                  </div>
                  {errors.apellido && (
                    <div className="form-error">
                      <AlertCircle size={14} className="error-icon" />
                      {errors.apellido.message}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('auth.register.email')} <span className="label-required">*</span>
                </label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    {...register('email')}
                    type="email"
                    className={`form-input ${errors.email ? 'input-error' : ''}`}
                    placeholder={t('auth.register.placeholders.email')}
                    autoComplete="email"
                    maxLength={255}
                  />
                </div>
                {errors.email && (
                  <div className="form-error">
                    <AlertCircle size={14} className="error-icon" />
                    {errors.email.message}
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    {t('auth.register.phone')} <span className="label-required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <Phone size={18} className="input-icon" />
                    <input
                      {...register('telefono')}
                      type="tel"
                      className={`form-input ${errors.telefono ? 'input-error' : ''}`}
                      placeholder={t('auth.register.placeholders.phone')}
                      maxLength={8}
                    />
                  </div>
                  {errors.telefono ? (
                    <div className="form-error">
                      <AlertCircle size={14} className="error-icon" />
                      {errors.telefono.message}
                    </div>
                  ) : (
                    <div className="form-helper">{t('auth.register.helperTexts.phone')}</div>
                  )}
                </div>

              </div>
            </div>

            {/* ── Location ── */}
            <div className="form-section">
              <h3 className="form-section__title">
                <MapPin size={16} strokeWidth={2.5} />
                {t('auth.register.sections.location')}
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    {t('auth.register.department')} <span className="label-required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <MapPin size={18} className="input-icon" />
                    <select
                      {...register('departamento')}
                      className={`form-select ${errors.departamento ? 'input-error' : ''}`}
                    >
                      <option value="">{t('auth.register.placeholders.department')}</option>
                      {departamentosSV.map((dep) => (
                        <option key={dep} value={dep}>{dep}</option>
                      ))}
                    </select>
                  </div>
                  {errors.departamento && (
                    <div className="form-error">
                      <AlertCircle size={14} className="error-icon" />
                      {errors.departamento.message}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t('auth.register.municipality')} <span className="label-required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <MapPin size={18} className="input-icon" />
                    <select
                      {...register('municipio')}
                      className={`form-select ${errors.municipio ? 'input-error' : ''}`}
                      disabled={!watchDepartamento}
                    >
                      <option value="">
                        {!watchDepartamento
                          ? t('auth.register.placeholders.department')
                          : t('auth.register.placeholders.municipality')}
                      </option>
                      {watchDepartamento && municipiosPorDepartamento[watchDepartamento]?.map((mun) => (
                        <option key={mun} value={mun}>{mun}</option>
                      ))}
                    </select>
                  </div>
                  {errors.municipio && (
                    <div className="form-error">
                      <AlertCircle size={14} className="error-icon" />
                      {errors.municipio.message}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('auth.register.address')} <span className="label-optional">(Opcional)</span>
                </label>
                <div className="input-wrapper">
                  <Home size={18} className="input-icon" />
                  <textarea
                    {...register('direccion_detalle')}
                    className={`form-textarea form-input-no-icon ${errors.direccion_detalle ? 'input-error' : ''}`}
                    placeholder={t('auth.register.placeholders.address')}
                    rows={2}
                    maxLength={255}
                    style={{ paddingLeft: '3rem' }}
                  />
                </div>
              </div>
            </div>

            {/* ── Security ── */}
            <div className="form-section">
              <h3 className="form-section__title">
                <Lock size={16} strokeWidth={2.5} />
                {t('auth.register.sections.security')}
              </h3>

              <div className="form-group">
                <label className="form-label">
                  {t('auth.register.password')} <span className="label-required">*</span>
                </label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input input-with-end-icon ${errors.password ? 'input-error' : ''}`}
                    placeholder={t('auth.register.placeholders.password')}
                    autoComplete="new-password"
                    maxLength={128}
                  />
                  <button
                    type="button"
                    className="toggle-password input-icon-end"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Mostrar/ocultar contraseña"
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <div className="form-error">
                    <AlertCircle size={14} className="error-icon" />
                    {errors.password.message}
                  </div>
                )}

                {passwordStrength && (
                  <div className="password-strength">
                    <div className="strength-label">
                      <span>{t('auth.register.passwordStrength.label')}:</span>
                      <span className={`strength-text ${getPasswordStrengthClass()}`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="strength-bar">
                      <div className={`strength-fill ${getPasswordStrengthClass()}`} />
                    </div>
                    <div className="strength-requirements">
                      {[
                        { key: 'minLength', label: t('auth.register.passwordStrength.minLength') },
                        { key: 'hasUpperCase', label: t('auth.register.passwordStrength.hasUpperCase') },
                        { key: 'hasNumber', label: t('auth.register.passwordStrength.hasNumber') },
                        { key: 'hasSpecialChar', label: t('auth.register.passwordStrength.hasSpecialChar') },
                      ].map(({ key, label }) => (
                        <div key={key} className={`requirement ${passwordStrength[key] ? 'requirement-met' : ''}`}>
                          <span className="requirement-icon">{passwordStrength[key] ? '✓' : '○'}</span>
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('auth.register.confirmPassword')} <span className="label-required">*</span>
                </label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`form-input input-with-end-icon ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder={t('auth.register.placeholders.confirmPassword')}
                    autoComplete="new-password"
                    maxLength={128}
                  />
                  <button
                    type="button"
                    className="toggle-password input-icon-end"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Mostrar/ocultar confirmación"
                  >
                    {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="form-error">
                    <AlertCircle size={14} className="error-icon" />
                    {errors.confirmPassword.message}
                  </div>
                )}
              </div>

              {watchTipo === 'trabajador' && (
                <div className="auth-alert alert-info">
                  <Info size={18} className="alert-icon" />
                  <span className="alert-message">{t('auth.register.helperTexts.workerInfo')}</span>
                </div>
              )}
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              className={`register-submit ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  {t('auth.register.registerButtonLoading')}
                </>
              ) : (
                <>
                  {t('auth.register.registerButton')}
                  <ChevronRight size={18} strokeWidth={2.5} />
                </>
              )}
            </button>

            <div className="register-footer">
              <p>
                {t('auth.register.haveAccount')}{' '}
                <Link to="/login" className="register-footer__link">
                  {t('auth.register.loginHere')}
                </Link>
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
