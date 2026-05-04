import api from './api';

export const publicProfileService = {
  async getPublicProfile(userId) {
    try {
      const response = await api.get(`/users/public/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getUserSkills(userId) {
    try {
      const response = await api.get(`/users/${userId}/skills`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getUserReviews(userId) {
    try {
      const response = await api.get(`/users/${userId}/reviews`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { status: 'success', data: [] };
      }
      return { status: 'success', data: [] };
    }
  },

  async getUserStats(userId) {
    try {
      const response = await api.get(`/users/${userId}/stats`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { status: 'success', data: { trabajos_completados: 0, rating: 0, total_reviews: 0 } };
      }
      return { status: 'success', data: { trabajos_completados: 0, rating: 0, total_reviews: 0 } };
    }
  },

  async getPlatformStats() {
    try {
      const response = await api.get('/users/platform-stats');
      return response.data;
    } catch (error) {
      return {
        status: 'success',
        data: { verified_workers: 0, completed_services: 0, average_rating: 0, satisfied_clients_pct: 0 },
      };
    }
  },

  /**
   * Ocupación por contratos confirmados (vista pública del calendario).
   * Si el backend aún no expone GET /users/public/:id/contract-agenda, devuelve [] sin error.
   */
  async getPublicWorkerContractAgenda(workerId, params) {
    try {
      const response = await api.get(`/users/public/${workerId}/contract-agenda`, { params });
      return response.data;
    } catch {
      return [];
    }
  },
};
