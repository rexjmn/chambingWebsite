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
import { logger } from '../utils/logger';

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
  },

  /**
   * Obtient les travailleurs filtrés par catégorie
   * Verbe HTTP : GET avec paramètres de catégorie
   *
   * @param {string} categoryId - ID ou nom de la catégorie
   * @param {Object} additionalFilters - Filtres supplémentaires optionnels
   * @returns {Promise} Liste des travailleurs de cette catégorie
   */
  async getWorkersByCategory(categoryId, additionalFilters = {}) {
    try {
      // Combiner le filtre de catégorie avec d'autres filtres
      const filters = {
        ...additionalFilters,
        categoria: categoryId,
        verificado: true
      };

      const response = await this.getVerifiedWorkers(filters);

      if (response.status === 'success' && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      logger.error('Error obteniendo trabajadores por categoría:', error.message);
      return [];
    }
  },

  /**
   * Categoriza los travailleurs par leurs compétences
   * Groupe les travailleurs selon leurs skills en une ou plusieurs catégories
   *
   * @returns {Promise} Objet avec catégories comme clés et tableaux de travailleurs comme valeurs
   */
  async categorizeWorkersBySkills() {
    try {
      const response = await this.getVerifiedWorkers({ verificado: true });

      if (response.status !== 'success' || !response.data) {
        return {};
      }

      const workers = response.data;
      const categorized = {};

      // Mapeo de skills a categorías
      const skillToCategoryMap = {
        // Limpieza
        'limpieza_domestica': 'Limpieza',
        'limpieza_oficinas': 'Limpieza',
        'lavanderia': 'Limpieza',

        // Construcción
        'construccion': 'Construcción',
        'albanileria': 'Construcción',
        'techos': 'Construcción',

        // Plomería
        'plomeria': 'Plomería',
        'instalacion_sanitarios': 'Plomería',
        'destapes': 'Plomería',

        // Electricidad
        'electricidad': 'Electricidad',
        'instalacion_electrica': 'Electricidad',
        'reparacion_electrodomesticos': 'Electricidad',

        // Carpintería
        'carpinteria': 'Carpintería',
        'muebles': 'Carpintería',
        'ebanisteria': 'Carpintería',

        // Jardinería
        'jardineria': 'Jardinería',
        'paisajismo': 'Jardinería',
        'poda': 'Jardinería',

        // Otros
        'pintura': 'Pintura',
        'mecanica': 'Mecánica',
        'catering': 'Catering',
        'seguridad': 'Seguridad'
      };

      workers.forEach(worker => {
        // Obtener las skills del trabajador (puede estar en worker.skills o worker.habilidades)
        const workerSkills = worker.skills || worker.habilidades || [];

        // Si el trabajador tiene skills, categorizarlo
        if (Array.isArray(workerSkills) && workerSkills.length > 0) {
          workerSkills.forEach(skill => {
            const skillName = typeof skill === 'string' ? skill : skill.nombre || skill.name;
            const category = skillToCategoryMap[skillName] || 'Otros';

            if (!categorized[category]) {
              categorized[category] = [];
            }

            // Evitar duplicados si el trabajador tiene múltiples skills de la misma categoría
            if (!categorized[category].find(w => w.id === worker.id)) {
              categorized[category].push(worker);
            }
          });
        } else {
          // Si no tiene skills definidas, ponerlo en "Sin categorizar"
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
  }
};
