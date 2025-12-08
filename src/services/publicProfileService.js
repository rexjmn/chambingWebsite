/**
 * ========================================================================
 * SERVICE DE PROFIL PUBLIC - Utilisant AXIOS avec intercepteurs
 * ========================================================================
 *
 * Ce service gère les profils publics des utilisateurs sans authentification.
 * Il utilise l'instance configurée d'Axios avec des intercepteurs.
 *
 * Verbes HTTP utilisés :
 * - GET : Pour obtenir des informations publiques (profil, compétences, avis, statistiques)
 */
import api from './api';

export const publicProfileService = {
  /**
   * Obtient le profil public d'un utilisateur par son ID
   * Verbe HTTP : GET
   * Endpoint public (aucune authentification requise)
   *
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise} Données du profil public
   */
  async getPublicProfile(userId) {
    try {
      // Utilisation d'Axios avec le verbe GET
      const response = await api.get(`/users/public/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtient les compétences d'un travailleur
   * Verbe HTTP : GET
   *
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise} Liste des compétences
   */
  async getUserSkills(userId) {
    try {
      // Utilisation d'Axios avec le verbe GET
      const response = await api.get(`/users/${userId}/skills`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtient les avis d'un travailleur
   * Verbe HTTP : GET
   * NOTE : Ce endpoint n'est pas encore implémenté dans le backend
   *
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise} Liste des avis ou tableau vide
   */
  async getUserReviews(userId) {
    try {
      // Utilisation d'Axios avec le verbe GET
      const response = await api.get(`/users/${userId}/reviews`);
      return response.data;
    } catch (error) {
      // Si le endpoint n'existe pas (404), retourner un tableau vide
      if (error.response?.status === 404) {
        return {
          status: 'success',
          data: []
        };
      }
      // Pour les autres erreurs, retourner également un tableau vide
      return {
        status: 'success',
        data: []
      };
    }
  },

  /**
   * Obtient les statistiques du travailleur (travaux terminés, note, etc.)
   * Verbe HTTP : GET
   * NOTE : Ce endpoint n'est pas encore implémenté dans le backend
   *
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise} Statistiques du travailleur ou données par défaut
   */
  async getUserStats(userId) {
    try {
      // Utilisation d'Axios avec le verbe GET
      const response = await api.get(`/users/${userId}/stats`);
      return response.data;
    } catch (error) {
      // Si le endpoint n'existe pas (404), retourner des données par défaut
      if (error.response?.status === 404) {
        return {
          status: 'success',
          data: {
            trabajos_completados: 0,
            rating: 0,
            total_reviews: 0
          }
        };
      }
      // Pour les autres erreurs, retourner également des données par défaut
      return {
        status: 'success',
        data: {
          trabajos_completados: 0,
          rating: 0,
          total_reviews: 0
        }
      };
    }
  },
};

