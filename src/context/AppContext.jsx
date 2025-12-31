import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { serviceService } from '../services/serviceService';
import { contractService } from '../services/contractService';
import { logger } from '../utils/logger';

const AppContext = createContext();

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_CONTRACTS':
      return { ...state, contracts: action.payload };
    case 'ADD_CONTRACT':
      return { 
        ...state, 
        contracts: [action.payload, ...state.contracts] 
      };
    case 'UPDATE_CONTRACT':
      return {
        ...state,
        contracts: state.contracts.map(contract =>
          contract.id === action.payload.id ? action.payload : contract
        ),
      };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        ),
      };
    default:
      return state;
  }
};

const initialState = {
  loading: false,
  error: null,
  categories: [],
  contracts: [],
  notifications: [],
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load initial data
  useEffect(() => {
    loadCategories();
  }, []);

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const loadCategories = async () => {
    try {
      logger.log('📂 AppContext: Cargando categorías...');
      const categories = await serviceService.getCategories();
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
      logger.log('✅ AppContext: Categorías cargadas', categories.length);
    } catch (error) {
      logger.error('❌ AppContext: Error cargando categorías', error);
      // No mostrar error en UI para categorías, usar datos mock
      const mockCategories = [
        { id: 1, nombre: 'Limpieza Doméstica', descripcion: 'Servicio de limpieza para el hogar', icono: 'cleaning' },
        { id: 2, nombre: 'Plomería', descripcion: 'Reparaciones e instalaciones', icono: 'plumbing' },
        { id: 3, nombre: 'Electricidad', descripcion: 'Trabajos eléctricos', icono: 'electrical' },
        { id: 4, nombre: 'Jardinería', descripcion: 'Mantenimiento de jardines', icono: 'garden' },
        { id: 5, nombre: 'Carpintería', descripcion: 'Trabajos en madera', icono: 'carpenter' },
        { id: 6, nombre: 'Construcción', descripcion: 'Obras y remodelaciones', icono: 'build' },
      ];
      dispatch({ type: 'SET_CATEGORIES', payload: mockCategories });
    }
  };

  const loadContracts = async () => {
    try {
      setLoading(true);
      logger.log('📋 AppContext: Cargando contratos...');
      const contracts = await contractService.getMyContracts();
      dispatch({ type: 'SET_CONTRACTS', payload: contracts });
      logger.log('✅ AppContext: Contratos cargados', contracts.length);
    } catch (error) {
      logger.error('❌ AppContext: Error cargando contratos', error);
      setError('Error al cargar contratos');
    } finally {
      setLoading(false);
    }
  };

  const createContract = async (contractData) => {
    try {
      setLoading(true);
      logger.log('📝 AppContext: Creando contrato...');
      const newContract = await contractService.createContract(contractData);
      dispatch({ type: 'ADD_CONTRACT', payload: newContract });
      addNotification({
        type: 'success',
        message: 'Contrato creado exitosamente',
      });
      logger.log('✅ AppContext: Contrato creado', newContract);
      return newContract;
    } catch (error) {
      logger.error('❌ AppContext: Error creando contrato', error);
      setError('Error al crear contrato');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateContract = async (contractId, updateData) => {
    try {
      setLoading(true);
      logger.log('📝 AppContext: Actualizando contrato...');
      const updatedContract = await contractService.updateContractStatus(contractId, updateData);
      dispatch({ type: 'UPDATE_CONTRACT', payload: updatedContract });
      addNotification({
        type: 'success',
        message: 'Contrato actualizado exitosamente',
      });
      return updatedContract;
    } catch (error) {
      logger.error('❌ AppContext: Error actualizando contrato', error);
      setError('Error al actualizar contrato');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (notification) => {
    const notificationWithId = {
      id: Date.now(),
      timestamp: new Date(),
      ...notification,
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: notificationWithId });

    // Auto remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(notificationWithId.id);
    }, 5000);
  };

  const removeNotification = (notificationId) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: notificationId });
  };

  const value = {
    ...state,
    setLoading,
    setError,
    clearError,
    loadCategories,
    loadContracts,
    createContract,
    updateContract,
    addNotification,
    removeNotification,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
