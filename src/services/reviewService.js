/**
 * ========================================================================
 * SERVICE DE RESEÑAS - Sistema de calificaciones y reviews
 * ========================================================================
 *
 * Este servicio maneja las reseñas que los clientes dejan a los trabajadores
 * después de completar un contrato.
 *
 * Verbo HTTP utilizado:
 * - POST: Crear nueva reseña
 * - GET: Obtener reseñas
 * - PUT: Editar reseña (si aplica)
 * - DELETE: Eliminar reseña (si aplica)
 */
import api from './api';
import { logger } from '../utils/logger';

export const reviewService = {
  /**
   * Crea una nueva reseña para un trabajador
   * Verbo HTTP: POST
   *
   * @param {Object} reviewData - Datos de la reseña
   * @param {string} reviewData.contratoId - ID del contrato
   * @param {string} reviewData.trabajadorId - ID del trabajador
   * @param {number} reviewData.calificacion - Rating de 1-5
   * @param {string} reviewData.comentario - Comentario de la reseña
   * @returns {Promise} Reseña creada
   */
  async createReview(reviewData) {
    try {
      logger.api('Creando reseña', { contratoId: reviewData.contratoId });

      const response = await api.post('/reviews', {
        contrato_id: reviewData.contratoId,
        trabajador_id: reviewData.trabajadorId,
        calificacion: reviewData.calificacion,
        comentario: reviewData.comentario,
      });

      logger.api('Reseña creada exitosamente', { reviewId: response.data?.id });
      return response.data;
    } catch (error) {
      logger.error('Error creando reseña:', error.message);
      throw error;
    }
  },

  /**
   * Obtiene todas las reseñas de un trabajador
   * Verbo HTTP: GET
   *
   * @param {string} trabajadorId - ID del trabajador
   * @returns {Promise} Lista de reseñas
   */
  async getWorkerReviews(trabajadorId) {
    try {
      logger.api('Obteniendo reseñas del trabajador', { trabajadorId });
      const response = await api.get(`/users/${trabajadorId}/reviews`);
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo reseñas:', error.message);
      // Si el endpoint no existe, retornar array vacío
      if (error.response?.status === 404) {
        return { status: 'success', data: [] };
      }
      throw error;
    }
  },

  /**
   * Obtiene las estadísticas de reseñas de un trabajador
   * Verbo HTTP: GET
   *
   * @param {string} trabajadorId - ID del trabajador
   * @returns {Promise} Estadísticas (rating promedio, total reviews, etc.)
   */
  async getWorkerStats(trabajadorId) {
    try {
      logger.api('Obteniendo estadísticas del trabajador', { trabajadorId });
      const response = await api.get(`/users/${trabajadorId}/stats`);
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error.message);
      // Si el endpoint no existe, retornar datos por defecto
      if (error.response?.status === 404) {
        return {
          status: 'success',
          data: {
            rating: 0,
            total_reviews: 0,
            trabajos_completados: 0,
          },
        };
      }
      throw error;
    }
  },

  /**
   * Verifica si un contrato ya tiene una reseña
   * Verbo HTTP: GET
   *
   * @param {string} contratoId - ID del contrato
   * @returns {Promise<boolean>} True si ya existe reseña
   */
  async hasReview(contratoId) {
    try {
      logger.api('Verificando si el contrato tiene reseña', { contratoId });
      const response = await api.get(`/contracts/${contratoId}/review`);
      return response.data?.hasReview || false;
    } catch (error) {
      // Si devuelve 404, significa que no hay reseña
      if (error.response?.status === 404) {
        return false;
      }
      logger.error('Error verificando reseña:', error.message);
      throw error;
    }
  },

  /**
   * Obtiene la reseña de un contrato específico
   * Verbo HTTP: GET
   *
   * @param {string} contratoId - ID del contrato
   * @returns {Promise} Datos de la reseña
   */
  async getContractReview(contratoId) {
    try {
      logger.api('Obteniendo reseña del contrato', { contratoId });
      const response = await api.get(`/contracts/${contratoId}/review`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { status: 'success', data: null };
      }
      logger.error('Error obteniendo reseña del contrato:', error.message);
      throw error;
    }
  },

  /**
   * Edita una reseña existente
   * Verbo HTTP: PUT
   *
   * @param {string} reviewId - ID de la reseña
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise} Reseña actualizada
   */
  async updateReview(reviewId, updateData) {
    try {
      logger.api('Actualizando reseña', { reviewId });
      const response = await api.put(`/reviews/${reviewId}`, {
        calificacion: updateData.calificacion,
        comentario: updateData.comentario,
      });
      logger.api('Reseña actualizada exitosamente');
      return response.data;
    } catch (error) {
      logger.error('Error actualizando reseña:', error.message);
      throw error;
    }
  },

  /**
   * Elimina una reseña
   * Verbo HTTP: DELETE
   *
   * @param {string} reviewId - ID de la reseña
   * @returns {Promise} Confirmación de eliminación
   */
  async deleteReview(reviewId) {
    try {
      logger.api('Eliminando reseña', { reviewId });
      const response = await api.delete(`/reviews/${reviewId}`);
      logger.api('Reseña eliminada exitosamente');
      return response.data;
    } catch (error) {
      logger.error('Error eliminando reseña:', error.message);
      throw error;
    }
  },
};
