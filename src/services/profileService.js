/**
 * ========================================================================
 * SERVICE DE PROFIL - Utilisant AXIOS avec intercepteurs
 * ========================================================================
 *
 * Ce service gère le profil de l'utilisateur authentifié.
 * Il utilise l'instance configurée d'Axios avec des intercepteurs.
 *
 * Verbes HTTP utilisés (TOUS) :
 * - GET :    Pour obtenir les données du profil et les compétences
 * - POST :   Pour télécharger des fichiers (photo de profil)
 * - PUT :    Pour remplacer complètement des données (compétences)
 * - PATCH :  Pour mettre à jour partiellement des données (profil)
 * - DELETE : Pour supprimer des ressources (photo de profil, compétences)
 */
import api from './api';

export const profileService = {
  // ===== MÉTHODES GET =====

  /**
   * Obtient les données de l'utilisateur actuellement authentifié
   * Verbe HTTP : GET
   *
   * @returns {Promise} Données de l'utilisateur actuel
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtient toutes les compétences disponibles dans le système
   * Verbe HTTP : GET
   *
   * @returns {Promise} Liste des compétences disponibles
   */
  async getAvailableSkills() {
    try {
      const response = await api.get('/skills');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtient les compétences de l'utilisateur actuel
   * Verbe HTTP : GET
   *
   * @returns {Promise} Liste des compétences de l'utilisateur
   */
  async getMySkills() {
    try {
      const response = await api.get('/users/me/skills');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ===== MÉTHODES POST =====

  /**
   * Télécharge une photo de profil pour l'utilisateur actuel
   * Verbe HTTP : POST avec FormData (multipart/form-data)
   *
   * @param {File} file - Fichier image à télécharger
   * @returns {Promise} URL de la photo téléchargée
   */
  async uploadProfilePhoto(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/users/profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ===== MÉTHODES PUT =====

  /**
   * Met à jour/remplace complètement les compétences de l'utilisateur
   * Verbe HTTP : PUT (remplacement complet)
   *
   * @param {Array} skillIds - Tableau d'IDs de compétences
   * @returns {Promise} Compétences mises à jour
   */
  async updateSkills(skillIds) {
    try {
      const response = await api.put('/users/profile/skills', { skillIds });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ===== MÉTHODES PATCH =====

  /**
   * Met à jour partiellement le profil de l'utilisateur
   * Verbe HTTP : PATCH (mise à jour partielle)
   * Envoie uniquement les champs à modifier
   *
   * @param {Object} userData - Données à mettre à jour (nom, email, etc.)
   * @returns {Promise} Profil mis à jour
   */
  async updateProfile(userData) {
    try {
      const response = await api.patch('/users/profile', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ===== MÉTHODES DELETE =====

  /**
   * Supprime la photo de profil de l'utilisateur actuel
   * Verbe HTTP : DELETE
   *
   * @returns {Promise} Confirmation de suppression
   */
  async deleteProfilePhoto() {
    try {
      const response = await api.delete('/users/profile-photo');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Supprime une compétence spécifique du profil de l'utilisateur
   * Verbe HTTP : DELETE
   *
   * @param {string} skillId - ID de la compétence à supprimer
   * @returns {Promise} Confirmation de suppression
   */
  async deleteSkill(skillId) {
    try {
      const response = await api.delete(`/users/profile/skills/${skillId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Supprime complètement le compte de l'utilisateur
   * Verbe HTTP : DELETE
   * AVERTISSEMENT : Cette action est irréversible
   *
   * @returns {Promise} Confirmation de suppression
   */
  async deleteAccount() {
    try {
      const response = await api.delete('/users/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
