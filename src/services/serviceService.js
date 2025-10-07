import api from './api';

export const serviceService = {
  // ✅ Usar /services/categorias (como está en tu backend)
  async getCategories() {
    try {
      console.log('🔧 serviceService: Obteniendo categorías...');
      
      // ✅ Tu backend tiene /services/categorias (no /categories)
      const response = await api.get('/services/categorias');
      console.log('🔧 serviceService: Categorías recibidas:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ serviceService: Error obteniendo categorías:', error);
      
      // Si falla, retornar array vacío para no romper la UI
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.log('📝 serviceService: Retornando array vacío por error');
        return [];
      }
      
      throw error;
    }
  },

  async getCategoryById(id) {
    try {
      console.log('🔧 serviceService: Obteniendo categoría por ID:', id);
      const response = await api.get(`/services/categorias/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ serviceService: Error obteniendo categoría:', error);
      throw error;
    }
  },

  async getWorkersByCategory(categoryId) {
    try {
      console.log('🔧 serviceService: Obteniendo trabajadores por categoría:', categoryId);
      const response = await api.get(`/services/categorias/${categoryId}/trabajadores`);
      return response.data;
    } catch (error) {
      console.error('❌ serviceService: Error obteniendo trabajadores:', error);
      throw error;
    }
  },

  async createCategory(categoryData) {
    try {
      console.log('🔧 serviceService: Creando categoría:', categoryData);
      const response = await api.post('/services/categorias', categoryData);
      return response.data;
    } catch (error) {
      console.error('❌ serviceService: Error creando categoría:', error);
      throw error;
    }
  },

  async updateCategory(id, categoryData) {
    try {
      console.log('🔧 serviceService: Actualizando categoría:', id, categoryData);
      const response = await api.patch(`/services/categorias/${id}`, categoryData);
      return response.data;
    } catch (error) {
      console.error('❌ serviceService: Error actualizando categoría:', error);
      throw error;
    }
  },

  async createTarifa(tarifaData) {
    try {
      console.log('🔧 serviceService: Creando tarifa:', tarifaData);
      const response = await api.post('/services/tarifas', tarifaData);
      return response.data;
    } catch (error) {
      console.error('❌ serviceService: Error creando tarifa:', error);
      throw error;
    }
  },

  async assignWorkerToCategory(assignmentData) {
    try {
      console.log('🔧 serviceService: Asignando trabajador a categoría:', assignmentData);
      const response = await api.post('/services/trabajadores/asignar', assignmentData);
      return response.data;
    } catch (error) {
      console.error('❌ serviceService: Error asignando trabajador:', error);
      throw error;
    }
  },
 // TARIFAS DE TRABAJADORES
  async getTarifasByWorker(workerId) {
    try {
      const response = await api.get(`/services/trabajadores/${workerId}/tarifas`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo tarifas del trabajador:', error);
      return null;
    }
  },

  async createWorkerTarifas(workerId, tarifasData) {
    try {
      const response = await api.post(`/services/trabajadores/${workerId}/tarifas`, tarifasData);
      return response.data;
    } catch (error) {
      console.error('Error creando tarifas:', error);
      throw error;
    }
  },

  async updateWorkerTarifas(workerId, tarifasData) {
    try {
      const response = await api.patch(`/services/trabajadores/${workerId}/tarifas`, tarifasData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando tarifas:', error);
      throw error;
    }
  },

  // ✅ Método de prueba para verificar conexión
  async testConnection() {
    try {
      console.log('🔧 serviceService: Probando conexión...');
      const response = await api.get('/services/test');
      return response.data;
    } catch (error) {
      console.error('❌ serviceService: Error en prueba de conexión:', error);
      throw error;
    }
  }
};