const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const workerService = {
  /**
   * Obtiene trabajadores verificados con filtros
   */
  async getVerifiedWorkers(filters = {}) {
    try {
      // Construir query params
      const params = new URLSearchParams();
      
      if (filters.categoria) params.append('categoria', filters.categoria);
      if (filters.departamento) params.append('departamento', filters.departamento);
      if (filters.search) params.append('search', filters.search);
      if (filters.verificado !== undefined) params.append('verificado', filters.verificado);
      
      const queryString = params.toString();
      const url = `${API_BASE_URL}/users/workers${queryString ? `?${queryString}` : ''}`;
      
      console.log('Fetching workers from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar trabajadores');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching workers:', error);
      throw error;
    }
  },

  /**
   * Obtiene un trabajador específico por ID
   */
  async getWorkerById(workerId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/public/${workerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar el trabajador');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching worker:', error);
      throw error;
    }
  },

  /**
   * Obtiene las categorías disponibles (puedes implementar esto en el backend)
   */
  async getCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/services/categorias`);
      
      if (!response.ok) {
        // Si el endpoint no existe, retornar categorías por defecto
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

      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Retornar categorías por defecto en caso de error
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
  }
};