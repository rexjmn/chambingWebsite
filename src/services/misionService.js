import api from './api';
import { logger } from '../utils/logger';

export const misionService = {
  async getMisiones(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.estado) query.set('estado', params.estado);
      if (params.page) query.set('page', params.page);
      if (params.limit) query.set('limit', params.limit);

      const url = `/misiones${query.toString() ? `?${query}` : ''}`;
      logger.api('Obteniendo misiones', params);
      const res = await api.get(url);
      return res.data;
    } catch (error) {
      logger.error('Error obteniendo misiones:', error.message);
      throw error;
    }
  },

  async getMisionById(id) {
    try {
      logger.api('Obteniendo misión', { id });
      const res = await api.get(`/misiones/${id}`);
      return res.data;
    } catch (error) {
      logger.error('Error obteniendo misión:', error.message);
      throw error;
    }
  },

  async createMision(data) {
    try {
      logger.api('Creando misión');
      const res = await api.post('/misiones', data);
      return res.data;
    } catch (error) {
      logger.error('Error creando misión:', error.message);
      throw error;
    }
  },

  async updateMision(id, data) {
    try {
      logger.api('Actualizando misión', { id });
      const res = await api.patch(`/misiones/${id}`, data);
      return res.data;
    } catch (error) {
      logger.error('Error actualizando misión:', error.message);
      throw error;
    }
  },

  async uploadFotoPortada(id, file) {
    try {
      logger.api('Subiendo foto de portada', { id });
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.patch(`/misiones/${id}/foto-portada`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (error) {
      logger.error('Error subiendo foto de portada:', error.message);
      throw error;
    }
  },

  async cerrarMision(id) {
    try {
      logger.api('Cerrando misión', { id });
      const res = await api.patch(`/misiones/${id}/cerrar`);
      return res.data;
    } catch (error) {
      logger.error('Error cerrando misión:', error.message);
      throw error;
    }
  },

  async getMisMisiones(estado = null) {
    try {
      const url = estado
        ? `/misiones/mis-misiones?estado=${estado}`
        : '/misiones/mis-misiones';
      logger.api('Obteniendo mis misiones');
      const res = await api.get(url);
      return res.data;
    } catch (error) {
      logger.error('Error obteniendo mis misiones:', error.message);
      if (error.response?.status === 401) return { status: 'success', data: [] };
      throw error;
    }
  },

  async aplicar(misionId) {
    try {
      logger.api('Aplicando a misión', { misionId });
      const res = await api.post(`/misiones/${misionId}/aplicar`);
      return res.data;
    } catch (error) {
      logger.error('Error aplicando a misión:', error.message);
      throw error;
    }
  },

  async retirarAplicacion(misionId) {
    try {
      logger.api('Retirando aplicación', { misionId });
      const res = await api.delete(`/misiones/${misionId}/aplicar`);
      return res.data;
    } catch (error) {
      logger.error('Error retirando aplicación:', error.message);
      throw error;
    }
  },

  async getAplicaciones(misionId) {
    try {
      logger.api('Obteniendo aplicaciones de misión', { misionId });
      const res = await api.get(`/misiones/${misionId}/aplicaciones`);
      return res.data;
    } catch (error) {
      logger.error('Error obteniendo aplicaciones:', error.message);
      throw error;
    }
  },

  async getMisAplicaciones() {
    try {
      logger.api('Obteniendo mis aplicaciones');
      const res = await api.get('/misiones/mis-aplicaciones');
      return res.data;
    } catch (error) {
      logger.error('Error obteniendo mis aplicaciones:', error.message);
      if (error.response?.status === 401) return { status: 'success', data: [] };
      throw error;
    }
  },

  async actualizarEstadoAplicacion(misionId, aplicacionId, estado) {
    try {
      logger.api('Actualizando estado de aplicación', { misionId, aplicacionId, estado });
      const payload = { estado };
      const candidates = [
        `/misiones/${misionId}/aplicaciones/${aplicacionId}`,
        `/misiones/aplicaciones/${aplicacionId}`,
      ];

      let lastError = null;
      for (const url of candidates) {
        try {
          const res = await api.patch(url, payload);
          return res.data;
        } catch (error) {
          lastError = error;
          if (error?.response?.status !== 404) throw error;
        }
      }

      throw lastError || new Error('No se pudo actualizar la aplicación');
    } catch (error) {
      logger.error('Error actualizando aplicación:', error.message);
      throw error;
    }
  },
};
