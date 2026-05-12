import api from './api';

/**
 * Geocodificación inversa vía API (Nominatim en servidor).
 */
export const geocodeService = {
  async reverse(lat, lng) {
    const response = await api.get('/geocode/reverse', {
      params: { lat, lng },
    });
    return response.data;
  },
};
