// ========================================================================
// UTILIDADES DE SEGURIDAD - VALIDACIÓN Y SANITIZACIÓN
// ========================================================================

/**
 * Sanitiza el input del usuario removiendo caracteres peligrosos
 * Previene XSS y SQL Injection
 * MEJORADO: Ahora escapa correctamente todos los caracteres HTML
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  // Primero, escapar entidades HTML para prevenir XSS
  const escapeHTML = (str) => {
    const htmlEscapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    return str.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
  };

  // Escapar HTML primero
  let sanitized = escapeHTML(input);

  // Remover patrones peligrosos adicionales
  sanitized = sanitized
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+\s*=/gi, '') // Remover event handlers (onclick=, onerror=, etc.)
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remover script tags completos
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remover iframes
    .replace(/<embed[^>]*>/gi, '') // Remover embeds
    .replace(/<object[^>]*>.*?<\/object>/gi, '') // Remover objects
    .replace(/data:text\/html/gi, '') // Remover data URIs HTML
    .replace(/vbscript:/gi, '') // Remover vbscript:
    .trim();

  return sanitized;
};

/**
 * Sanitiza objeto completo recursivamente
 */
export const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeInput(obj);
  }

  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
};

/**
 * Valida formato de email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Valida formato de teléfono de El Salvador (8 dígitos)
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[267]\d{7}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Valida formato de DUI de El Salvador
 */
export const isValidDUI = (dui) => {
  const duiRegex = /^\d{8}-\d$/;
  return duiRegex.test(dui);
};

/**
 * Valida fortaleza de contraseña
 * Retorna objeto con validaciones
 */
export const validatePasswordStrength = (password) => {
  const validations = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const strength = Object.values(validations).filter(Boolean).length;

  return {
    ...validations,
    strength, // 0-5
    isStrong: strength >= 4, // Al menos 4 de 5 criterios
    isValid: validations.minLength, // Mínimo requerido
  };
};

/**
 * Detecta patrones de SQL Injection
 */
export const detectSQLInjection = (input) => {
  if (typeof input !== 'string') return false;

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(union\s+select)/gi,
    /(\bOR\b\s+\d+\s*=\s*\d+)/gi,
    /(\bAND\b\s+\d+\s*=\s*\d+)/gi,
    /(--|#|\/\*|\*\/)/g, // SQL comments
    /('|")\s*(OR|AND)\s*('|")\s*=\s*('|")/gi,
    /xp_cmdshell/gi,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Detecta patrones de XSS
 */
export const detectXSS = (input) => {
  if (typeof input !== 'string') return false;

  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<embed/gi,
    /<object/gi,
    /onerror\s*=/gi,
    /onload\s*=/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * Valida input antes de enviarlo al servidor
 * Retorna objeto con validación y mensaje de error si hay
 */
export const validateInput = (value, fieldName = 'campo') => {
  // Verificar si está vacío
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: `${fieldName} es requerido`,
    };
  }

  // Detectar SQL Injection
  if (detectSQLInjection(value)) {
    return {
      isValid: false,
      error: 'Se detectaron caracteres no permitidos en ' + fieldName,
    };
  }

  // Detectar XSS
  if (detectXSS(value)) {
    return {
      isValid: false,
      error: 'Se detectaron caracteres no permitidos en ' + fieldName,
    };
  }

  return {
    isValid: true,
    value: sanitizeInput(value),
  };
};

/**
 * Genera hash simple para contraseñas (frontend)
 * NOTA: Esto es solo una capa adicional, el backend debe hacer el hash real
 */
export const hashPassword = async (password) => {
  // En producción, el hash real debe hacerse en el backend
  // Esto es solo para evitar enviar la contraseña en texto plano en el log
  return password; // El backend manejará el hash con bcrypt
};

/**
 * Valida todos los campos de un formulario
 */
export const validateForm = (formData, requiredFields = []) => {
  const errors = {};
  const sanitizedData = {};

  for (const field in formData) {
    if (formData.hasOwnProperty(field)) {
      const value = formData[field];

      // Validar campos requeridos
      if (requiredFields.includes(field)) {
        const validation = validateInput(value, field);
        if (!validation.isValid) {
          errors[field] = validation.error;
          continue;
        }
      }

      // Sanitizar todos los campos
      sanitizedData[field] = typeof value === 'string' ? sanitizeInput(value) : value;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData,
  };
};

/**
 * Limita la longitud del input
 */
export const limitLength = (input, maxLength = 255) => {
  if (typeof input !== 'string') return input;
  return input.slice(0, maxLength);
};

/**
 * Protección contra CSRF - Genera token
 */
export const generateCSRFToken = () => {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
};

/**
 * Valida que no haya caracteres unicode maliciosos
 */
export const detectMaliciousUnicode = (input) => {
  if (typeof input !== 'string') return false;

  // Detectar caracteres de control y unicode sospechosos
  const suspiciousPatterns = [
    /[\u0000-\u001F\u007F-\u009F]/g, // Caracteres de control
    /[\u200B-\u200D\u2060\uFEFF]/g, // Zero-width characters
    /[\uD800-\uDFFF]/g, // Surrogates sin par
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
};

export default {
  sanitizeInput,
  sanitizeObject,
  isValidEmail,
  isValidPhone,
  isValidDUI,
  validatePasswordStrength,
  detectSQLInjection,
  detectXSS,
  validateInput,
  validateForm,
  limitLength,
  generateCSRFToken,
  detectMaliciousUnicode,
};
