import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Carrousel from '../components/home/Carrousel';
import { useTranslations } from '../hooks/useTranslations';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  Paper,
  useTheme,
  useMediaQuery,
  Rating,
  TextField,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Home as HomeIcon,
  Build,
  CleaningServices,
  Plumbing,
  ElectricalServices,
  Handyman,
  Star,
  CheckCircle,
  Security,
  Schedule,
  Payment,
  Search,
  LocationOn,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { serviceService } from '../services/serviceService';
import { workerService } from '../services/workerService'; // 👈 AGREGAR
import heroManImage from '../assets/images/heroman.png';
import '../styles/home.scss';

const Home = () => {
  const { t, translateService, common } = useTranslations();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // 🔹 ESTADOS
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredWorkers, setFeaturedWorkers] = useState([]); // 👈 NUEVO
  const [topRatedWorkers, setTopRatedWorkers] = useState([]); // 👈 NUEVO
  const [loadingWorkers, setLoadingWorkers] = useState(true); // 👈 NUEVO

  // 🔄 Cargar categorías
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('🔄 Intentando cargar categorías...');
        const data = await serviceService.getCategories();
        setCategories(data.slice(0, 6));
        console.log('✅ Categorías cargadas:', data.length);
      } catch (error) {
        console.error('❌ Error loading categories:', error);
        console.log('📝 Usando datos mock por error de conexión');
        setCategories([
          { id: 1, nombre: 'domesticCleaning', descripcion: 'domesticCleaning', icono: 'cleaning' },
          { id: 2, nombre: 'plumbing', descripcion: 'plumbing', icono: 'plumbing' },
          { id: 3, nombre: 'electricity', descripcion: 'electricity', icono: 'electrical' },
          { id: 4, nombre: 'carpentry', descripcion: 'carpentry', icono: 'carpenter' },
          { id: 5, nombre: 'gardening', descripcion: 'gardening', icono: 'garden' },
          { id: 6, nombre: 'construction', descripcion: 'construction', icono: 'build' },
        ]);
      }
    };

    loadCategories();
  }, []);

  // 🔄 Cargar trabajadores destacados y mejor valorados
  useEffect(() => {
    const loadWorkers = async () => {
      setLoadingWorkers(true);
      try {
        console.log('🔄 Cargando trabajadores...');

        // Cargar trabajadores destacados
        const featured = await workerService.getFeaturedWorkers(8);
        console.log('✅ Trabajadores destacados:', featured);
        setFeaturedWorkers(featured || []);

        // Cargar mejor valorados
        const topRated = await workerService.getTopRatedWorkers(8);
        console.log('✅ Trabajadores mejor valorados:', topRated);
        setTopRatedWorkers(topRated || []);

      } catch (error) {
        console.error('❌ Error cargando trabajadores:', error);
        
        // 📝 Datos mock en caso de error
        const mockWorkers = generateMockWorkers(6);
        setFeaturedWorkers(mockWorkers);
        setTopRatedWorkers(mockWorkers);
      } finally {
        setLoadingWorkers(false);
      }
    };

    loadWorkers();
  }, []);

  // 🎭 Generar trabajadores mock para desarrollo/fallback
  const generateMockWorkers = (count) => {
    const mockData = [];
    const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Sofia', 'Pedro', 'Carmen'];
    const apellidos = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez'];
    const titulos = ['Electricista', 'Plomero', 'Carpintero', 'Jardinero', 'Pintor', 'Albañil'];
    const departamentos = ['San Salvador', 'La Libertad', 'Santa Ana', 'San Miguel'];
    const municipios = ['San Salvador', 'Santa Tecla', 'Antiguo Cuscatlán', 'Soyapango'];

    for (let i = 0; i < count; i++) {
      mockData.push({
        id: `mock-${i + 1}`,
        nombre: nombres[Math.floor(Math.random() * nombres.length)],
        apellido: apellidos[Math.floor(Math.random() * apellidos.length)],
        titulo_profesional: titulos[Math.floor(Math.random() * titulos.length)],
        foto_perfil: `https://i.pravatar.cc/300?img=${i + 1}`,
        foto_portada: `https://picsum.photos/seed/${i}/800/400`,
        verificado: Math.random() > 0.5,
        biografia: 'Profesional con amplia experiencia en el rubro. Trabajo garantizado y precios competitivos.',
        departamento: departamentos[Math.floor(Math.random() * departamentos.length)],
        municipio: municipios[Math.floor(Math.random() * municipios.length)],
        stats: {
          rating: 4 + Math.random(),
          total_reviews: Math.floor(Math.random() * 100) + 10,
          trabajos_completados: Math.floor(Math.random() * 200) + 20,
        },
        habilidades: ['Reparaciones', 'Instalaciones', 'Mantenimiento'],
        categorias: [{ nombre: titulos[Math.floor(Math.random() * titulos.length)] }],
      });
    }
    return mockData;
  };

  const getServiceIcon = (iconName) => {
    const icons = {
      cleaning: <CleaningServices />,
      plumbing: <Plumbing />,
      electrical: <ElectricalServices />,
      carpenter: <Handyman />,
      garden: <HomeIcon />,
      build: <Build />,
    };
    return icons[iconName] || <Build />;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Características traducidas dinámicamente
  const features = [
    {
      icon: <Security color="primary" />,
      title: t('home.features.verifiedWorkers.title'),
      description: t('home.features.verifiedWorkers.description'),
    },
    {
      icon: <Schedule color="primary" />,
      title: t('home.features.availability.title'),
      description: t('home.features.availability.description'),
    },
    {
      icon: <Payment color="primary" />,
      title: t('home.features.securePayments.title'),
      description: t('home.features.securePayments.description'),
    },
  ];

  // Testimonios traducidos dinámicamente
  const testimonials = [
    {
      name: 'María González',
      rating: 5,
      comment: t('testimonials.maria'),
      service: translateService('domesticCleaning'),
    },
    {
      name: 'Carlos Martínez',
      rating: 5,
      comment: t('testimonials.carlos'),
      service: translateService('plumbing'),
    },
    {
      name: 'Ana Rodríguez',
      rating: 4,
      comment: t('testimonials.ana'),
      service: translateService('gardening'),
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <section className="hero-section">
        <Container maxWidth="xl" className="hero-container">
          <div className="hero-content">
            <div className="hero-positioning">
              <div className="hero-left">
                <Typography
                  variant="h1"
                  component="h1"
                  className="hero-title"
                >
                  {t('home.hero.title')}
                </Typography>
                
                <div className="hero-divider"></div>
                
                <Typography
                  variant="h5"
                  className="hero-subtitle"
                >
                  {t('home.hero.subtitle')}
                </Typography>
                
                <div className="hero-actions">
                  {isAuthenticated ? (
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate('/dashboard')}
                      className="hero-btn hero-btn-primary"
                    >
                      {t('home.hero.dashboard')}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/register')}
                        className="hero-btn hero-btn-primary"
                      >
                        {t('home.hero.startNow')}
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => navigate('/login')}
                        className="hero-btn hero-btn-secondary"
                      >
                        {t('home.hero.login')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="hero-image-container">
              <img 
                src={heroManImage} 
                alt="Professional worker" 
                className="hero-image"
              />
              <div className="hero-image-glow"></div>
              <div className="hero-image-glow-rings"></div>
              <div className="hero-energy-particles"></div>
              <div className="hero-extra-particles"></div>
              <div className="hero-light-rays"></div>
              <div className="hero-image-dots"></div>
            </div>
          </div>

          {/* Barra de Búsqueda */}
          <div className="hero-search-section">
            <div className="hero-search-container">
              <form onSubmit={handleSearch} className="hero-search-form">
                <TextField
                  fullWidth
                  placeholder="¿Qué servicio necesitas? Ej: limpieza, plomería, electricista..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="hero-search-input"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search className="search-icon" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button 
                          type="submit"
                          variant="contained"
                          className="search-btn"
                          disabled={!searchQuery.trim()}
                        >
                          Buscar Ahora
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
              </form>
              
              <div className="popular-searches">
                <div className="popular-searches-header">
                  <Typography variant="caption" className="popular-label">
                    Más solicitados:
                  </Typography>
                  <Typography variant="caption" className="popular-stats">
                    +2,500 servicios completados este mes
                  </Typography>
                </div>
                <div className="popular-tags">
                  <Chip 
                    label="Limpieza Doméstica" 
                    size="medium" 
                    className="popular-tag trending"
                    onClick={() => setSearchQuery('Limpieza doméstica')}
                  />
                  <Chip 
                    label="Plomería 24/7" 
                    size="medium" 
                    className="popular-tag urgent"
                    onClick={() => setSearchQuery('Plomería')}
                  />
                  <Chip 
                    label="Electricista" 
                    size="medium" 
                    className="popular-tag popular"
                    onClick={() => setSearchQuery('Electricista')}
                  />
                  <Chip 
                    label="Jardinería" 
                    size="medium" 
                    className="popular-tag seasonal"
                    onClick={() => setSearchQuery('Jardinería')}
                  />
                  <Chip 
                    label="Carpintería" 
                    size="medium" 
                    className="popular-tag"
                    onClick={() => setSearchQuery('Carpintería')}
                  />
                  <Chip 
                    label="Construcción" 
                    size="medium" 
                    className="popular-tag"
                    onClick={() => setSearchQuery('Construcción')}
                  />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 🎠 CARROUSEL DE DESTACADOS */}
      {loadingWorkers ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
            Cargando profesionales...
          </Typography>
        </Box>
      ) : (
        <>
          {featuredWorkers.length > 0 && (
            <Carrousel 
              workers={featuredWorkers}
              title="Profesionales Destacados"
              subtitle="Los más solicitados de la semana"
            />
          )}

          {topRatedWorkers.length > 0 && (
            <Carrousel 
              workers={topRatedWorkers}
              title="Mejor Valorados"
              subtitle="Calidad garantizada por nuestros usuarios"
            />
          )}
        </>
      )}

      {/* Features Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" gutterBottom>
            {t('home.features.title')}
          </Typography>
          <Grid container spacing={4} sx={{ mt: 4 }}>
            {features.map((feature, index) => (
              <Grid key={index} item xs={12} md={4}>
                <Box textAlign="center">
                  <Avatar
                    sx={{
                      bgcolor: 'primary.light',
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h5" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" textAlign="center" gutterBottom>
          {t('home.testimonials.title')}
        </Typography>
        <Grid container spacing={4} sx={{ mt: 4 }}>
          {testimonials.map((testimonial, index) => (
            <Grid key={index} item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ mr: 2 }}>
                      {testimonial.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{testimonial.name}</Typography>
                      <Chip label={testimonial.service} size="small" />
                    </Box>
                  </Box>
                  <Rating value={testimonial.rating} readOnly sx={{ mb: 2 }} />
                  <Typography variant="body2">"{testimonial.comment}"</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Paper
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" gutterBottom>
            {t('home.cta.title')}
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            {t('home.cta.subtitle')}
          </Typography>
          {!isAuthenticated && (
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              {t('home.cta.createAccount')}
            </Button>
          )}
        </Container>
      </Paper>
    </Box>
  );
};

export default Home;
