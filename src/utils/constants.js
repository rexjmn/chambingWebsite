export const USER_TYPES = {
  CLIENTE: 'cliente',
  TRABAJADOR: 'trabajador',
  ADMIN: 'admin',
};

export const CONTRACT_STATES = {
  PENDIENTE: 'pendiente',
  ACEPTADO: 'aceptado',
  EN_PROGRESO: 'en_progreso',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado',
};

export const PAYMENT_STATES = {
  PENDIENTE: 'pendiente',
  PROCESANDO: 'procesando',
  COMPLETADO: 'completado',
  FALLIDO: 'fallido',
  REEMBOLSADO: 'reembolsado',
};

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    UPLOAD_PHOTO: '/users/profile-photo',
  },
  SERVICES: {
    CATEGORIES: '/services/categories',
    WORKER_CATEGORIES: '/services/worker-categories',
    TARIFFS: '/services/tariffs',
  },
  CONTRACTS: {
    BASE: '/contracts',
    MY_CONTRACTS: '/contracts/my-contracts',
    STATES: '/contracts/states',
  },
  PAYMENTS: {
    BASE: '/payments',
    HISTORY: '/payments/history',
    BALANCE: '/payments/balance',
    WOMPI: '/payments/wompi',
  },
};