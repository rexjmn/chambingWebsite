/**
 * Logger Utility - Manejo seguro de logs
 *
 * Solo muestra logs en desarrollo.
 * En producción, los logs de debug/info/warn se omiten para evitar exposición de información.
 * Los errores siempre se registran para debugging en producción.
 */

const isDevelopment = import.meta.env.MODE === 'development';
const isTest = import.meta.env.MODE === 'test';

/**
 * Sanitiza datos sensibles antes de loggear
 * @param {*} data - Datos a sanitizar
 * @returns {*} Datos sanitizados
 */
const sanitize = (data) => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveKeys = ['password', 'token', 'refreshToken', 'accessToken', 'pin', 'secret'];
  const sanitized = { ...data };

  Object.keys(sanitized).forEach((key) => {
    if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitize(sanitized[key]);
    }
  });

  return sanitized;
};

/**
 * Logger con niveles de severidad
 */
export const logger = {
  /**
   * Log de información general - Solo en desarrollo
   */
  log: (...args) => {
    if (isDevelopment && !isTest) {
      console.log(...args);
    }
  },

  /**
   * Log de debugging - Solo en desarrollo
   */
  debug: (...args) => {
    if (isDevelopment && !isTest) {
      console.debug(...args);
    }
  },

  /**
   * Log de advertencias - Solo en desarrollo
   */
  warn: (...args) => {
    if (isDevelopment && !isTest) {
      console.warn(...args);
    }
  },

  /**
   * Log de errores - Siempre se registra
   * En producción, sanitiza datos sensibles
   */
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    } else {
      // En producción, sanitizar datos sensibles
      const sanitizedArgs = args.map((arg) => {
        if (typeof arg === 'object') {
          return sanitize(arg);
        }
        return arg;
      });
      console.error(...sanitizedArgs);
    }
  },

  /**
   * Log de información de autenticación - Solo en desarrollo
   */
  auth: (message, data = {}) => {
    if (isDevelopment && !isTest) {
      console.log(`🔐 [AUTH] ${message}`, sanitize(data));
    }
  },

  /**
   * Log de llamadas a API - Solo en desarrollo
   */
  api: (message, data = {}) => {
    if (isDevelopment && !isTest) {
      console.log(`🌐 [API] ${message}`, sanitize(data));
    }
  },

  /**
   * Log de navegación - Solo en desarrollo
   */
  route: (message, data = {}) => {
    if (isDevelopment && !isTest) {
      console.log(`🚦 [ROUTE] ${message}`, data);
    }
  },

  /**
   * Log de formularios - Solo en desarrollo
   */
  form: (message, data = {}) => {
    if (isDevelopment && !isTest) {
      console.log(`📝 [FORM] ${message}`, sanitize(data));
    }
  },

  /**
   * Información del entorno
   */
  environment: () => {
    if (isDevelopment && !isTest) {
      console.log('🔧 Environment:', {
        mode: import.meta.env.MODE,
        apiUrl: import.meta.env.VITE_API_URL,
        isDev: isDevelopment,
      });
    }
  },
};

/**
 * Hook para usar el logger en componentes React
 * @returns {object} Logger instance
 */
export const useLogger = () => {
  return logger;
};

export default logger;
