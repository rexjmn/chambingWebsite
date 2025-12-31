import api from './api';
import { logger } from '../utils/logger';

const adminService = {
  // ============ CATEGORÍAS ============
  async getCategories() {
    const response = await api.get('/services/categories');
    return response.data.data || response.data;
  },

  async createCategory(categoryData) {
    const response = await api.post('/services/categories', categoryData);
    return response.data.data || response.data;
  },

  async updateCategory(id, categoryData) {
    const response = await api.patch(`/services/categories/${id}`, categoryData);
    return response.data.data || response.data;
  },

  async deleteCategory(id) {
    const response = await api.delete(`/services/categories/${id}`);
    return response.data.data || response.data;
  },

  // ============ DOCUMENTOS ============
  async getPendingDocuments() {
    const response = await api.get('/documents', {
      params: { estadoVerificacion: 'pendiente' }
    });
    return response.data.data || response.data;
  },

  async getAllDocuments(filters = {}) {
    const response = await api.get('/documents', { params: filters });
    return response.data.data || response.data;
  },

  async verifyDocument(documentId, verificationData) {
    const response = await api.post(`/documents/${documentId}/verify`, verificationData);
    return response.data.data || response.data;
  },

  // ============ CONTRATOS ============
  async getAllContracts(filters = {}) {
    const response = await api.get('/contracts', { params: filters });
    return response.data.data || response.data;
  },

  async updateContractStatus(contractId, statusData) {
    const response = await api.post(`/contracts/${contractId}/estado`, statusData);
    return response.data.data || response.data;
  },

  async getContractHistory(contractId) {
    const response = await api.get(`/contracts/${contractId}/historial`);
    return response.data.data || response.data;
  },

  // ============ USUARIOS ============
  async getAllUsers(filters = {}) {
    const response = await api.get('/users', { params: filters });
    return response.data.data || response.data;
  },

  async getUserById(userId) {
    const response = await api.get(`/users/${userId}`);
    return response.data.data || response.data;
  },

  async updateUser(userId, userData) {
    const response = await api.patch(`/users/${userId}`, userData);
    return response.data.data || response.data;
  },

  async deleteUser(userId) {
    const response = await api.delete(`/users/${userId}`);
    return response.data.data || response.data;
  },

  async suspendUser(userId, reason) {
    const response = await api.post(`/users/${userId}/suspend`, { reason });
    return response.data.data || response.data;
  },

  // ✨ NUEVO: Verificación de trabajadores
  async getPendingWorkers() {
    const response = await api.get('/users/pending-workers');
    return response.data.data || response.data;
  },

  async verifyWorker(userId, verified) {
    const response = await api.patch(`/users/${userId}/verify`, { verified });
    return response.data.data || response.data;
  },

  async getWorkers(onlyVerified = false) {
    const response = await api.get('/users/workers', {
      params: { verified: onlyVerified ? 'true' : undefined }
    });
    return response.data.data || response.data;
  },

  // ============ ROLES ADMINISTRATIVOS ============
  async getAllRoles() {
    const response = await api.get('/roles');
    return response.data.data || response.data;
  },

  async createRole(roleData) {
    const response = await api.post('/roles', roleData);
    return response.data.data || response.data;
  },

  async assignRole(assignmentData) {
    const response = await api.post('/roles/assign', assignmentData);
    return response.data.data || response.data;
  },

  async removeRole(userId, roleId) {
    const response = await api.delete(`/roles/remove/${userId}/${roleId}`);
    return response.data.data || response.data;
  },

  async getUserRoles(userId) {
    const response = await api.get(`/roles/user/${userId}`);
    return response.data.data || response.data;
  },

  // ============ ESTADÍSTICAS ============
  async getAdminStats(period = 'month') {
    try {
      const response = await api.get('/admin/stats', {
        params: { period }
      });
      return response.data.data || response.data;
    } catch (error) {
      logger.error('Error loading stats:', error.message);
      // Fallback a stats básicas si el endpoint falla
      const users = await this.getAllUsers();
      return {
        totalUsers: users.length,
        totalWorkers: users.filter(u => u.tipo_usuario === 'trabajador').length,
        totalClients: users.filter(u => u.tipo_usuario === 'cliente').length,
        verifiedWorkers: users.filter(u => u.tipo_usuario === 'trabajador' && u.verificado).length,
        pendingWorkers: users.filter(u => u.tipo_usuario === 'trabajador' && !u.verificado).length,
        previousTotalUsers: users.length,
        activeContracts: 0,
        previousActiveContracts: 0,
        pendingDocuments: 0,
        previousPendingDocuments: 0,
        monthlyRevenue: 0,
        previousMonthlyRevenue: 0,
        userGrowthData: [],
        contractsDistribution: {
          pending: 0,
          inProgress: 0,
          completed: 0,
          cancelled: 0
        }
      };
    }
  },

  async getDashboardMetrics(period = 'month') {
    try {
      const response = await api.get('/admin/metrics', {
        params: { period }
      });
      return response.data.data || response.data;
    } catch (error) {
      logger.warn('Metrics endpoint not available, using basic stats');
      return await this.getAdminStats(period);
    }
  },

  async getWorkersStats() {
    try {
      const response = await api.get('/admin/workers/stats');
      return response.data.data || response.data;
    } catch (error) {
      logger.error('Error loading workers stats:', error.message);
      return null;
    }
  }
};

export default adminService;