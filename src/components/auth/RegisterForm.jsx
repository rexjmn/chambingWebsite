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
  isValidDUI,
  validatePasswordStrength,
  detectSQLInjection,
  detectXSS
} from '../../utils/security';
import { logger } from '../../utils/logger';
import '../../styles/auth.scss';
import { User, Mail, Phone, IdCard, MapPin, Home, Lock, Eye, EyeOff, AlertCircle, Info, Users } from 'lucide-react';

// Build validation schema with i18n messages
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
  dui: yup.string()
    .optional()
    .test('is-valid-dui', t('auth.register.validation.duiInvalid'), value => !value || isValidDUI(value)),
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
  const { t, common } = useTranslations();
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
    defaultValues: {
      tipo_usuario: 'cliente',
    },
  });

  const watchTipo = watch('tipo_usuario');
  const watchDepartamento = watch('departamento');
  const watchPassword = watch('password');

  // Limpiar municipio cuando cambia el departamento
  useEffect(() => {
    if (watchDepartamento) {
      setValue('municipio', '');
    }
  }, [watchDepartamento, setValue]);

  // Analizar fortaleza de contraseña
  useEffect(() => {
    if (watchPassword) {
      setPasswordStrength(validatePasswordStrength(watchPassword));
    } else {
      setPasswordStrength(null);
    }
  }, [watchPassword]);

  // Limpiar errores automáticamente
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const onSubmit = async (data) => {
    try {
      logger.form('Iniciando registro', { email: data.email });

      clearError();

      // Sanitizar y preparar datos
      const { direccion_detalle } = data;

      const sanitizedData = {
        nombre: sanitizeInput(data.nombre),
        apellido: sanitizeInput(data.apellido),
        email: sanitizeInput(data.email).toLowerCase(),
        telefono: data.telefono.replace(/\D/g, ''), // Solo dígitos
        dui: data.dui || '',
        departamento: data.departamento,
        municipio: data.municipio,
        direccion: sanitizeInput(direccion_detalle || ''),
        password: data.password,
        tipo_usuario: data.tipo_usuario,
      };

      logger.form('Enviando datos sanitizados');

      await registerUser(sanitizedData);

      logger.form('Registro exitoso');

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

  // ... resto del código anterior ...

  return (
    <div className="auth-page">
      <div className="auth-container auth-container-wide">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-icon"><User size={32} /></div>
            <h1 className="auth-title">{t('auth.register.title')}</h1>
            <p className="auth-subtitle">{t('auth.register.subtitle')}</p>
          </div>

          {/* Loading Bar */}
          {loading && (
            <div className="auth-loading">
              <div className="loading-bar"></div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="auth-alert alert-error">
              <AlertCircle size={20} className="alert-icon" />
              <span className="alert-message">{error}</span>
              <button className="alert-close" onClick={clearError}>×</button>
            </div>
          )}

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
            {/* Tipo de Usuario */}
            <div className="form-group">
              <label className="form-label">
                {t('auth.register.userType')}
                <span className="label-required">*</span>
              </label>
              <div className="input-wrapper">
                <Users size={20} className="input-icon" />
                <select
                  {...register('tipo_usuario')}
                  className={`form-select ${errors.tipo_usuario ? 'input-error' : ''}`}
                >
                  <option value="cliente">{t('auth.register.client')}</option>
                  <option value="trabajador">{t('auth.register.worker')}</option>
                </select>
              </div>
              <div className="form-helper">
                {watchTipo === 'cliente' ?
                  t('auth.register.clientHelp') :
                  t('auth.register.workerHelp')}
              </div>
            </div>

            {/* Información Personal */}
            <h3 className="form-section-title"><User size={20} /> {t('auth.register.sections.personalInfo')}</h3>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  {t('auth.register.name')} <span className="label-required">*</span>
                </label>
                <div className="input-wrapper">
                  <User size={20} className="input-icon" />
                  <input
                    {...register('nombre')}
                    type="text"
                    className={`form-input ${errors.nombre ? 'input-error' : ''}`}
                    placeholder={t('auth.register.placeholders.name')}
                    maxLength={50}
                  />
                </div>
                {errors.nombre && <div className="form-error"><AlertCircle size={16} className="error-icon" />{errors.nombre.message}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('auth.register.lastName')} <span className="label-required">*</span>
                </label>
                <div className="input-wrapper">
                  <User size={20} className="input-icon" />
                  <input
                    {...register('apellido')}
                    type="text"
                    className={`form-input ${errors.apellido ? 'input-error' : ''}`}
                    placeholder={t('auth.register.placeholders.lastName')}
                    maxLength={50}
                  />
                </div>
                {errors.apellido && <div className="form-error"><AlertCircle size={16} className="error-icon" />{errors.apellido.message}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                {t('auth.register.email')} <span className="label-required">*</span>
              </label>
              <div className="input-wrapper">
                <Mail size={20} className="input-icon" />
                <input
                  {...register('email')}
                  type="email"
                  className={`form-input ${errors.email ? 'input-error' : ''}`}
                  placeholder={t('auth.register.placeholders.email')}
                  autoComplete="email"
                  maxLength={255}
                />
              </div>
              {errors.email && <div className="form-error"><AlertCircle size={16} className="error-icon" />{errors.email.message}</div>}
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  {t('auth.register.phone')} <span className="label-required">*</span>
                </label>
                <div className="input-wrapper">
                  <Phone size={20} className="input-icon" />
                  <input
                    {...register('telefono')}
                    type="tel"
                    className={`form-input ${errors.telefono ? 'input-error' : ''}`}
                    placeholder={t('auth.register.placeholders.phone')}
                    maxLength={8}
                  />
                </div>
                {errors.telefono ? (
                  <div className="form-error"><AlertCircle size={16} className="error-icon" />{errors.telefono.message}</div>
                ) : (
                  <div className="form-helper">{t('auth.register.helperTexts.phone')}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('auth.register.dui')} <span className="label-optional">(Opcional)</span>
                </label>
                <div className="input-wrapper">
                  <IdCard size={20} className="input-icon" />
                  <input
                    {...register('dui')}
                    type="text"
                    className={`form-input ${errors.dui ? 'input-error' : ''}`}
                    placeholder={t('auth.register.placeholders.dui')}
                    maxLength={10}
                  />
                </div>
                {errors.dui ? (
                  <div className="form-error"><AlertCircle size={16} className="error-icon" />{errors.dui.message}</div>
                ) : (
                  <div className="form-helper">{t('auth.register.helperTexts.dui')}</div>
                )}
              </div>
            </div>

            {/* Ubicación */}
            <h3 className="form-section-title"><MapPin size={20} /> {t('auth.register.sections.location')}</h3>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  {t('auth.register.department')} <span className="label-required">*</span>
                </label>
                <div className="input-wrapper">
                  <MapPin size={20} className="input-icon" />
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
                {errors.departamento && <div className="form-error"><AlertCircle size={16} className="error-icon" />{errors.departamento.message}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('auth.register.municipality')} <span className="label-required">*</span>
                </label>
                <div className="input-wrapper">
                  <MapPin size={20} className="input-icon" />
                  <select
                    {...register('municipio')}
                    className={`form-select ${errors.municipio ? 'input-error' : ''}`}
                    disabled={!watchDepartamento}
                  >
                    <option value="">
                      {!watchDepartamento ? t('auth.register.placeholders.department') : t('auth.register.placeholders.municipality')}
                    </option>
                    {watchDepartamento && municipiosPorDepartamento[watchDepartamento]?.map((mun) => (
                      <option key={mun} value={mun}>{mun}</option>
                    ))}
                  </select>
                </div>
                {errors.municipio && <div className="form-error"><AlertCircle size={16} className="error-icon" />{errors.municipio.message}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                {t('auth.register.address')} <span className="label-optional">(Opcional)</span>
              </label>
              <div className="input-wrapper">
                <Home size={20} className="input-icon" />
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

            {/* Seguridad */}
            <h3 className="form-section-title"><Lock size={20} /> {t('auth.register.sections.security')}</h3>

            <div className="form-group">
              <label className="form-label">
                {t('auth.register.password')} <span className="label-required">*</span>
              </label>
              <div className="input-wrapper">
                <Lock size={20} className="input-icon" />
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
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              {errors.password && <div className="form-error"><AlertCircle size={16} className="error-icon" />{errors.password.message}</div>}

              {/* Password Strength Meter */}
              {passwordStrength && (
                <div className="password-strength">
                  <div className="strength-label">
                    <span>{t('auth.register.passwordStrength.label')}:</span>
                    <span className={`strength-text ${getPasswordStrengthClass()}`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="strength-bar">
                    <div className={`strength-fill ${getPasswordStrengthClass()}`}></div>
                  </div>
                  <div className="strength-requirements">
                    <div className={`requirement ${passwordStrength.minLength ? 'requirement-met' : ''}`}>
                      <span className="requirement-icon">{passwordStrength.minLength ? '✓' : '○'}</span>
                      {t('auth.register.passwordStrength.minLength')}
                    </div>
                    <div className={`requirement ${passwordStrength.hasUpperCase ? 'requirement-met' : ''}`}>
                      <span className="requirement-icon">{passwordStrength.hasUpperCase ? '✓' : '○'}</span>
                      {t('auth.register.passwordStrength.hasUpperCase')}
                    </div>
                    <div className={`requirement ${passwordStrength.hasNumber ? 'requirement-met' : ''}`}>
                      <span className="requirement-icon">{passwordStrength.hasNumber ? '✓' : '○'}</span>
                      {t('auth.register.passwordStrength.hasNumber')}
                    </div>
                    <div className={`requirement ${passwordStrength.hasSpecialChar ? 'requirement-met' : ''}`}>
                      <span className="requirement-icon">{passwordStrength.hasSpecialChar ? '✓' : '○'}</span>
                      {t('auth.register.passwordStrength.hasSpecialChar')}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                {t('auth.register.confirmPassword')} <span className="label-required">*</span>
              </label>
              <div className="input-wrapper">
                <Lock size={20} className="input-icon" />
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
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              {errors.confirmPassword && <div className="form-error"><AlertCircle size={16} className="error-icon" />{errors.confirmPassword.message}</div>}
            </div>

            {/* Info para trabajadores */}
            {watchTipo === 'trabajador' && (
              <div className="auth-alert alert-info">
                <Info size={20} className="alert-icon" />
                <span className="alert-message">
                  {t('auth.register.helperTexts.workerInfo')}
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={`form-submit ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
            >
              {loading ? t('auth.register.registerButtonLoading') : t('auth.register.registerButton')}
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <span className="divider-text">{common.or}</span>
            </div>

            {/* Footer */}
            <div className="auth-footer">
              <p className="footer-text">
                {t('auth.register.haveAccount')}{' '}
                <Link to="/login" className="footer-link">
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
