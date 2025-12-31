import api from './api';
import { logger } from '../utils/logger';

export const authService = {
  async login(credentials) {
    try {
      logger.auth('Enviando petición login', { email: credentials.email });
      const response = await api.post('/auth/login', credentials);
      logger.auth('Login exitoso');

      // ✅ Los tokens ahora se envían en httpOnly cookies (más seguro)
      // El backend configura las cookies automáticamente
      const { user } = response.data;

      // Solo guardamos información del usuario (no tokens)
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }

      return {
        user: user,
        message: response.data.message
      };
    } catch (error) {
      logger.error('Error en login:', error.response?.data?.message || error.message);
      throw error;
    }
  },

  async register(userData) {
    try {
      logger.auth('Enviando petición registro', { email: userData.email });
      const response = await api.post('/users/register', userData);
      logger.auth('Registro exitoso');
      return response.data;
    } catch (error) {
      logger.error('Error en registro:', error.response?.data?.message || error.message);
      throw error;
    }
  },

  async logout() {
    try {
      logger.auth('Cerrando sesión');
      // El backend limpiará las cookies automáticamente
      await api.post('/auth/logout');
    } catch (error) {
      logger.error('Error en logout:', error.response?.data?.message || error.message);
    }

    // Limpiar solo información del usuario de localStorage
    localStorage.removeItem('user');

    logger.auth('Sesión cerrada - Redirigiendo a login');
    window.location.href = '/login';
  },

  async refresh_token() {
    try {
      logger.auth('Refrescando token de acceso');
      // El backend lee el refreshToken desde las cookies
      // y configura los nuevos tokens en las cookies automáticamente
      const response = await api.post('/auth/refresh');

      logger.auth('Token refrescado exitosamente');
      return response.data;
    } catch (error) {
      logger.error('Error refrescando token:', error.message);
      this.logout();
      throw error;
    }
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    // Con httpOnly cookies, no podemos acceder al token desde JavaScript
    // En su lugar, verificamos si hay información de usuario
    // El backend validará el token en cada petición
    return !!localStorage.getItem('user');
  },
};