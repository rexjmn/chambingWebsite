import { get } from 'react-hook-form';
import api from './api';

export const userService = {
    async getProfile(){
        const response = await api.get('/user/profile');
        return response.data;
    },

    async updateProfile(userData){
        const response = await api.put('/user/profile', userData);
        return response.data;
    },

    async uploadProfilePhoto(file){
        const formData = new FormData();
        formData.append('photo', file);

        const respontse = await api.post('/user/profile/photo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return respontse.data;
    },
    async getUsers(params = {}) {
        const response = await api.get('/user', { params });
        return response.data;
    },
    async getUserById(userId) {
        const response = await api.get(`/user/${id}`);
        return response.data;
    },
};