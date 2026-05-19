/**
 * ========================================================================
 * SERVICE DES TRAVAILLEURS - Utilisant AXIOS avec intercepteurs
 * ========================================================================
 */
import api from './api';
import { logger } from '../utils/logger';

const buildWorkerParams = (filters = {}) => {
  const params = {
    tipo_usuario: filters.tipo_usuario || 'trabajador',
    verificado:
      filters.verificado !== undefined ? String(filters.verificado) : 'true',
    sort: filters.sort || 'relevance',
  };

  if (filters.categoria) params.categoria = filters.categoria;
  if (filters.departamento) params.departamento = filters.departamento;
  if (filters.search) params.search = filters.search;
  if (filters.modalidad) params.modalidad = filters.modalidad;
  if (filters.fecha_inicio) params.fecha_inicio = filters.fecha_inicio;
  if (filters.fecha_fin) params.fecha_fin = filters.fecha_fin;
  if (typeof filters.lat === 'number') params.lat = filters.lat;
  if (typeof filters.lng === 'number') params.lng = filters.lng;
  if (filters.max_distance_km) params.max_distance_km = filters.max_distance_km;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;

  return params;
};

const extractWorkersList = (payload) => {
  if (payload?.status === 'success' && Array.isArray(payload.data)) {
    return payload.data;
  }
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const workerService = {
  async getVerifiedWorkers(filters = {}) {
    const response = await api.get('/users/workers', {
      params: buildWorkerParams(filters),
    });
    return response.data;
  },

  async getWorkerById(workerId) {
    const response = await api.get(`/users/public/${workerId}`);
    return response.data;
  },

  async getCategories() {
    try {
      const response = await api.get('/services/categorias');
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return {
          status: 'success',
          data: [
            { id: '1', nombre: 'Construcción' },
            { id: '2', nombre: 'Limpieza' },
            { id: '3', nombre: 'Jardinería' },
            { id: '4', nombre: 'Plomería' },
            { id: '5', nombre: 'Electricidad' },
            { id: '6', nombre: 'Carpintería' },
          ],
        };
      }

      return {
        status: 'success',
        data: [
          { id: '1', nombre: 'Construcción' },
          { id: '2', nombre: 'Limpieza' },
          { id: '3', nombre: 'Jardinería' },
          { id: '4', nombre: 'Plomería' },
          { id: '5', nombre: 'Electricidad' },
          { id: '6', nombre: 'Carpintería' },
        ],
      };
    }
  },

  async getFeaturedWorkers(limit = 8) {
    try {
      const response = await this.getVerifiedWorkers({
        verificado: true,
        sort: 'relevance',
        limit,
      });
      return extractWorkersList(response);
    } catch {
      return [];
    }
  },

  async getTopRatedWorkers(limit = 8) {
    try {
      const response = await this.getVerifiedWorkers({
        verificado: true,
        sort: 'relevance',
        limit,
      });
      return extractWorkersList(response);
    } catch {
      return [];
    }
  },

  async getWorkersByCategory(categoryId, additionalFilters = {}) {
    try {
      const response = await this.getVerifiedWorkers({
        ...additionalFilters,
        categoria: categoryId,
        verificado: true,
        sort: additionalFilters.sort || 'relevance',
      });
      return extractWorkersList(response);
    } catch (error) {
      logger.error('Error obteniendo trabajadores por categoría:', error.message);
      return [];
    }
  },

  async categorizeWorkersBySkills() {
    try {
      const response = await this.getVerifiedWorkers({
        verificado: true,
        sort: 'relevance',
      });
      const workers = extractWorkersList(response);
      if (workers.length === 0) return {};

      const categorized = {};
      const skillToCategoryMap = {
        limpieza_domestica: 'Limpieza',
        limpieza_oficinas: 'Limpieza',
        lavanderia: 'Limpieza',
        construccion: 'Construcción',
        albanileria: 'Construcción',
        techos: 'Construcción',
        plomeria: 'Plomería',
        instalacion_sanitarios: 'Plomería',
        destapes: 'Plomería',
        electricidad: 'Electricidad',
        instalacion_electrica: 'Electricidad',
        reparacion_electrodomesticos: 'Electricidad',
        carpinteria: 'Carpintería',
        muebles: 'Carpintería',
        ebanisteria: 'Carpintería',
        jardineria: 'Jardinería',
        paisajismo: 'Jardinería',
        poda: 'Jardinería',
        pintura: 'Pintura',
        mecanica: 'Mecánica',
        catering: 'Catering',
        seguridad: 'Seguridad',
      };

      workers.forEach((worker) => {
        const workerSkills = worker.skills || worker.habilidades || [];

        if (Array.isArray(workerSkills) && workerSkills.length > 0) {
          workerSkills.forEach((skill) => {
            const skillName =
              typeof skill === 'string' ? skill : skill.nombre || skill.name;
            const category = skillToCategoryMap[skillName] || 'Otros';

            if (!categorized[category]) {
              categorized[category] = [];
            }

            if (!categorized[category].find((w) => w.id === worker.id)) {
              categorized[category].push(worker);
            }
          });
        } else {
          if (!categorized['Sin categorizar']) {
            categorized['Sin categorizar'] = [];
          }
          categorized['Sin categorizar'].push(worker);
        }
      });

      return categorized;
    } catch (error) {
      logger.error('Error categorizando trabajadores:', error.message);
      return {};
    }
  },
};
