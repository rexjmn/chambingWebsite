import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variable para evitar múltiples redirects
let isRedirecting = false;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔧 API: Token agregado a la petición');
    } else {
      console.log('🔧 API: No hay token disponible');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('✅ API: Respuesta exitosa', response.status);
    return response;
  },
  async (error) => {
    console.log('❌ API: Error en respuesta', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('🔍 API: Detectado error 401 - token inválido o expirado');
      
      // Evitar múltiples redirects simultáneos
      if (isRedirecting) {
        return Promise.reject(error);
      }
      
      // Intentar refrescar el token antes de hacer logout
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken && !error.config._retry) {
        console.log('🔄 API: Intentando refrescar token...');
        error.config._retry = true;
        
        try {
          // Usar una instancia separada para evitar interceptor recursivo
          const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: refreshToken  // ✅ Backend espera 'refreshToken'
          });
          
          const newToken = refreshResponse.data.accessToken;  // ✅ Backend retorna 'accessToken'
          localStorage.setItem('token', newToken);
          
          // Reintentar la petición original con el nuevo token
          error.config.headers.Authorization = `Bearer ${newToken}`;
          console.log('✅ API: Token refrescado, reintentando petición...');
          return api.request(error.config);
          
        } catch (refreshError) {
          console.log('❌ API: Error al refrescar token, haciendo logout...');
          // Si el refresh falla, entonces sí hacer logout
          handleLogout();
        }
      } else {
        console.log('❌ API: No hay refresh token o ya se intentó, haciendo logout...');
        handleLogout();
      }
    }
    
    return Promise.reject(error);
  }
);

// Función separada para manejar logout
function handleLogout() {
  if (isRedirecting) return;
  
  isRedirecting = true;
  console.log('🚪 API: Ejecutando logout automático...');
  
  // Limpiar localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  
  // Redirigir después de un pequeño delay para evitar problemas de race condition
  setTimeout(() => {
    window.location.href = '/login';
    isRedirecting = false;
  }, 100);
}

export default api;