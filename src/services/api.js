import axios from 'axios';

/**
 * ========================================================================
 * CONFIGURATION AXIOS AVEC INTERCEPTEURS
 * ========================================================================
 *
 * Ce fichier configure une instance centralisée d'Axios avec :
 * 1. URL de base dynamique selon l'environnement
 * 2. Intercepteurs de requêtes pour l'authentification
 * 3. Intercepteurs de réponses pour la gestion des erreurs
 * 4. Support pour tous les verbes HTTP : GET, POST, PUT, PATCH, DELETE
 */

// Configuration de l'URL de base selon l'environnement
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://chambingapi.onrender.com/api'
    : 'http://localhost:3000/api');

/**
 * Instance Axios configurée avec une URL de base et des en-têtes par défaut
 * Cette instance sera utilisée par tous les services de l'application
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Timeout de 30 secondes
});

// Variable pour éviter les redirections multiples simultanées
let isRedirecting = false;

/**
 * ========================================================================
 * INTERCEPTEUR DE REQUÊTES (REQUEST)
 * ========================================================================
 *
 * S'exécute AVANT chaque requête HTTP
 * Fonctionnalités :
 * - Ajoute automatiquement le token d'authentification dans l'en-tête Authorization
 * - Peut ajouter d'autres en-têtes communs
 */
api.interceptors.request.use(
  (config) => {
    // Obtenir le token du localStorage
    const token = localStorage.getItem('token');

    // Si le token existe, l'ajouter à l'en-tête Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * ========================================================================
 * INTERCEPTEUR DE RÉPONSES (RESPONSE)
 * ========================================================================
 *
 * S'exécute APRÈS chaque réponse HTTP
 * Fonctionnalités :
 * - Gère les réponses réussies (2xx)
 * - Gère les erreurs d'authentification (401) avec un rafraîchissement de token automatique
 * - Gère les autres erreurs HTTP (404, 500, etc.)
 */
api.interceptors.response.use(
  // Gestion des réponses réussies (statut 2xx)
  (response) => {
    return response;
  },
  // Gestion des erreurs (statut 4xx, 5xx)
  async (error) => {
    // === GESTION DE L'ERREUR 401 (Non Autorisé) ===
    if (error.response?.status === 401) {
      // Éviter les redirections multiples simultanées
      if (isRedirecting) {
        return Promise.reject(error);
      }

      // Tenter de rafraîchir le token automatiquement
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken && !error.config._retry) {
        error.config._retry = true;

        try {
          // Utiliser une instance d'axios séparée pour éviter l'intercepteur récursif
          const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: refreshToken
          });

          const newToken = refreshResponse.data.accessToken;
          localStorage.setItem('token', newToken);

          // Réessayer la requête originale avec le nouveau token
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api.request(error.config);

        } catch (refreshError) {
          handleLogout();
        }
      } else {
        handleLogout();
      }
    }

    return Promise.reject(error);
  }
);

/**
 * ========================================================================
 * FONCTION DE DÉCONNEXION AUTOMATIQUE
 * ========================================================================
 *
 * Nettoie la session de l'utilisateur et redirige vers la page de connexion lorsque :
 * - Le token a expiré et ne peut pas être rafraîchi
 * - Le refresh token a également expiré
 * - Il y a une erreur d'authentification non récupérable
 */
function handleLogout() {
  // Prévenir les appels multiples simultanés
  if (isRedirecting) return;

  isRedirecting = true;

  // Nettoyer toutes les données d'authentification du localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');

  // Rediriger vers la page de connexion après un court délai
  // Cela évite les problèmes de course conditionnelle avec les requêtes en attente
  setTimeout(() => {
    window.location.href = '/login';
    isRedirecting = false;
  }, 100);
}

/**
 * ========================================================================
 * EXPORTATION DE L'INSTANCE AXIOS
 * ========================================================================
 *
 * Cette instance configurée doit être importée dans tous les services :
 *
 * import api from './api';
 *
 * UTILISATION DES VERBES HTTP :
 * - GET:    api.get('/endpoint')
 * - POST:   api.post('/endpoint', data)
 * - PUT:    api.put('/endpoint', data)
 * - PATCH:  api.patch('/endpoint', data)
 * - DELETE: api.delete('/endpoint')
 *
 * Tous les intercepteurs seront appliqués automatiquement à ces requêtes.
 */
export default api;
