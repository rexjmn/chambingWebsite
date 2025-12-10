import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { theme } from './theme/muiTheme';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Home from './pages/Home';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import EditProfile from './pages/EditProfile';
import PublicProfile from './pages/PublicProfile';
import Services from './pages/Service'; // ✅ NUEVA IMPORTACIÓN
import './styles/globals.scss';

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
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
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
              <Routes>
                {/* Rutas públicas */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
                
                {/* Perfil Público - Sin autenticación requerida */}
                <Route path="/profile/:userId" element={<PublicProfile />} />
                
                {/* ✅ Página de Servicios - Pública */}
                <Route path="/service" element={<Services />} />
                
                {/* Rutas protegidas - Dashboard normal */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                
                {/* Editar Perfil - Solo usuarios autenticados */}
                <Route
                  path="/edit-profile"
                  element={
                    <ProtectedRoute>
                      <EditProfile />
                    </ProtectedRoute>
                  }
                />
                
                {/* Ruta protegida - Dashboard Administrativo */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
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
            </Box>
            
            <Footer />
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;