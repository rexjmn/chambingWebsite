import api from './api';

export const authService = {
  async login(credentials) {
    try {
      console.log('🔧 authService: Enviando petición login...', credentials);
      const response = await api.post('/auth/login', credentials);
      console.log('🔧 authService: Respuesta recibida:', response.data);
      
      // ✅ Usar los nombres correctos que retorna el backend
      const { accessToken, refreshToken, user } = response.data;

      // Guardar tokens y usuario en localStorage
      localStorage.setItem('token', accessToken);           // ✅ accessToken del backend
      localStorage.setItem('refresh_token', refreshToken);  // ✅ refreshToken del backend
      
      // Guardar usuario solo si existe en la respuesta
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }

     
      return {
        access_token: accessToken,  
        refresh_token: refreshToken,
        user: user
      };
    } catch (error) {
      console.error('❌ authService: Error en login:', error.response?.data || error);
      throw error;
    }
  },

  async register(userData) {
    try {
      console.log('🔧 authService: Enviando petición registro...', userData);
     const response = await api.post('/users/register', userData);
      console.log('🔧 authService: Respuesta registro:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ authService: Error en registro:', error.response?.data || error);
      throw error;
    }
  },

  async logout() {
    try {
      console.log('🔧 authService: Enviando petición logout...');
      await api.post('/auth/logout');
    } catch (error) {
      console.error('❌ authService: Error en logout:', error.response?.data || error);
    }
    
    // Limpiar localStorage siempre
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  async refresh_token() {
    try {
      const refresh_token = localStorage.getItem('refresh_token');
      console.log('🔧 authService: Refrescando token...');
      
      if (!refresh_token) {
        throw new Error('No hay refresh token disponible');
      }

      const response = await api.post('/auth/refresh', { 
        refreshToken: refresh_token  
      });
      
      const { accessToken } = response.data;  
      
      localStorage.setItem('token', accessToken);
      console.log('✅ authService: Token refrescado exitosamente');
      return accessToken;
    } catch (error) {
      console.error('❌ authService: Error refrescando token:', error);
      this.logout();
      throw error;
    }
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};