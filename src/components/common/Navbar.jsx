import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  useMediaQuery,
  Drawer,
  Divider,
  Typography,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Dashboard,
  Work,
  Home as HomeIcon,
  Person,
  Logout,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import LanguageSelector from './LanguageSelector';
import '../../styles/navbar.scss';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { nav } = useTranslations();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { label: nav.home, path: '/', icon: <HomeIcon /> },
    { label: nav.services, path: '/service', icon: <Work /> },
  ];

  const authItems = isAuthenticated
    ? [{ label: nav.dashboard, path: '/dashboard', icon: <Dashboard /> }]
    : [];

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleMobileToggle = () => setMobileOpen(!mobileOpen);

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
    setMobileOpen(false);
  };

  // Logo Component
  const Logo = () => (
    <Link to="/" className="navbar__logo">
      <img
        src="/LogoChambing.png"
        alt="Chambing"
        className="navbar__logo-img"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'block';
        }}
      />
      <span className="navbar__logo-text" style={{ display: 'none' }}>
        Chambing
      </span>
    </Link>
  );

  // Navigation Link
  const NavLink = ({ item, mobile = false }) => (
    <Button
      component={Link}
      to={item.path}
      onClick={mobile ? handleMobileToggle : undefined}
      className={`navbar__link ${isActive(item.path) ? 'navbar__link--active' : ''} ${mobile ? 'navbar__link--mobile' : ''}`}
      startIcon={mobile ? item.icon : null}
    >
      {item.label}
    </Button>
  );

  // User Avatar
  const UserAvatar = ({ size = 36 }) => (
    <Avatar
      src={user?.foto_perfil}
      alt={user?.nombre}
      className="navbar__avatar"
      sx={{ width: size, height: size }}
    >
      {user?.nombre?.charAt(0)}
    </Avatar>
  );

  // Desktop Navigation
  const DesktopNav = () => (
    <Box className="navbar__desktop">
      <Box className="navbar__links">
        {[...menuItems, ...authItems].map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
      </Box>

      <Box className="navbar__actions">
        <LanguageSelector variant="icon" size="small" />

        {isAuthenticated ? (
          <Button
            onClick={handleMenuOpen}
            className="navbar__user-btn"
            endIcon={<KeyboardArrowDown />}
          >
            <UserAvatar size={32} />
            <span className="navbar__user-name">{user?.nombre?.split(' ')[0]}</span>
          </Button>
        ) : (
          <Box className="navbar__auth">
            <Button component={Link} to="/login" className="navbar__login">
              {nav.login}
            </Button>
            <Button component={Link} to="/register" className="navbar__register">
              {nav.register}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );

  // Mobile Drawer
  const MobileDrawer = () => (
    <Drawer
      anchor="right"
      open={mobileOpen}
      onClose={handleMobileToggle}
      className="navbar__drawer"
      PaperProps={{ className: 'navbar__drawer-paper' }}
    >
      <Box className="navbar__drawer-content">
        {/* Header */}
        <Box className="navbar__drawer-header">
          <Logo />
          <IconButton onClick={handleMobileToggle} className="navbar__drawer-close">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider className="navbar__drawer-divider" />

        {/* User Info */}
        {isAuthenticated && (
          <>
            <Box className="navbar__drawer-user">
              <UserAvatar size={48} />
              <Box>
                <Typography className="navbar__drawer-user-name">
                  {user?.nombre}
                </Typography>
                <Typography className="navbar__drawer-user-email">
                  {user?.email}
                </Typography>
              </Box>
            </Box>
            <Divider className="navbar__drawer-divider" />
          </>
        )}

        {/* Navigation */}
        <Box className="navbar__drawer-nav">
          {[...menuItems, ...authItems].map((item) => (
            <NavLink key={item.path} item={item} mobile />
          ))}

          {isAuthenticated && (
            <Button
              component={Link}
              to="/perfil"
              onClick={handleMobileToggle}
              className="navbar__link navbar__link--mobile"
              startIcon={<Person />}
            >
              {nav.profile}
            </Button>
          )}
        </Box>

        {/* Footer */}
        <Box className="navbar__drawer-footer">
          <LanguageSelector variant="button" />

          {isAuthenticated ? (
            <Button
              onClick={handleLogout}
              className="navbar__drawer-logout"
              startIcon={<Logout />}
            >
              {nav.logout}
            </Button>
          ) : (
            <Box className="navbar__drawer-auth">
              <Button
                component={Link}
                to="/login"
                onClick={handleMobileToggle}
                className="navbar__drawer-login"
              >
                {nav.login}
              </Button>
              <Button
                component={Link}
                to="/register"
                onClick={handleMobileToggle}
                className="navbar__drawer-register"
              >
                {nav.register}
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );

  // Profile Dropdown Menu
  const ProfileMenu = () => (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
      className="navbar__menu"
      slotProps={{ paper: { className: 'navbar__menu-paper' } }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Box className="navbar__menu-header">
        <UserAvatar size={40} />
        <Box>
          <Typography className="navbar__menu-name">{user?.nombre}</Typography>
          <Typography className="navbar__menu-email">{user?.email}</Typography>
        </Box>
      </Box>

      <Divider className="navbar__menu-divider" />

      <MenuItem
        component={Link}
        to="/perfil"
        onClick={handleMenuClose}
        className="navbar__menu-item"
      >
        <Person className="navbar__menu-icon" />
        {nav.profile}
      </MenuItem>

      <MenuItem onClick={handleLogout} className="navbar__menu-item navbar__menu-item--danger">
        <Logout className="navbar__menu-icon" />
        {nav.logout}
      </MenuItem>
    </Menu>
  );

  return (
    <>
      <AppBar position="sticky" elevation={0} className="navbar">
        <Toolbar className="navbar__toolbar">
          <Logo />

          {isMobile ? (
            <Box className="navbar__mobile-actions">
              <LanguageSelector variant="icon" size="small" />
              <IconButton onClick={handleMobileToggle} className="navbar__hamburger">
                <MenuIcon />
              </IconButton>
            </Box>
          ) : (
            <DesktopNav />
          )}
        </Toolbar>
      </AppBar>

      <MobileDrawer />
      {isAuthenticated && <ProfileMenu />}
    </>
  );
};

export default Navbar;
