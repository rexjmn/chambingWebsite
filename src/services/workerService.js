/**
 * ========================================================================
 * SERVICE DES TRAVAILLEURS - Utilisant AXIOS avec intercepteurs
 * ========================================================================
 *
 * Ce service gère les travailleurs et leurs données associées.
 * Il utilise l'instance configurée d'Axios avec des intercepteurs.
 *
 * Verbes HTTP utilisés :
 * - GET : Pour obtenir les travailleurs, les catégories et les données associées
 */
import api from './api';

export const workerService = {
  /**
   * Obtient les travailleurs vérifiés avec des filtres optionnels
   * Verbe HTTP : GET avec des paramètres de requête
   *
   * @param {Object} filters - Filtres de recherche (catégorie, département, recherche, vérifié)
   * @returns {Promise} Liste des travailleurs
   */
  async getVerifiedWorkers(filters = {}) {
    try {
      // Construire les paramètres de requête - Axios permet de passer les params directement
      const params = {};

      if (filters.categoria) params.categoria = filters.categoria;
      if (filters.departamento) params.departamento = filters.departamento;
      if (filters.search) params.search = filters.search;
      if (filters.verificado !== undefined) params.verificado = filters.verificado;

      // Utilisation d'Axios avec le verbe GET et les params
      const response = await api.get('/users/workers', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtient un travailleur spécifique par ID
   * Verbe HTTP : GET
   *
   * @param {string} workerId - ID du travailleur
   * @returns {Promise} Données du travailleur
   */
  async getWorkerById(workerId) {
    try {
      // Utilisation d'Axios avec le verbe GET
      const response = await api.get(`/users/public/${workerId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtient les catégories de services disponibles
   * Verbe HTTP : GET
   *
   * @returns {Promise} Liste des catégories
   */
  async getCategories() {
    try {
      // Utilisation d'Axios avec le verbe GET
      const response = await api.get('/services/categorias');
      return response.data;
    } catch (error) {
      // Si le endpoint n'existe pas, retourner des catégories par défaut
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
          ]
        };
      }

      // Pour les autres erreurs, retourner également des catégories par défaut
      return {
        status: 'success',
        data: [
          { id: '1', nombre: 'Construcción' },
          { id: '2', nombre: 'Limpieza' },
          { id: '3', nombre: 'Jardinería' },
          { id: '4', nombre: 'Plomería' },
          { id: '5', nombre: 'Electricidad' },
          { id: '6', nombre: 'Carpintería' },
        ]
      };
    }
  },

  /**
   * Obtient les travailleurs mis en avant (featured)
   * Verbe HTTP : GET (via getVerifiedWorkers)
   * Pour l'instant, retourne les travailleurs vérifiés comme étant mis en avant
   *
   * @param {number} limit - Nombre maximum de travailleurs à retourner
   * @returns {Promise} Liste des travailleurs mis en avant
   */
  async getFeaturedWorkers(limit = 8) {
    try {
      // Réutilise getVerifiedWorkers qui utilise Axios GET en interne
      const response = await this.getVerifiedWorkers({ verificado: true });

      if (response.status === 'success' && response.data) {
        // Prendre seulement les premiers 'limit' travailleurs
        return response.data.slice(0, limit);
      }

      return [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Obtient les travailleurs les mieux notés
   * Verbe HTTP : GET (via getVerifiedWorkers)
   * Pour l'instant, retourne les travailleurs vérifiés comme étant les mieux notés
   *
   * @param {number} limit - Nombre maximum de travailleurs à retourner
   * @returns {Promise} Liste des travailleurs les mieux notés
   */
  async getTopRatedWorkers(limit = 8) {
    try {
      // Réutilise getVerifiedWorkers qui utilise Axios GET en interne
      const response = await this.getVerifiedWorkers({ verificado: true });

      if (response.status === 'success' && response.data) {
        // Prendre seulement les premiers 'limit' travailleurs
        return response.data.slice(0, limit);
      }

      return [];
    } catch (error) {
      return [];
    }
  }
};
