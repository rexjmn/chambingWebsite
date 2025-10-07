import api from './api';

export const contractService = {
  // ========== OBTENER CONTRATOS ==========
  
  /**
   * Obtiene todos los contratos del usuario autenticado
   */
  async getMyContracts(rol = null, estado = null) {
    try {
      console.log('🔧 Obteniendo mis contratos...');
      
      let url = '/contracts/mis-contratos';
      const params = [];
      
      if (rol) params.push(`rol=${rol}`); // 'empleador' o 'trabajador'
      if (estado) params.push(`estado=${estado}`);
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      const response = await api.get(url);
      console.log('✅ Contratos recibidos:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo contratos:', error);
      
      if (error.response?.status === 404 || error.response?.status === 401) {
        return { status: 'success', data: [], count: 0 };
      }
      
      throw error;
    }
  },

  /**
   * Obtiene un contrato por ID
   */
  async getContractById(id) {
    try {
      console.log('🔧 Obteniendo contrato:', id);
      const response = await api.get(`/contracts/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo contrato:', error);
      throw error;
    }
  },

  /**
   * Busca un contrato por su código
   */
  async getContractByCode(codigo) {
    try {
      console.log('🔧 Buscando contrato por código:', codigo);
      const response = await api.get(`/contracts/codigo/${codigo}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error buscando contrato:', error);
      throw error;
    }
  },

  // ========== CREAR CONTRATO ==========
  
  /**
   * Crea un nuevo contrato
   */
  async createContract(contractData) {
    try {
      console.log('🔧 Creando contrato:', contractData);
      const response = await api.post('/contracts', contractData);
      console.log('✅ Contrato creado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creando contrato:', error);
      throw error;
    }
  },

  // ========== ACTIVAR CONTRATO (PIN o QR) ==========
  
  /**
   * Activa un contrato usando PIN
   */
  async activarContratoConPIN(codigoContrato, pin) {
    try {
      console.log('🔧 Activando contrato con PIN:', codigoContrato);
      const response = await api.post('/contracts/activar', {
        metodoActivacion: 'pin',
        codigoContrato,
        pin
      });
      console.log('✅ Contrato activado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error activando contrato:', error);
      throw error;
    }
  },

  /**
   * Activa un contrato usando QR code
   */
  async activarContratoConQR(qrData) {
    try {
      console.log('🔧 Activando contrato con QR');
      const response = await api.post('/contracts/activar', {
        metodoActivacion: 'qr',
        qrData
      });
      console.log('✅ Contrato activado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error activando contrato con QR:', error);
      throw error;
    }
  },

  // ========== COMPLETAR CONTRATO ==========
  
  /**
   * Marca el contrato como completado (solo trabajador)
   */
  async completarContrato(contratoId, notas = '') {
    try {
      console.log('🔧 Completando contrato:', contratoId);
      const response = await api.patch(`/contracts/${contratoId}/completar`, {
        notas
      });
      console.log('✅ Contrato completado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error completando contrato:', error);
      throw error;
    }
  },

  // ========== CERRAR CONTRATO (LIBERAR PAGO) ==========
  
  /**
   * Cierra el contrato y libera el pago (solo empleador)
   */
  async cerrarContrato(contratoId, notas = '') {
    try {
      console.log('🔧 Cerrando contrato:', contratoId);
      const response = await api.patch(`/contracts/${contratoId}/cerrar`, {
        notas
      });
      console.log('✅ Contrato cerrado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error cerrando contrato:', error);
      throw error;
    }
  },

  // ========== CANCELAR CONTRATO ==========
  
  /**
   * Cancela el contrato
   */
  async cancelarContrato(contratoId, motivo) {
    try {
      console.log('🔧 Cancelando contrato:', contratoId);
      const response = await api.patch(`/contracts/${contratoId}/cancelar`, {
        motivo
      });
      console.log('✅ Contrato cancelado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error cancelando contrato:', error);
      throw error;
    }
  },

  // ========== HISTORIAL ==========
  
  /**
   * Obtiene el historial de cambios de estado
   */
  async getHistorial(contratoId) {
    try {
      console.log('🔧 Obteniendo historial:', contratoId);
      const response = await api.get(`/contracts/${contratoId}/historial`);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      throw error;
    }
  }
};