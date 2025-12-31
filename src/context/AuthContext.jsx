import React, { createContext, useContext, useState, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';
import { logger } from '../utils/logger';
import api from '../services/api'; 

const AuthContext = createContext();

// Debug: Verificar múltiples instancias
logger.debug('🔍 AuthContext module loaded:', new Date().toISOString());

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
      
    case 'LOGIN_SUCCESS':
      // Validación para evitar el error
      if (!action.payload) {
        logger.error('❌ LOGIN_SUCCESS: payload es undefined');
        return {
          ...state,
          loading: false,
          error: 'Error en la respuesta del servidor',
          isAuthenticated: false,
        };
      }

      // ⭐ SOLUCIÓN: Guardar token en localStorage
      const token = action.payload.access_token || action.payload.token;
      const user = action.payload.user;

      if (token) {
        localStorage.setItem('token', token);
        logger.auth('Token guardado en localStorage', { tokenPreview: token.substring(0, 20) + '...' });
      }

      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        logger.auth('Usuario guardado en localStorage', { email: user.email });
      }
      
      return {
        ...state,
        loading: false,
        user: user || null,
        token: token || null,
        isAuthenticated: true,
        error: null,
      };
      
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
      };
      
    case 'LOGOUT':
      // ⭐ Limpiar localStorage en logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      logger.auth('Token y usuario removidos del localStorage');
      
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
      
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
      };
      
    case 'UPDATE_USER':
      // Actualizar usuario y guardarlo en localStorage
      const updatedUser = {
        ...state.user,
        ...action.payload
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      logger.auth('Usuario actualizado en localStorage');
      
      return {
        ...state,
        user: updatedUser
      };
      
    case 'REFRESH_USER_START':
      return {
        ...state,
        loading: true
      };
      
    case 'REFRESH_USER_SUCCESS':
      // Guardar usuario actualizado en localStorage
      if (action.payload) {
        localStorage.setItem('user', JSON.stringify(action.payload));
        logger.auth('Usuario actualizado desde servidor');
      }
      
      return {
        ...state,
        loading: false,
        user: action.payload,
        error: null
      };
      
    case 'REFRESH_USER_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
      
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
      
    // ⭐ NUEVO: Para inicialización desde localStorage
    case 'INIT_FROM_STORAGE':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
      
    case 'INIT_COMPLETE':
      return {
        ...state,
        loading: false,
      };
      
    default:
      return state;
  }
};

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true, // ⭐ IMPORTANTE: Empezar con loading=true para evitar redirects prematuros
  error: null,
};

