import api from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const publicProfileService = {
  /**
   * Obtiene el perfil público de un usuario por su ID
   * Este endpoint debería ser público (sin autenticación requerida)
   */
  async getPublicProfile(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/public/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar el perfil');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching public profile:', error);
      throw error;
    }

  },

  /**
   * Obtiene las habilidades de un trabajador
   */
  async getUserSkills(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/skills`);
      
      if (!response.ok) {
        throw new Error('Error al cargar habilidades');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user skills:', error);
      throw error;
    }
  },

  /**
   * Obtiene las reseñas de un trabajador
   */
  async getUserReviews(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/reviews`);
      
      if (!response.ok) {
        throw new Error('Error al cargar reseñas');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      throw error;
    }
  },

  /**
   * Obtiene estadísticas del trabajador (trabajos completados, rating, etc.)
   */
  async getUserStats(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/stats`);
      
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  },
};