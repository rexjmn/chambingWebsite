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
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getAvailableSkills() {
    try {
      const response = await api.get('/skills');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getMySkills() {
    try {
      const response = await api.get('/users/me/skills');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ===== MÉTHODES POST =====

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

  async updateSkills(skillIds) {
    try {
      const response = await api.put('/users/profile/skills', { skillIds });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ===== MÉTHODES PATCH =====

  async updateProfile(userData) {
    try {
      const response = await api.patch('/users/profile', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async changeUserType(tipo_usuario) {
    try {
      const response = await api.patch('/users/change-type', { tipo_usuario });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async completeOnboarding() {
    try {
      const response = await api.patch('/users/complete-onboarding');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ===== MÉTHODES DELETE =====

  async deleteProfilePhoto() {
    try {
      const response = await api.delete('/users/profile-photo');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteSkill(skillId) {
    try {
      const response = await api.delete(`/users/profile/skills/${skillId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteAccount() {
    try {
      const response = await api.delete('/users/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
