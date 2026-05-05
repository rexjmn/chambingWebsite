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

  async getCurrentUser() {
    const response = await api.get('/users/me');
    return response.data;
  },

  async getAvailableSkills() {
    const response = await api.get('/skills');
    return response.data;
  },

  async getMySkills() {
    const response = await api.get('/users/me/skills');
    return response.data;
  },

  // ===== MÉTHODES POST =====

  async uploadProfilePhoto(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/users/profile-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // ===== MÉTHODES PUT =====

  async updateSkills(skillIds) {
    const response = await api.put('/users/profile/skills', { skillIds });
    return response.data;
  },

  // ===== MÉTHODES PATCH =====

  async updateProfile(userData) {
    const response = await api.patch('/users/profile', userData);
    return response.data;
  },

  async changeUserType(tipo_usuario) {
    const response = await api.patch('/users/change-type', { tipo_usuario });
    return response.data;
  },

  async completeOnboarding() {
    const response = await api.patch('/users/complete-onboarding');
    return response.data;
  },

  // ===== MÉTHODES DELETE =====

  async deleteProfilePhoto() {
    const response = await api.delete('/users/profile-photo');
    return response.data;
  },

  async deleteSkill(skillId) {
    const response = await api.delete(`/users/profile/skills/${skillId}`);
    return response.data;
  },

  async deleteAccount() {
    const response = await api.delete('/users/me');
    return response.data;
  },
};
