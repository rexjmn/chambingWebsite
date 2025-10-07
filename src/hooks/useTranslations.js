import { useTranslation } from 'react-i18next';
import { 
  changeLanguage, 
  getCurrentLanguage 
} from '../i18n/config';

/**
 * Hook personalizado para manejar traducciones en ChambingApp
 * Proporciona funciones adicionales y shortcuts para operaciones comunes
 */
export const useTranslations = () => {
  const { t, i18n, ready } = useTranslation();

  // Shortcuts para traducciones comunes
  const common = {
    loading: t('common.loading'),
    error: t('common.error'),
    success: t('common.success'),
    cancel: t('common.cancel'),
    confirm: t('common.confirm'),
    save: t('common.save'),
    edit: t('common.edit'),
    delete: t('common.delete'),
    search: t('common.search'),
    back: t('common.back'),
    next: t('common.next'),
    previous: t('common.previous'),
    close: t('common.close'),
    language: t('common.language'),
  };

  const nav = {
    home: t('nav.home'),
    services: t('nav.services'),
    dashboard: t('nav.dashboard'),
    profile: t('nav.profile'),
    login: t('nav.login'),
    register: t('nav.register'),
    logout: t('nav.logout'),
  };

  // Función para traducir nombres de servicios
  const translateService = (serviceKey) => {
    return t(`services.categories.${serviceKey}`, serviceKey);
  };

  // Función para traducir tipos de usuario
  const translateUserType = (type) => {
    const typeMap = {
      'cliente': t('auth.register.client'),
      'trabajador': t('auth.register.worker'),
      'admin': t('common.admin'),
    };
    return typeMap[type] || type;
  };

  // Función para obtener mensajes de error traducidos
  const getErrorMessage = (errorCode) => {
    const errorMap = {
      'network_error': t('errors.networkError'),
      'server_error': t('errors.serverError'),
      'auth_error': t('errors.authError'),
      'validation_error': t('errors.validationError'),
      'not_found': t('errors.notFound'),
      'permission_denied': t('errors.permissionDenied'),
    };
    return errorMap[errorCode] || t('errors.unknown');
  };

  // Función para obtener mensajes de éxito traducidos
  const getSuccessMessage = (actionType) => {
    const successMap = {
      'login': t('success.login'),
      'register': t('success.register'),
      'profile_updated': t('success.profileUpdated'),
      'contract_created': t('success.contractCreated'),
      'payment_completed': t('success.paymentCompleted'),
    };
    return successMap[actionType] || t('success.generic');
  };

  // Función para obtener texto con interpolación de variables
  const interpolate = (key, variables = {}) => {
    return t(key, variables);
  };

  return {
    // Función de traducción básica
    t,
    
    // Información del idioma
    language: getCurrentLanguage(),
    isReady: ready,
    
    // Funciones de control
    changeLanguage,
    
    // Shortcuts para traducciones comunes
    common,
    nav,
    
    // Funciones especializadas
    translateService,
    translateUserType,
    getErrorMessage,
    getSuccessMessage,
    interpolate,
    
    // Instancia de i18n para casos avanzados
    i18n,
  };
};

export default useTranslations;