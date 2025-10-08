// src/services/serviceService.js
import api from './api';

export const serviceService = {
  // ============ CATEGORÍAS ============

  getCategories: async () => {
    const response = await api.get('/services/categorias');
    return response.data;
  },
  getCategorias: async () => {
    const response = await api.get('/services/categorias');
    return response.data;
  },

  getCategoriaById: async (id) => {
    const response = await api.get(`/services/categorias/${id}`);
    return response.data;
  },

  // ============ TARIFAS ============
  
  /**
   * Obtener tarifas de un trabajador específico
   * @param {string} trabajadorId - UUID del trabajador
   * @returns {Promise<Object|null>} Objeto con tarifas o null si no tiene
   */
  getTarifasByWorker: async (trabajadorId) => {
    try {
      const response = await api.get(`/services/trabajadores/${trabajadorId}/tarifas`);
      return response.data?.data || null;
    } catch (error) {
      // Si es 404, el trabajador no tiene tarifas (normal)
      if (error.response?.status === 404) {
        return null;
      }
      // Otros errores los propagamos
      throw error;
    }
  },

  /**
   * Crear tarifas para un trabajador
   * @param {string} trabajadorId 
   * @param {Object} tarifasData 
   */
  createTarifas: async (trabajadorId, tarifasData) => {
    const response = await api.post(
      `/services/trabajadores/${trabajadorId}/tarifas`,
      tarifasData
    );
    return response.data;
  },

  /**
   * Actualizar tarifas de un trabajador
   * @param {string} trabajadorId 
   * @param {Object} tarifasData 
   */
  updateTarifas: async (trabajadorId, tarifasData) => {
    const response = await api.patch(
      `/services/trabajadores/${trabajadorId}/tarifas`,
      tarifasData
    );
    return response.data;
  },

  /**
   * Eliminar (desactivar) tarifas de un trabajador
   * @param {string} trabajadorId 
   */
  deleteTarifas: async (trabajadorId) => {
    const response = await api.delete(`/services/trabajadores/${trabajadorId}/tarifas`);
    return response.data;
  }
};
