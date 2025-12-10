import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Fade,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Dashboard,
  Work,
  Home as HomeIcon,
  Person,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import LanguageSelector from './LanguageSelector';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { nav } = useTranslations();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Menús con traducciones e iconos
  const menuItems = [
    { label: nav.home, path: '/', icon: <HomeIcon /> },
    { label: nav.services, path: '/service', icon: <Work /> },
  ];

  const authMenuItems = isAuthenticated
    ? [
        { label: nav.dashboard, path: '/dashboard', icon: <Dashboard /> },
        { label: nav.profile, path: '/perfil', icon: <Person /> },
      ]
    : [
        { label: nav.login, path: '/login', icon: null },
        { label: nav.register, path: '/register', icon: null },
      ];

  // Logo mejorado con mejor tamaño y centrado
  const ChambingLogo = ({ size = 'normal' }) => (
    <Box
      component={Link}
      to="/"
      className="chambing-brand-container"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        textDecoration: 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'scale(1.03)',
        },
      }}
    >
      <Box
        component="img"
        src="/LogoChambing.png"
        alt="ChambingApp Logo"
        className="chambing-brand-logo"
        sx={{
          height: {
            xs: size === 'small' ? 48 : 56, // Móvil más grande
            sm: size === 'small' ? 52 : 64, // Tablet
            md: size === 'small' ? 56 : 72, // Desktop
          },
          width: 'auto',
          maxWidth: '200px',
          objectFit: 'contain',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
          '&:hover': {
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15)) brightness(1.05)',
          },
        }}
        onError={(e) => {
          // Fallback elegante si no carga la imagen
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'block';
        }}
      />
      {/* Fallback text mejorado */}
      <Typography
        variant="h5"
        className="chambing-brand-text-fallback"
        sx={{
          display: 'none',
          fontWeight: 700,
          color: 'text.primary',
          letterSpacing: '0.5px',
          fontFamily: '"Inter", "Roboto", sans-serif',
        }}
      >
        Chambing
      </Typography>
    </Box>
  );

  const MobileNavigationDrawer = () => (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={handleMobileMenuToggle}
      className="chambing-mobile-drawer"
      PaperProps={{
        sx: {
          width: 300,
          backgroundColor: '#ffffff !important',
          color: '#1a1a1a !important',
          colorScheme: 'light',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          borderRadius: '0 16px 16px 0',
        }
      }}
    >
      <Box sx={{ pt: 4, pb: 2 }}>
        {/* Logo en el drawer móvil - más grande */}
        <Box 
          className="chambing-mobile-brand-section"
          sx={{ 
            px: 3, 
            pb: 3, 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80px'
          }}
        >
          <ChambingLogo size="small" />
        </Box>
        
        <Divider sx={{ opacity: 0.1 }} />
        
        <List sx={{ pt: 2, px: 2 }}>
          {[...menuItems, ...authMenuItems].map((item, index) => (
            <ListItem
              button
              key={index}
              component={Link}
              to={item.path}
              onClick={handleMobileMenuToggle}
              className="chambing-mobile-nav-item"
              sx={{
                borderRadius: 3,
                mb: 1,
                py: 1.5,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  transform: 'translateX(6px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              {item.icon && (
                <Box
                  className="chambing-mobile-nav-icon"
                  sx={{
                    mr: 2.5,
                    color: '#64748b !important',
                    minWidth: 28,
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                >
                  {item.icon}
                </Box>
              )}
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: '#1a1a1a'
                }}
              />
            </ListItem>
          ))}
          
          {isAuthenticated && (
            <>
              <Divider sx={{ my: 3, opacity: 0.1 }} />
              <ListItem
                button
                onClick={handleLogout}
                className="chambing-mobile-logout-item"
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.08)',
                    transform: 'translateX(6px)',
                    boxShadow: '0 2px 8px rgba(244, 67, 54, 0.2)',
                  },
                }}
              >
                <Box
                  className="chambing-mobile-logout-icon"
                  sx={{
                    mr: 2.5,
                    color: '#ef4444 !important',
                    minWidth: 28,
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                >
                  <Logout />
                </Box>
                <ListItemText
                  primary={nav.logout}
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: '#ef4444'
                  }}
                />
              </ListItem>
            </>
          )}
        </List>
        
        <Box sx={{ px: 3, pt: 3 }}>
          <LanguageSelector variant="button" />
        </Box>
      </Box>
    </Drawer>
  );

  // Avatar mejorado con mejores efectos
  const UserProfileAvatar = ({ size = 40 }) => {
    if (user?.foto_perfil) {
      return (
        <Avatar 
          src={user.foto_perfil} 
          alt={user.nombre}
          className="chambing-user-avatar-image"
          sx={{ 
            width: size, 
            height: size,
            border: '2px solid rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'scale(1.08)',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
              borderColor: 'primary.main',
            }
          }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      );
    }
    
    return (
      <Avatar 
        className="chambing-user-avatar-default"
        sx={{ 
          width: size, 
          height: size,
          bgcolor: 'grey.700',
          border: '2px solid rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.08)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
            borderColor: 'primary.main',
          }
        }}
      >
        {user?.nombre?.charAt(0) || <AccountCircle />}
      </Avatar>
    );
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        className="chambing-main-appbar"
        sx={{
          backgroundColor: '#ffffff !important',
          color: '#1a1a1a !important',
          colorScheme: 'light',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Toolbar 
          className="chambing-main-toolbar"
          sx={{ 
            minHeight: { xs: 72, sm: 80, md: 100 }, // Toolbar más alto para acomodar logo más grande
            px: { xs: 2, sm: 3, md: 4 },
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          {isMobile && (
            <IconButton
              edge="start"
              onClick={handleMobileMenuToggle}
              className="chambing-mobile-menu-trigger"
              sx={{
                mr: 2,
                color: '#1a1a1a !important',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* Logo principal con mejor posicionamiento */}
          <Box 
            className="chambing-brand-section"
            sx={{ 
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'center' : 'flex-start',
              minHeight: '80px'
            }}
          >
            <ChambingLogo />
          </Box>

          {!isMobile && (
            <Box 
              className="chambing-desktop-nav-section"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              {/* Menú principal */}
              {menuItems.map((item, index) => (
                <Button
                  key={index}
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  className="chambing-nav-button"
                  sx={{
                    color: '#1a1a1a !important',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    px: 3,
                    py: 1.5,
                    borderRadius: 3,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    },
                    '& .MuiButton-startIcon': {
                      color: '#1a1a1a !important',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
              
              {isAuthenticated ? (
                <>
                  <Button
                    component={Link}
                    to="/dashboard"
                    startIcon={<Dashboard />}
                    className="chambing-dashboard-button"
                    sx={{
                      color: '#1a1a1a !important',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      px: 3,
                      py: 1.5,
                      borderRadius: 3,
                      ml: 1,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      },
                      '& .MuiButton-startIcon': {
                        color: '#1a1a1a !important',
                      },
                    }}
                  >
                    {nav.dashboard}
                  </Button>
                  
                  <Box sx={{ mx: 2 }}>
                    <LanguageSelector variant="icon" size="medium" />
                  </Box>
                  
                  <IconButton 
                    onClick={handleMenuOpen}
                    className="chambing-profile-trigger"
                    sx={{ ml: 1 }}
                  >
                    <UserProfileAvatar size={40} />
                  </IconButton>
                </>
              ) : (
                <>
                  <Box sx={{ mx: 2 }}>
                    <LanguageSelector variant="icon" size="medium" />
                  </Box>
                  
                  <Button
                    component={Link}
                    to="/login"
                    className="chambing-login-button"
                    sx={{
                      color: '#1a1a1a !important',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      px: 3,
                      py: 1.5,
                      borderRadius: 3,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      },
                    }}
                  >
                    {nav.login}
                  </Button>
                  
                  <Button
                    variant="contained"
                    component={Link}
                    to="/register"
                    className="chambing-register-button"
                    sx={{
                      ml: 2,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      backgroundColor: '#1a1a1a !important',
                      color: '#ffffff !important',
                      boxShadow: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: '#64748b !important',
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    {nav.register}
                  </Button>
                </>
              )}
            </Box>
          )}
          
          {/* Selector de idioma para móvil solo si no está autenticado */}
          {isMobile && !isAuthenticated && (
            <LanguageSelector variant="icon" size="small" />
          )}
        </Toolbar>
      </AppBar>

      {/* Menú de perfil mejorado */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        TransitionComponent={Fade}
        className="chambing-profile-dropdown"
        PaperProps={{
          elevation: 12,
          sx: {
            mt: 1.5,
            minWidth: 260,
            borderRadius: 4,
            backgroundColor: '#ffffff !important',
            color: '#1a1a1a !important',
            colorScheme: 'light',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
            '& .MuiMenuItem-root': {
              borderRadius: 3,
              margin: '4px 16px',
              fontWeight: 600,
              fontSize: '0.95rem',
              color: '#1a1a1a !important',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                transform: 'translateX(4px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              },
            },
          },
        }}
      >
        {/* Header del menú con info del usuario */}
        {user && (
          <Box
            className="chambing-profile-header"
            sx={{
              px: 4,
              py: 3,
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
              backgroundColor: 'rgba(0, 0, 0, 0.02)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <UserProfileAvatar size={48} />
              <Box>
                <Typography
                  variant="subtitle1"
                  className="chambing-profile-name"
                  sx={{
                    fontWeight: 700,
                    color: '#1a1a1a !important',
                    mb: 0.5,
                    fontSize: '1.1rem'
                  }}
                >
                  {user.nombre}
                </Typography>
                <Typography
                  variant="caption"
                  className="chambing-profile-email"
                  sx={{
                    color: '#64748b !important',
                    fontSize: '0.8rem'
                  }}
                >
                  {user.email}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
        
        <MenuItem
          component={Link}
          to="/perfil"
          onClick={handleMenuClose}
          className="chambing-profile-menu-item"
          sx={{ mt: 1 }}
        >
          <Person sx={{
            fontSize: '1.3em',
            mr: 2,
            color: '#64748b !important'
          }} />
          {nav.profile}
        </MenuItem>

        <MenuItem
          onClick={handleLogout}
          className="chambing-logout-menu-item"
          sx={{ color: '#ef4444 !important' }}
        >
          <Logout sx={{ fontSize: '1.3em', mr: 2, color: '#ef4444 !important' }} />
          {nav.logout}
        </MenuItem>
      </Menu>

      <MobileNavigationDrawer />
    </>
  );
};

export default Navbar;