export const AuthProvider = ({ children }) => {
  logger.debug('🔍 AuthProvider renderizado');
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Nueva función: Refrescar datos del usuario desde el servidor
  // Con httpOnly cookies, no necesitamos el token - se envía automáticamente
  const refreshUser = async () => {
    dispatch({ type: 'REFRESH_USER_START' });

    try {
      logger.auth('Refreshing user data from server...');

      // ✅ Usar api.get() en lugar de fetch() - aprovecha interceptores
      const response = await api.get('/users/me');

      const userData = response.data;
      logger.auth('User data refreshed', {
        id: userData.data?.id,
        email: userData.data?.email,
        hasFoto: !!userData.data?.foto_perfil,
        fotoUrl: userData.data?.foto_perfil || 'No photo'
      });

      dispatch({
        type: 'REFRESH_USER_SUCCESS',
        payload: userData.data
      });

    } catch (error) {
      logger.error('❌ Error refreshing user:', error);

      // El interceptor de api.js ya maneja errores 401
      if (error.response?.status === 401) {
        logger.auth('Session invalid (401), logging out');
        dispatch({ type: 'LOGOUT' });
      }

      dispatch({
        type: 'REFRESH_USER_FAILURE',
        payload: error.message
      });
    }
  };

  // Nueva función: Debug del estado del usuario
  // Con httpOnly cookies, no necesitamos el token
  const debugUserState = async () => {
    // Si el usuario no está autenticado, no hay nada que debuggear
    if (!state.isAuthenticated) {
      logger.debug('🐛 Debug: User not authenticated');
      return { error: 'User not authenticated' };
    }

    try {
      // ✅ Usar api.get() en lugar de fetch()
      const response = await api.get('/users/debug');
      const debugData = response.data;
      logger.debug('🐛 Debug data from server:', debugData);
      return debugData;
    } catch (error) {
      logger.error('🐛 Debug error:', error);
      return { error: error.message };
    }
  };

  // ⭐ INICIALIZACIÓN MEJORADA - Con httpOnly cookies
  useEffect(() => {
    const initializeAuth = async () => {
      // ✅ Con httpOnly cookies, el token NO está en localStorage
      // Solo verificamos si hay información de usuario guardada
      const storedUser = localStorage.getItem('user');

      logger.auth('Inicializando auth con httpOnly cookies...', {
        hasStoredUser: !!storedUser,
      });

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          logger.auth('Restored user from localStorage', { email: user.email });

          // ⭐ Restaurar estado con usuario (el token está en las cookies httpOnly)
          dispatch({
            type: 'INIT_FROM_STORAGE',
            payload: { token: null, user } // token es null porque está en httpOnly cookie
          });

          // Después, refrescar datos del servidor en background para verificar que la sesión sigue válida
          setTimeout(async () => {
            try {
              await refreshUser();
            } catch (error) {
              logger.error('❌ Error refreshing user in background:', error);
              // Si falla la verificación (401), limpiar todo
              if (error.message.includes('401')) {
                logger.auth('Session expired or invalid, logging out');
                dispatch({ type: 'LOGOUT' });
              }
            }
          }, 100);

        } catch (error) {
          logger.error('❌ Error parsing stored user:', error);
          // Si hay error parseando el usuario guardado, limpiar localStorage
          localStorage.removeItem('user');

          // Y simplemente completar la inicialización sin usuario
          // (Si hay una sesión válida con cookies, se restaurará en el siguiente refresh)
          dispatch({ type: 'INIT_COMPLETE' });
        }
      } else {
        logger.auth('No user found in localStorage - User not authenticated');
        dispatch({ type: 'INIT_COMPLETE' });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      logger.auth('Iniciando login...', { email: credentials.email });
      const response = await authService.login(credentials);

      // Verificar que la respuesta no sea undefined o null
      if (!response) {
        throw new Error('La respuesta del servidor es undefined');
      }

      logger.auth('Login exitoso', response);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: response,
      });

      // Después del login exitoso, refrescar datos del usuario
      logger.auth('Refreshing user data after login...');
      setTimeout(async () => {
        try {
          await refreshUser();
        } catch (error) {
          logger.error('❌ Error refreshing user after login:', error);
        }
      }, 500);

      return response;
    } catch (error) {
      logger.error('❌ AuthContext: Error en login', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al iniciar sesión';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      throw error;
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      logger.auth('Iniciando registro...', { email: userData.email });
      const response = await authService.register(userData);

      // Verificar que la respuesta no sea undefined
      if (!response) {
        throw new Error('La respuesta del servidor es undefined');
      }

      logger.auth('Registro exitoso', response);
      return response;
    } catch (error) {
      logger.error('❌ AuthContext: Error en registro', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al registrarse';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      logger.auth('Cerrando sesión...');
      await authService.logout();
    } catch (error) {
      logger.error('Error during logout:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      logger.auth('Sesión cerrada');
    }
  };

  const updateUser = (userData) => {
    logger.auth('Updating user locally', userData);
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    refreshUser,        
    debugUserState,     
    clearError,
    setLoading,
  };

  logger.debug('🔍 AuthProvider value:', {
    hasUser: !!value.user,
    hasToken: !!value.token,
    isAuthenticated: value.isAuthenticated,
    loading: value.loading,
    userHasPhoto: !!value.user?.foto_perfil,
    tokenInStorage: !!localStorage.getItem('token')
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  logger.debug('🔍 useAuth llamado');
  const context = useContext(AuthContext);

  if (!context) {
    logger.error('❌ useAuth: Context es undefined!');
    logger.error('❌ Esto significa que useAuth se está llamando fuera del AuthProvider');
    logger.error('❌ Stack trace:');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};