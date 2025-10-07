import React, { createContext, useContext, useState, useReducer, useEffect } from 'react';
import { authService } from '../services/authService'; 

const AuthContext = createContext();

// Debug: Verificar múltiples instancias
console.log('🔍 AuthContext module loaded:', new Date().toISOString());

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
      
    case 'LOGIN_SUCCESS':
      // Validación para evitar el error
      if (!action.payload) {
        console.error('❌ LOGIN_SUCCESS: payload es undefined');
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
        console.log('✅ Token guardado en localStorage:', token.substring(0, 20) + '...');
      }
      
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ Usuario guardado en localStorage:', user.email);
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
      console.log('🚪 Token y usuario removidos del localStorage');
      
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
      console.log('🔄 Usuario actualizado en localStorage');
      
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
        console.log('✅ Usuario actualizado desde servidor');
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
  console.log('🔍 AuthProvider renderizado');
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Nueva función: Refrescar datos del usuario desde el servidor
  const refreshUser = async () => {
    const token = state.token || localStorage.getItem('token');
    
    if (!token) {
      console.log('🔒 No token available for refresh');
      return;
    }

    dispatch({ type: 'REFRESH_USER_START' });
    
    try {
      console.log('🔄 Refreshing user data from server...');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/users/me`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado, cerrar sesión
          console.log('🔒 Token expired, logging out');
          dispatch({ type: 'LOGOUT' });
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const userData = await response.json();
      console.log('✅ User data refreshed:', {
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
      console.error('❌ Error refreshing user:', error);
      dispatch({
        type: 'REFRESH_USER_FAILURE',
        payload: error.message
      });
    }
  };

  // Nueva función: Debug del estado del usuario
  const debugUserState = async () => {
    const token = state.token || localStorage.getItem('token');
    
    if (!token) {
      console.log('🐛 Debug: No token available');
      return { error: 'No token available' };
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/users/debug`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const debugData = await response.json();
        console.log('🐛 Debug data from server:', debugData);
        return debugData;
      } else {
        console.error('🐛 Debug request failed:', response.status);
        return { error: `HTTP ${response.status}` };
      }
    } catch (error) {
      console.error('🐛 Debug error:', error);
      return { error: error.message };
    }
  };

  // ⭐ INICIALIZACIÓN MEJORADA
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      console.log('🔍 Inicializando auth...', {
        hasToken: !!token,
        hasStoredUser: !!storedUser,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'No token'
      });
      
      if (token) {
        console.log('🔍 Found stored token, initializing auth...');
        
        // Si hay usuario en localStorage, restaurar estado inmediatamente
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            console.log('✅ Restored user from localStorage:', user.email);
            
            // ⭐ Restaurar estado completo desde localStorage
            dispatch({
              type: 'INIT_FROM_STORAGE',
              payload: { token, user }
            });
            
            // Después, refrescar datos del servidor en background
            setTimeout(async () => {
              try {
                await refreshUser();
              } catch (error) {
                console.error('❌ Error refreshing user in background:', error);
                // Si falla la verificación del token, limpiar todo
                if (error.message.includes('401') || error.message.includes('Token')) {
                  console.log('🔒 Token invalid, logging out');
                  dispatch({ type: 'LOGOUT' });
                }
              }
            }, 100);
            
          } catch (error) {
            console.error('❌ Error parsing stored user:', error);
            // Si hay error parseando, limpiar localStorage y probar con solo token
            localStorage.removeItem('user');
            
            // Intentar verificar token con el servidor
            try {
              const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/users/me`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              );
              
              if (response.ok) {
                const userData = await response.json();
                dispatch({
                  type: 'INIT_FROM_STORAGE',
                  payload: { token, user: userData.data }
                });
              } else {
                throw new Error('Invalid token');
              }
            } catch (verifyError) {
              console.error('❌ Token verification failed:', verifyError);
              localStorage.removeItem('token');
              dispatch({ type: 'INIT_COMPLETE' });
            }
          }
        } else {
          // Si hay token pero no usuario, verificar con servidor
          try {
            console.log('🔄 No stored user, verifying token with server...');
            const response = await fetch(
              `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/users/me`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );
            
            if (response.ok) {
              const userData = await response.json();
              console.log('✅ Token verified, user data received');
              dispatch({
                type: 'INIT_FROM_STORAGE',
                payload: { token, user: userData.data }
              });
            } else {
              throw new Error('Invalid token');
            }
          } catch (error) {
            console.error('❌ Token verification failed:', error);
            localStorage.removeItem('token');
            dispatch({ type: 'INIT_COMPLETE' });
          }
        }
      } else {
        console.log('🔒 No token found in localStorage');
        dispatch({ type: 'INIT_COMPLETE' });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      console.log('🔑 AuthContext: Iniciando login...');
      const response = await authService.login(credentials);
      
      // Verificar que la respuesta no sea undefined o null
      if (!response) {
        throw new Error('La respuesta del servidor es undefined');
      }
      
      console.log('✅ AuthContext: Login exitoso', response);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: response,
      });

      // Después del login exitoso, refrescar datos del usuario
      console.log('🔄 Refreshing user data after login...');
      setTimeout(async () => {
        try {
          await refreshUser();
        } catch (error) {
          console.error('❌ Error refreshing user after login:', error);
        }
      }, 500);
      
      return response;
    } catch (error) {
      console.error('❌ AuthContext: Error en login', error);
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
      console.log('📝 AuthContext: Iniciando registro...');
      const response = await authService.register(userData);
      
      // Verificar que la respuesta no sea undefined
      if (!response) {
        throw new Error('La respuesta del servidor es undefined');
      }
      
      console.log('✅ AuthContext: Registro exitoso', response);
      return response;
    } catch (error) {
      console.error('❌ AuthContext: Error en registro', error);
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
      console.log('🚪 AuthContext: Cerrando sesión...');
      await authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      console.log('✅ AuthContext: Sesión cerrada');
    }
  };

  const updateUser = (userData) => {
    console.log('🔄 Updating user locally:', userData);
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

  console.log('🔍 AuthProvider value:', {
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
  console.log('🔍 useAuth llamado');
  const context = useContext(AuthContext);
  
  if (!context) {
    console.error('❌ useAuth: Context es undefined!');
    console.error('❌ Esto significa que useAuth se está llamando fuera del AuthProvider');
    console.trace('❌ Stack trace:');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};