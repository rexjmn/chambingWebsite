import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Carrousel from '../components/home/Carrousel';
import { useTranslations } from '../hooks/useTranslations';
import Button from '../components/common/Button';
import SearchInput from '../components/common/SearchInput';
import Chip from '../components/common/Chip';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Paper,
  useTheme,
  useMediaQuery,
  Rating,
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
import '../styles/button.scss';

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
    <div>
      {/* Hero Section - Sin Material-UI */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            {/* Contenido de texto - Izquierda */}
            <div className="hero-positioning">
              <div className="hero-left">
                <h1 className="hero-title">
                  {t('home.hero.title')}
                </h1>

                <div className="hero-divider" />

                <p className="hero-subtitle">
                  {t('home.hero.subtitle')}
                </p>

                <div className="hero-actions">
                  {isAuthenticated ? (
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="custom-btn custom-btn-primary custom-btn-large"
                    >
                      {t('home.hero.dashboard')}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate('/register')}
                        className="custom-btn custom-btn-primary custom-btn-large"
                      >
                        {t('home.hero.startNow')}
                      </button>
                      <button
                        onClick={() => navigate('/login')}
                        className="custom-btn custom-btn-secondary custom-btn-large"
                      >
                        {t('home.hero.login')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Imagen - Derecha */}
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
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={window.innerWidth < 768 ? t('home.search.placeholder') : t('home.search.placeholderLong')}
                onSubmit={handleSearch}
                fullWidth
                className="hero-search-input"
                startIcon={<Search className="search-icon" />}
                endButton={window.innerWidth >= 768 && (
                  <button
                    type="submit"
                    className="custom-btn custom-btn-primary search-btn"
                    disabled={!searchQuery.trim()}
                    onClick={handleSearch}
                  >
                    {t('home.search.searchNow')}
                  </button>
                )}
              />
              {window.innerWidth < 768 && (
                <button
                  type="submit"
                  className="custom-btn custom-btn-primary custom-btn-fullwidth"
                  disabled={!searchQuery.trim()}
                  onClick={handleSearch}
                  style={{ marginTop: '16px' }}
                >
                  {t('home.search.searchNow')}
                </button>
              )}

              <div className="popular-searches">
                <div className="popular-searches-header">
                  <span className="popular-label">
                    {t('home.search.mostRequested')}
                  </span>
                  <span className="popular-stats">
                    {t('home.search.servicesCompleted')}
                  </span>
                </div>
                <div className="popular-tags">
                  {[
                    { labelKey: 'home.search.popularTags.domesticCleaning', variant: 'trending', query: 'Limpieza doméstica' },
                    { labelKey: 'home.search.popularTags.plumbing247', variant: 'urgent', query: 'Plomería' },
                    { labelKey: 'home.search.popularTags.electrician', variant: 'popular', query: 'Electricista' },
                    { labelKey: 'home.search.popularTags.gardening', variant: 'seasonal', query: 'Jardinería' },
                    { labelKey: 'home.search.popularTags.carpentry', variant: 'default', query: 'Carpintería' },
                    { labelKey: 'home.search.popularTags.construction', variant: 'default', query: 'Construcción' }
                  ].map((tag, index) => (
                    <Chip
                      key={index}
                      label={t(tag.labelKey)}
                      size="medium"
                      className="popular-tag"
                      variant={tag.variant}
                      onClick={() => setSearchQuery(tag.query)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More Details Section - Sobre Chambing */}
      <Box className="more-details-section" sx={{ bgcolor: 'grey.50', py: { xs: 6, sm: 7, md: 8 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            {/* Contenido de texto */}
            <Grid item xs={12} lg={7}>
              <Box textAlign={{ xs: 'center', lg: 'left' }}>
                <Typography
                  variant="h3"
                  className="section-title"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem', lg: '2.5rem' },
                    mb: 2
                  }}
                >
                  {t('MoreDetails.moreDetailsTitle')}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.05rem', md: '1.1rem' },
                    lineHeight: 1.7,
                    color: 'text.secondary',
                    maxWidth: { lg: '650px' },
                    mx: { xs: 'auto', lg: 0 }
                  }}
                >
                  {t('MoreDetails.moreDetailsDescription')}
                </Typography>
              </Box>
            </Grid>

            {/* Keywords/Tags para SEO visual */}
            <Grid item xs={12} lg={5}>
              <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
                justifyContent: { xs: 'center', lg: 'flex-start' }
              }}>
                {t('MoreDetails.moreDetailsKeywords').split(', ').slice(0, 8).map((keyword, index) => (
                  <Chip
                    key={index}
                    label={keyword}
                    variant="outlined"
                    sx={{
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      fontSize: { xs: '0.8rem', md: '0.85rem' },
                      fontWeight: 500,
                      '&:hover': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(35, 61, 255, 0.2)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>


      {/* 🎠 CARROUSEL DE DESTACADOS */}
      {loadingWorkers ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
            {t('home.workers.loading')}
          </Typography>
        </Box>
      ) : (
        <>
          {featuredWorkers.length > 0 && (
            <Carrousel
              workers={featuredWorkers}
              title={t('home.workers.featured')}
              subtitle={t('home.workers.featuredSubtitle')}
            />
          )}

          {topRatedWorkers.length > 0 && (
            <Carrousel
              workers={topRatedWorkers}
              title={t('home.workers.topRated')}
              subtitle={t('home.workers.topRatedSubtitle')}
            />
          )}
        </>
      )}

      

      {/* Stats Section - Nueva sección de estadísticas */}
        <Box className="stats-section" sx={{ py: { xs: 6, sm: 8, md: 10 }, bgcolor: 'grey.50' }}>
          <Container maxWidth="lg">
            <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} justifyContent="center">
          {[
            { number: '5,000+', label: t('home.stats.verifiedProfessionals'), icon: <CheckCircle /> },
            { number: '15,000+', label: t('home.stats.completedServices'), icon: <Build /> },
            { number: '4.8/5', label: t('home.stats.averageRating'), icon: <Star /> },
            { number: '98%', label: t('home.stats.satisfiedClients'), icon: <Security /> },
          ].map((stat, index) => (
            <Grid key={index} item xs={12} sm={6} md={3}>
              <Box 
          className="stat-card" 
          sx={{ 
            textAlign: 'center',
            p: { xs: 3, sm: 4, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%'
          }}
              >
            <Box
              sx={{
          fontSize: { xs: '3rem', sm: '3.5rem', md: '4rem' },
          mb: 2,
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
              }}
            >
              {stat.icon}
            </Box>
            <Typography
              variant="h3"
              sx={{
          fontWeight: 800,
          color: 'primary.main',
          mb: 1,
          fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' }
              }}
            >
              {stat.number}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' }, fontWeight: 500 }}
            >
              {stat.label}
            </Typography>
              </Box>
            </Grid>
          ))}
            </Grid>
          </Container>
        </Box>

        {/* Features Section */}}}
      <Box className="features-section" sx={{ bgcolor: 'grey.50', py: { xs: 5, sm: 6, md: 6 } }}>
        <Container maxWidth="lg">
          <Box
            textAlign={{ xs: 'center', lg: 'left' }}
            sx={{ mb: { xs: 4, md: 5 } }}
          >
            <Typography
              variant="h3"
              className="section-title"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem', lg: '2.5rem' },
                mb: 2
              }}
            >
              {t('home.features.title')}
            </Typography>
            <Typography
              variant="h6"
              className="section-subtitle"
              sx={{
                fontSize: { xs: '1rem', sm: '1.05rem', md: '1.1rem' },
                maxWidth: { lg: '600px' }
              }}
            >
              {t('home.features.subtitle')}
            </Typography>
          </Box>
          <Grid container spacing={{ xs: 3, md: 4 }} sx={{ mt: 1 }}>
            {features.map((feature, index) => (
              <Grid key={index} item xs={12} sm={6} md={4}>
                <Box
                  textAlign="center"
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 3,
                    height: '100%',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid',
                    borderColor: 'transparent',
                    bgcolor: 'white',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(35, 61, 255, 0.12)',
                      borderColor: 'primary.light',
                    }
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: 'primary.light',
                      width: { xs: 60, sm: 70, md: 75 },
                      height: { xs: 60, sm: 70, md: 75 },
                      mx: 'auto',
                      mb: 3,
                      boxShadow: '0 8px 24px rgba(35, 61, 255, 0.2)',
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '1.15rem', sm: '1.25rem', md: '1.35rem' }
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' } }}
                  >
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Container maxWidth="lg" className="testimonials-section" sx={{ py: { xs: 5, sm: 6, md: 6 } }}>
        <Box
          textAlign={{ xs: 'center', lg: 'left' }}
          sx={{ mb: { xs: 4, md: 5 } }}
        >
          <Typography
            variant="h3"
            className="section-title"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem', lg: '2.5rem' },
              mb: 2
            }}
          >
            {t('home.testimonials.title')}
          </Typography>
          <Typography
            variant="h6"
            className="section-subtitle"
            sx={{
              fontSize: { xs: '1rem', sm: '1.05rem', md: '1.1rem' },
              maxWidth: { lg: '600px' }
            }}
          >
            {t('home.testimonials.subtitle')}
          </Typography>
        </Box>
        <Grid container spacing={{ xs: 3, md: 4 }} sx={{ mt: 1 }}>
          {testimonials.map((testimonial, index) => (
            <Grid key={index} item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  bgcolor: 'white',
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
                  <Box display="flex" alignItems="center" mb={2.5}>
                    <Avatar
                      sx={{
                        mr: 2,
                        width: { xs: 44, sm: 48, md: 52 },
                        height: { xs: 44, sm: 48, md: 52 },
                        bgcolor: 'primary.main',
                        fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.35rem' },
                        fontWeight: 600
                      }}
                    >
                      {testimonial.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          fontSize: { xs: '1rem', sm: '1.05rem', md: '1.1rem' }
                        }}
                      >
                        {testimonial.name}
                      </Typography>
                      <Chip
                        label={testimonial.service}
                        size="small"
                        className="testimonial-chip"
                        variant="popular"
                      />
                    </Box>
                  </Box>
                  <Rating
                    value={testimonial.rating}
                    readOnly
                    size="small"
                    sx={{ mb: 2 }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                      lineHeight: 1.7,
                      fontStyle: 'italic'
                    }}
                  >
                    "{testimonial.comment}"
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      
      {/* CTA Section */}
      <Box
        className="cta-section"
        sx={{
          background: 'linear-gradient(135deg, #233DFF 0%, #4F63FF 100%)',
          color: 'white',
          py: { xs: 6, sm: 7, md: 8 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h3"
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem', lg: '2.5rem' },
              mb: 2
            }}
          >
            {t('home.cta.title')}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mb: { xs: 4, md: 4 },
              opacity: 0.95,
              fontSize: { xs: '1rem', sm: '1.05rem', md: '1.1rem' },
              fontWeight: 400,
              maxWidth: '650px',
              mx: 'auto',
              px: { xs: 2, sm: 0 }
            }}
          >
            {t('home.cta.subtitle')}
          </Typography>
          {!isAuthenticated && (
            <Box sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
              px: { xs: 2, sm: 0 }
            }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                className="cta-btn-primary"
                sx={{
                  minWidth: { xs: '100%', sm: 'auto' },
                  fontSize: { xs: '1rem', md: '1.05rem' },
                  py: { xs: 1.5, md: 1.75 }
                }}
              >
                {t('home.cta.createAccount')}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                className="cta-btn-secondary"
                sx={{
                  minWidth: { xs: '100%', sm: 'auto' },
                  fontSize: { xs: '1rem', md: '1.05rem' },
                  py: { xs: 1.5, md: 1.75 }
                }}
              >
                {t('home.hero.login')}
              </Button>
            </Box>
          )}
        </Container>
      </Box>
    </div>
  );
};

export default Home;
