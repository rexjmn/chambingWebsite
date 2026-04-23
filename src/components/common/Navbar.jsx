import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { useAuth } from '../../context/AuthContext';
import LanguageSelector from './LanguageSelector';
import {
  Menu, X, LayoutDashboard, Briefcase, Home,
  User, LogOut, ChevronDown,
} from 'lucide-react';
import '../../styles/navbar.scss';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { nav } = useTranslations();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isActive = (path) => location.pathname === path;
  const closeMobile = () => setMobileOpen(false);

  const menuItems = [
    { label: nav.home,     path: '/',        icon: <Home size={18} /> },
    { label: nav.services, path: '/service', icon: <Briefcase size={18} /> },
  ];

  const authItems = isAuthenticated
    ? [{ label: nav.dashboard, path: '/dashboard', icon: <LayoutDashboard size={18} /> }]
    : [];

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const UserAvatar = ({ size = 36 }) => (
    <div className="navbar__avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {user?.foto_perfil
        ? <img src={user.foto_perfil} alt={user?.nombre} />
        : <span>{user?.nombre?.charAt(0)}</span>}
    </div>
  );

  return (
    <>
      <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
        <div className="navbar__toolbar">

          {/* Logo */}
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
            <span className="navbar__logo-text" style={{ display: 'none' }}>Chambing</span>
          </Link>

          {/* ── Desktop nav ── */}
          <div className="navbar__desktop">
            <div className="navbar__links">
              {[...menuItems, ...authItems].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`navbar__link${isActive(item.path) ? ' navbar__link--active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="navbar__actions">
              <LanguageSelector variant="icon" size="small" />

              {isAuthenticated ? (
                <div className="navbar__profile" ref={profileRef}>
                  <button
                    className="navbar__user-btn"
                    onClick={() => setProfileOpen((o) => !o)}
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                  >
                    <UserAvatar size={32} />
                    <span className="navbar__user-name">{user?.nombre?.split(' ')[0]}</span>
                    <ChevronDown
                      size={16}
                      className={`navbar__chevron${profileOpen ? ' navbar__chevron--open' : ''}`}
                    />
                  </button>

                  {profileOpen && (
                    <div className="navbar__dropdown" role="menu">
                      <div className="navbar__dropdown-header">
                        <UserAvatar size={40} />
                        <div>
                          <p className="navbar__menu-name">{user?.nombre}</p>
                          <p className="navbar__menu-email">{user?.email}</p>
                        </div>
                      </div>
                      <hr className="navbar__dropdown-divider" />
                      <Link
                        to="/perfil"
                        className="navbar__dropdown-item"
                        onClick={() => setProfileOpen(false)}
                        role="menuitem"
                      >
                        <User size={16} />
                        {nav.profile}
                      </Link>
                      <button
                        className="navbar__dropdown-item navbar__dropdown-item--danger"
                        onClick={handleLogout}
                        role="menuitem"
                      >
                        <LogOut size={16} />
                        {nav.logout}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="navbar__auth">
                  <Link to="/login" className="navbar__login">{nav.login}</Link>
                  <Link to="/register" className="navbar__register">{nav.register}</Link>
                </div>
              )}
            </div>
          </div>

          {/* ── Mobile actions ── */}
          <div className="navbar__mobile-actions">
            <LanguageSelector variant="icon" size="small" />
            <button
              className="navbar__hamburger"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={24} />
            </button>
          </div>

        </div>
      </nav>

      {/* ── Mobile overlay ── */}
      <div
        className={`navbar__overlay${mobileOpen ? ' navbar__overlay--visible' : ''}`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      {/* ── Mobile drawer ── */}
      <div
        className={`navbar__drawer${mobileOpen ? ' navbar__drawer--open' : ''}`}
        aria-hidden={!mobileOpen}
      >
        <div className="navbar__drawer-content">

          <div className="navbar__drawer-header">
            <Link to="/" className="navbar__logo" onClick={closeMobile}>
              <img
                src="/LogoChambing.png"
                alt="Chambing"
                className="navbar__logo-img"
                style={{ height: 48 }}
              />
              <span className="navbar__logo-text" style={{ display: 'none' }}>Chambing</span>
            </Link>
            <button className="navbar__drawer-close" onClick={closeMobile} aria-label="Cerrar menú">
              <X size={22} />
            </button>
          </div>

          <hr className="navbar__drawer-divider" />

          {isAuthenticated && (
            <>
              <div className="navbar__drawer-user">
                <UserAvatar size={48} />
                <div>
                  <p className="navbar__drawer-user-name">{user?.nombre}</p>
                  <p className="navbar__drawer-user-email">{user?.email}</p>
                </div>
              </div>
              <hr className="navbar__drawer-divider" />
            </>
          )}

          <nav className="navbar__drawer-nav">
            {[...menuItems, ...authItems].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobile}
                className={`navbar__link navbar__link--mobile${isActive(item.path) ? ' navbar__link--active' : ''}`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}

            {isAuthenticated && (
              <Link
                to="/perfil"
                onClick={closeMobile}
                className="navbar__link navbar__link--mobile"
              >
                <User size={18} />
                {nav.profile}
              </Link>
            )}
          </nav>

          <div className="navbar__drawer-footer">
            <LanguageSelector variant="button" />

            {isAuthenticated ? (
              <button className="navbar__drawer-logout" onClick={handleLogout}>
                <LogOut size={18} />
                {nav.logout}
              </button>
            ) : (
              <div className="navbar__drawer-auth">
                <Link to="/login" onClick={closeMobile} className="navbar__drawer-login">
                  {nav.login}
                </Link>
                <Link to="/register" onClick={closeMobile} className="navbar__drawer-register">
                  {nav.register}
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default Navbar;
