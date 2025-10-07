import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import heroManImage from '../assets/images/heroman.png';
import '../styles/home.scss';

const Home = () => {
  const { t, translateService, common } = useTranslations();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

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
      {/* Hero Section Renovada */}
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
              
              {/* Línea decorativa */}
              <div className="hero-divider"></div>
              
              <Typography
                variant="h5"
                className="hero-subtitle"
              >
                {t('home.hero.subtitle')}
              </Typography>
              
              {/* Botones de Acción */}
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

            {/* Imagen del profesional (sin fondo) */}
            <div className="hero-image-container">
              <img 
                src={heroManImage} 
                alt="Professional worker" 
                className="hero-image"
              />
              {/* Efectos decorativos para la imagen sin fondo */}
              <div className="hero-image-glow"></div>
              <div className="hero-image-glow-rings"></div>
  <div className="hero-energy-particles"></div>
  <div className="hero-extra-particles"></div>
  <div className="hero-light-rays"></div>
  
  {/* Efecto de puntos existente */}
  <div className="hero-image-dots"></div>
              <div className="hero-image-dots"></div>
            </div>
          </div>

          {/* Barra de Búsqueda Fija a lo largo del Hero */}
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
              
              {/* Sugerencias Populares Elegantes */}
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

      {/* Services Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" textAlign="center" gutterBottom>
          {t('home.services.title')}
        </Typography>
        <Typography
          variant="h6"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 6 }}
        >
          {t('home.services.subtitle')}
        </Typography>
        
        <Grid container spacing={4}>
          {categories.map((category) => (
            <Grid key={category.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <CardContent sx={{ textAlign: 'center', pt: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 64,
                      height: 64,
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {getServiceIcon(category.icono)}
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    {translateService(category.nombre)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(`services.descriptions.${category.descripcion}`, category.descripcion)}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                  <Button size="small" variant="outlined">
                    {t('home.services.viewProfessionals')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" gutterBottom>
            {t('home.features.title')}
          </Typography>
          <Grid container spacing={4} sx={{ mt: 4 }}>
            {features.map((feature, index) => (
              <Grid key={index} size={{ xs: 12, md: 4 }}>
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
            <Grid key={index} size={{ xs: 12, md: 4 }}>
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

      {/* Debug Info */}
      <Box sx={{ bgcolor: 'info.light', p: 2, mt: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="subtitle2" gutterBottom>
            🔧 {t('common.debugInfo')}:
          </Typography>
          <Typography variant="caption" component="div">
            • API URL configurada: {import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}<br/>
            • Categorías cargadas: {categories.length}<br/>
            • Backend esperado en: {import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;