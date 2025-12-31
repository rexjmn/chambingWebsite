import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { theme } from './theme/muiTheme';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/globals.scss';

// ✅ Code splitting con React.lazy() - carga páginas solo cuando se necesitan
const Home = lazy(() => import('./pages/Home'));
const LoginForm = lazy(() => import('./components/auth/LoginForm'));
const RegisterForm = lazy(() => import('./components/auth/RegisterForm'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const Services = lazy(() => import('./pages/Service'));
const CreateContract = lazy(() => import('./pages/CreateContract'));
const ContractDetails = lazy(() => import('./pages/ContractDetails'));

// Loading fallback component - optimizado
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh'
    }}
  >
    <CircularProgress size={40} />
  </Box>
);

// Conditional Error Boundary wrapper para mejor performance en dev
const ErrorBoundaryWrapper = import.meta.env.PROD ? ErrorBoundary : React.Fragment;

// Componente para resetear el scroll en cada cambio de ruta
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <ErrorBoundary title="Error en la aplicación" message="Ha ocurrido un error inesperado. Por favor, recarga la página.">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary title="Error de autenticación" message="Hubo un problema con la autenticación. Por favor, recarga la página.">
          <AuthProvider>
            <Router>
              <ScrollToTop />
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh'
              }}>
                <Navbar />

              <Box component="main" sx={{ flexGrow: 1 }}>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                  {/* Rutas públicas */}
                  <Route path="/" element={<ErrorBoundaryWrapper><Home /></ErrorBoundaryWrapper>} />
                  <Route path="/login" element={<ErrorBoundaryWrapper><LoginForm /></ErrorBoundaryWrapper>} />
                  <Route path="/register" element={<ErrorBoundaryWrapper><RegisterForm /></ErrorBoundaryWrapper>} />

                  {/* Perfil Público - Sin autenticación requerida */}
                  <Route path="/profile/:userId" element={<ErrorBoundaryWrapper><PublicProfile /></ErrorBoundaryWrapper>} />

                  {/* ✅ Página de Servicios - Pública */}
                  <Route path="/service" element={<ErrorBoundaryWrapper><Services /></ErrorBoundaryWrapper>} />

                  {/* Rutas protegidas - Dashboard normal */}
                  <Route
                    path="/dashboard"
                    element={
                      <ErrorBoundaryWrapper>
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      </ErrorBoundaryWrapper>
                    }
                  />

                {/* Editar Perfil - Solo usuarios autenticados */}
                <Route
                  path="/edit-profile"
                  element={
                    <ErrorBoundaryWrapper>
                      <ProtectedRoute>
                        <EditProfile />
                      </ProtectedRoute>
                    </ErrorBoundaryWrapper>
                  }
                />

                {/* Crear Contrato - Solo usuarios autenticados */}
                <Route
                  path="/contracts/create"
                  element={
                    <ErrorBoundaryWrapper>
                      <ProtectedRoute>
                        <CreateContract />
                      </ProtectedRoute>
                    </ErrorBoundaryWrapper>
                  }
                />

                {/* Detalles del Contrato - Solo usuarios autenticados */}
                <Route
                  path="/contracts/:contractId"
                  element={
                    <ErrorBoundaryWrapper>
                      <ProtectedRoute>
                        <ContractDetails />
                      </ProtectedRoute>
                    </ErrorBoundaryWrapper>
                  }
                />

                {/* Ruta protegida - Dashboard Administrativo */}
                <Route
                  path="/admin"
                  element={
                    <ErrorBoundaryWrapper>
                      <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    </ErrorBoundaryWrapper>
                  }
                />
                
                {/* Páginas temporales */}
                <Route
                  path="/perfil"
                  element={
                    <ProtectedRoute>
                      <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <h2>Mi Perfil</h2>
                        <p>Página en construcción...</p>
                      </div>
                    </ProtectedRoute>
                  }
                />
                
                {/* Página no encontrada */}
                <Route 
                  path="*" 
                  element={
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      <h2>Página no encontrada</h2>
                      <p>La página que buscas no existe.</p>
                    </div>
                  }
                />
                </Routes>
              </Suspense>
            </Box>
            
              <Footer />
            </Box>
          </Router>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </ErrorBoundary>
  );
}

export default App;