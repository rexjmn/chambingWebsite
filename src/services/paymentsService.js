import api from './api';

export const paymentsService = {
    async createPayment(data) {
        const response = await api.post('/payments', data);
        return response.data;
    },
    async getPaymentHistory(params = {}) {
        const response = await api.get('/payments/history', { params });
        return response.data;
    },

    async getWorkerBalance() {
        const response = await api.get('/payments/balance');
        return response.data;
    },

    async processWompiPayment(data) {
        const response = await api.post('/payments/wompi/process', data);
        return response.data;
    },
    async getPaymentById(id) {
        const response = await api.get(`/payments/${id}`);
        return response.data;
    },

    async confirmPayment(id) {
        const response = await api.post(`/payments/${id}/confirm`);
        return response.data;
    },
};