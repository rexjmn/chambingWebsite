import api from './api';
import { logger } from '../utils/logger';

export const contractService = {
  // ========== OBTENER CONTRATOS ==========

  /**
   * Obtiene todos los contratos del usuario autenticado
   */
  async getMyContracts(rol = null, estado = null) {
    try {
      logger.api('Obteniendo mis contratos', { rol, estado });

      let url = '/contracts/mis-contratos';
      const params = [];

      if (rol) params.push(`rol=${rol}`); // 'empleador' o 'trabajador'
      if (estado) params.push(`estado=${estado}`);

      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      const response = await api.get(url);
      logger.api('Contratos recibidos', { count: response.data?.count || 0 });

      return response.data;
    } catch (error) {
      logger.error('Error obteniendo contratos:', error.message);

      if (error.response?.status === 404 || error.response?.status === 401) {
        return { status: 'success', data: [], count: 0 };
      }

      throw error;
    }
  },

  /**
   * Obtiene un contrato por ID
   */
  async getContractById(id) {
    try {
      logger.api('Obteniendo contrato por ID', { id });
      const response = await api.get(`/contracts/${id}`);
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo contrato:', error.message);
      throw error;
    }
  },

  /**
   * Busca un contrato por su código
   */
  async getContractByCode(codigo) {
    try {
      logger.api('Buscando contrato por código');
      const response = await api.get(`/contracts/codigo/${codigo}`);
      return response.data;
    } catch (error) {
      logger.error('Error buscando contrato:', error.message);
      throw error;
    }
  },

  // ========== CREAR CONTRATO ==========

  /**
   * Crea un nuevo contrato
   */
  async createContract(contractData) {
    try {
      logger.api('Creando contrato');
      const response = await api.post('/contracts', contractData);
      logger.api('Contrato creado exitosamente');
      return response.data;
    } catch (error) {
      logger.error('Error creando contrato:', error.message);
      throw error;
    }
  },

  // ========== FLUJO EN CAMINO / CONFIRMAR LLEGADA ==========

  /** Trabajador pulsa "Estoy en camino" — genera código de verificación */
  async iniciarViaje(contratoId) {
    try {
      logger.api('Iniciando viaje', { contratoId });
      const response = await api.post(`/contracts/${contratoId}/en-camino`);
      return response.data;
    } catch (error) {
      logger.error('Error iniciando viaje:', error.message);
      throw error;
    }
  },

  /** Cliente confirma llegada del trabajador ingresando el código de 4 dígitos */
  async confirmarLlegada(contratoId, codigo) {
    try {
      logger.api('Confirmando llegada', { contratoId });
      const response = await api.post(`/contracts/${contratoId}/confirmar-llegada`, { codigo });
      return response.data;
    } catch (error) {
      logger.error('Error confirmando llegada:', error.message);
      throw error;
    }
  },

  // ========== COMPLETAR CONTRATO ==========

  /**
   * Marca el contrato como completado (solo trabajador)
   */
  async completarContrato(contratoId, notas = '') {
    try {
      logger.api('Completando contrato', { contratoId });
      const response = await api.patch(`/contracts/${contratoId}/completar`, {
        notas
      });
      logger.api('Contrato completado exitosamente');
      return response.data;
    } catch (error) {
      logger.error('Error completando contrato:', error.message);
      throw error;
    }
  },

  // ========== CERRAR CONTRATO (LIBERAR PAGO) ==========

  /**
   * Cierra el contrato y libera el pago (solo empleador)
   */
  async cerrarContrato(contratoId, notas = '') {
    try {
      logger.api('Cerrando contrato', { contratoId });
      const response = await api.patch(`/contracts/${contratoId}/cerrar`, {
        notas
      });
      logger.api('Contrato cerrado exitosamente');
      return response.data;
    } catch (error) {
      logger.error('Error cerrando contrato:', error.message);
      throw error;
    }
  },

  // ========== CANCELAR CONTRATO ==========

  /**
   * Cancela el contrato
   */
  async cancelarContrato(contratoId, motivo) {
    try {
      logger.api('Cancelando contrato', { contratoId });
      const response = await api.patch(`/contracts/${contratoId}/cancelar`, {
        motivo
      });
      logger.api('Contrato cancelado exitosamente');
      return response.data;
    } catch (error) {
      logger.error('Error cancelando contrato:', error.message);
      throw error;
    }
  },

  // ========== HISTORIAL ==========

  /**
   * Obtiene el historial de cambios de estado
   */
  async getHistorial(contratoId) {
    try {
      logger.api('Obteniendo historial', { contratoId });
      const response = await api.get(`/contracts/${contratoId}/historial`);
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo historial:', error.message);
      throw error;
    }
  }
};