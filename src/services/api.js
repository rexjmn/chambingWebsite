import axios from 'axios';
import { logger } from '../utils/logger';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://chambingapi.onrender.com/api'
    : 'http://localhost:3000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

let isRedirecting = false;
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (isRedirecting) {
        return Promise.reject(error);
      }

      if (!error.config._retry) {
        error.config._retry = true;

        // If a refresh is already in progress, queue this request instead of
        // starting a second concurrent refresh (which would fail for single-use tokens)
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            refreshQueue.push({ resolve, reject, config: error.config });
          });
        }

        isRefreshing = true;

        try {
          logger.api('Token expirado - Intentando refrescar automáticamente');
          await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
          logger.api('Token refrescado automáticamente');

          isRefreshing = false;
          refreshQueue.forEach(({ resolve, config }) => resolve(api.request(config)));
          refreshQueue = [];

          return api.request(error.config);
        } catch (refreshError) {
          isRefreshing = false;
          refreshQueue.forEach(({ reject }) => reject(refreshError));
          refreshQueue = [];

          logger.error('Error al refrescar token automáticamente:', refreshError.message);
          handleLogout();
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

function handleLogout() {
  if (isRedirecting) return;
  isRedirecting = true;

  logger.auth('Sesión expirada - Cerrando sesión automáticamente');
  if (typeof window !== 'undefined') localStorage.removeItem('user');

  const protectedPrefixes = ['/dashboard', '/edit-profile', '/admin', '/availability', '/contracts', '/onboarding', '/perfil'];
  const onProtectedPage = typeof window !== 'undefined' &&
    protectedPrefixes.some(p => window.location.pathname.startsWith(p));

  if (onProtectedPage) {
    setTimeout(() => {
      window.location.href = '/login';
      isRedirecting = false;
    }, 100);
  } else {
    isRedirecting = false;
  }
}

export default api;
