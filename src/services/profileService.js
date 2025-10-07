import api from './api';

export const profileService = {
  // Usa api (axios) para todo excepto uploads
  async uploadProfilePhoto(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/users/profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }
  },

  async getCurrentUser() {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  },

  async updateProfile(userData) {
    try {
      const response = await api.patch('/users/profile', userData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  async getAvailableSkills() {
    try {
      const response = await api.get('/skills');
      return response.data;
    } catch (error) {
      console.error('Error fetching skills:', error);
      throw error;
    }
  },

  async getMySkills() {
    try {
      const response = await api.get('/users/me/skills');
      return response.data;
    } catch (error) {
      console.error('Error fetching user skills:', error);
      throw error;
    }
  },

  async updateSkills(skillIds) {
    try {
      const response = await api.put('/users/profile/skills', { skillIds });
      return response.data;
    } catch (error) {
      console.error('Error updating skills:', error);
      throw error;
    }
  },
};