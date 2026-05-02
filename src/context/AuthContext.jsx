import React, { createContext, useContext, useState, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';
import { logger } from '../utils/logger';
import api from '../services/api'; 

const AuthContext = createContext();

logger.debug('🔍 AuthContext module loaded:', new Date().toISOString());

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
      
    case 'LOGIN_SUCCESS':
      if (!action.payload) {
        logger.error('❌ LOGIN_SUCCESS: payload es undefined');
        return {
          ...state,
          loading: false,
          error: 'Error en la respuesta del servidor',
          isAuthenticated: false,
        };
      }

      const token = action.payload.access_token || action.payload.token;
      const user = action.payload.user;

      if (token) {
        localStorage.setItem('token', token);
      }

      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('chambing_needs_onboarding');
      
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
      const updatedUser = {
        ...state.user,
        ...action.payload
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      
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
      if (action.payload) {
        localStorage.setItem('user', JSON.stringify(action.payload));
      }

      return {
        ...state,
        loading: false,
        user: action.payload,
        isAuthenticated: !!action.payload,
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
  loading: true,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const refreshUser = async () => {
    dispatch({ type: 'REFRESH_USER_START' });

    try {
      const response = await api.get('/users/me');
      const user = response.data?.data;

      dispatch({
        type: 'REFRESH_USER_SUCCESS',
        payload: user
      });

      return user || null;
    } catch (error) {
      logger.error('❌ Error refreshing user:', error);

      if (error.response?.status === 401) {
        dispatch({ type: 'LOGOUT' });
      }

      dispatch({
        type: 'REFRESH_USER_FAILURE',
        payload: error.message
      });

      return null;
    }
  };

  const debugUserState = async () => {
    if (!state.isAuthenticated) {
      return { error: 'User not authenticated' };
    }

    try {
      const response = await api.get('/users/debug');
      return response.data;
    } catch (error) {
      return { error: error.message };
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);

          dispatch({
            type: 'INIT_FROM_STORAGE',
            payload: { token: null, user }
          });

          if (window.location.pathname !== '/auth/google-callback') {
            setTimeout(async () => {
              try {
                await refreshUser();
              } catch (error) {
                logger.error('❌ Error refreshing user in background:', error);
              }
            }, 100);
          }

        } catch (error) {
          logger.error('❌ Error parsing stored user:', error);
          localStorage.removeItem('user');
          dispatch({ type: 'INIT_COMPLETE' });
        }
      } else {
        dispatch({ type: 'INIT_COMPLETE' });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authService.login(credentials);

      if (!response) {
        throw new Error('La respuesta del servidor es undefined');
      }

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: response,
      });

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
      const response = await authService.register(userData);

      if (!response) {
        throw new Error('La respuesta del servidor es undefined');
      }

      dispatch({ type: 'SET_LOADING', payload: false });
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
      await authService.logout();
    } catch (error) {
      logger.error('Error during logout:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateUser = (userData) => {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
