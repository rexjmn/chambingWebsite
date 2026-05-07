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

  /**
   * Acepta una oferta pendiente (solo trabajador)
   */
  async aceptarOferta(contratoId, mensaje = '') {
    try {
      logger.api('Aceptando oferta', { contratoId });
      const payload = mensaje?.trim() ? { mensaje: mensaje.trim() } : {};

      // Compatibilidad con distintos nombres de endpoint según backend.
      try {
        const response = await api.post(`/contracts/${contratoId}/aceptar-oferta`, payload);
        return response.data;
      } catch (firstError) {
        if (firstError?.response?.status && firstError.response.status !== 404) {
          throw firstError;
        }

        const fallbackResponse = await api.post(`/contracts/${contratoId}/aceptar`, payload);
        return fallbackResponse.data;
      }
    } catch (error) {
      logger.error('Error aceptando oferta:', error.message);
      throw error;
    }
  },

  /**
   * Rechaza una oferta pendiente (solo trabajador)
   */
  async rechazarOferta(contratoId, comentario) {
    try {
      logger.api('Rechazando oferta', { contratoId });
      const payload = { comentario: comentario?.trim() || '' };

      try {
        const response = await api.post(`/contracts/${contratoId}/rechazar-oferta`, payload);
        return response.data;
      } catch (firstError) {
        if (firstError?.response?.status && firstError.response.status !== 404) {
          throw firstError;
        }

        const fallbackResponse = await api.post(`/contracts/${contratoId}/rechazar`, payload);
        return fallbackResponse.data;
      }
    } catch (error) {
      logger.error('Error rechazando oferta:', error.message);
      throw error;
    }
  },

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
  async confirmarLlegada(contratoId, codigo, clienteConsentimientoEvidencia = true) {
    try {
      logger.api('Confirmando llegada', { contratoId });
      const response = await api.post(`/contracts/${contratoId}/confirmar-llegada`, {
        codigo,
        clienteConsentimientoEvidencia,
      });
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
  async cerrarContrato(contratoId, options = {}) {
    const notas =
      typeof options === 'string' ? options : options.notas ?? '';
    const clienteConsentimientoEvidencia =
      typeof options === 'string'
        ? false
        : options.clienteConsentimientoEvidencia === true;
    try {
      logger.api('Cerrando contrato', { contratoId });
      const response = await api.patch(`/contracts/${contratoId}/cerrar`, {
        notas,
        clienteConsentimientoEvidencia,
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
  },

  // ========== EVIDENCIAS (fotos / video, retención 15 días en servidor) ==========

  async listEvidencias(contratoId) {
    const response = await api.get(`/contracts/${contratoId}/evidences`);
    return response.data?.data ?? response.data;
  },

  async initEvidenceUpload(contratoId, body) {
    const response = await api.post(
      `/contracts/${contratoId}/evidences/init-upload`,
      body,
    );
    return response.data?.data ?? response.data;
  },

  async completeEvidenceUpload(contratoId, evidenceId) {
    const response = await api.post(
      `/contracts/${contratoId}/evidences/${evidenceId}/complete-upload`,
      {},
    );
    return response.data?.data ?? response.data;
  },

  async getEvidenceDownloadUrl(contratoId, evidenceId) {
    const response = await api.get(
      `/contracts/${contratoId}/evidences/${evidenceId}/download`,
    );
    return response.data?.data ?? response.data;
  },

  /**
   * Sube un archivo a S3 con URL firmada y marca la evidencia como lista.
   */
  async uploadEvidenceFile(contratoId, initBody, file) {
    const init = await this.initEvidenceUpload(contratoId, {
      ...initBody,
      sizeBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
    });
    const { uploadUrl, evidenceId } = init;
    const put = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    });
    if (!put.ok) {
      throw new Error(`Error al subir archivo (${put.status})`);
    }
    return this.completeEvidenceUpload(contratoId, evidenceId);
  },
};