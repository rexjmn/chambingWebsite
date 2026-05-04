import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { useAuth } from '../../context/AuthContext';
import { contractService } from '../../services/contractService';
import { logger } from '../../utils/logger';
import LanguageSelector from './LanguageSelector';
import {
  Menu, X, LayoutDashboard, Briefcase, Home,
  User, LogOut, ChevronDown, Bell,
} from 'lucide-react';
import '../../styles/navbar.scss';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { nav } = useTranslations();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [actionableNotifications, setActionableNotifications] = useState([]);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState([]);
  const [notificationActionLoading, setNotificationActionLoading] = useState({});
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);

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
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
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

  useEffect(() => {
    if (!isAuthenticated) {
      setNotificationCount(0);
      setActionableNotifications([]);
      return;
    }

    const getActionBanner = (contract) => {
      const esEmpleador = String(user?.id) === String(contract.empleador?.id);
      const esTrabajador = String(user?.id) === String(contract.trabajador?.id);

      if (contract.estado === 'oferta_pendiente' && esTrabajador) {
        return { message: 'Tienes una oferta pendiente por responder', actionLabel: 'Responder oferta', actionType: 'view' };
      }
      if (contract.estado === 'en_camino' && esEmpleador) {
        return { message: 'El trabajador está en camino', actionLabel: 'Ver código', actionType: 'view' };
      }
      if (contract.estado === 'en_camino' && esTrabajador) {
        return { message: 'Te diriges al servicio: muestra tu código al llegar', actionLabel: 'Ver contrato', actionType: 'view' };
      }
      if (contract.estado === 'activo' && esTrabajador) {
        return { message: 'Contrato activo: marca como completado al finalizar', actionLabel: 'Marcar completado', actionType: 'complete' };
      }
      if (contract.estado === 'completado' && esEmpleador) {
        return { message: 'Contrato completado: falta tu cierre y reseña', actionLabel: 'Cerrar contrato', actionType: 'close' };
      }
      return null;
    };

    const loadNotificationsCount = async () => {
      try {
        const contractsResponse = await contractService.getMyContracts();
        const contracts = contractsResponse?.status === 'success'
          ? (contractsResponse.data || [])
          : (Array.isArray(contractsResponse) ? contractsResponse : []);

        const generatedNotifications = contracts
          .map((contract) => {
            const actionData = getActionBanner(contract);
            if (!actionData) return null;
            return {
              id: `contract-${contract.id}-${contract.estado}`,
              contractId: contract.id,
              contractCode: contract.codigo_contrato || `#${contract.id}`,
              message: actionData.message,
              actionLabel: actionData.actionLabel,
              actionType: actionData.actionType,
              createdAt: contract.fecha_actualizacion || contract.fecha_creacion,
            };
          })
          .filter(Boolean)
          .filter((notification) => !dismissedNotificationIds.includes(notification.id));

        setActionableNotifications(generatedNotifications);
        setNotificationCount(generatedNotifications.length);
      } catch (error) {
        logger.error('Error cargando contador de notificaciones en navbar:', error);
        setNotificationCount(0);
        setActionableNotifications([]);
      }
    };

    loadNotificationsCount();
  }, [isAuthenticated, user?.id, location.pathname, dismissedNotificationIds]);

  const isActive = (path) => location.pathname === path;
  const closeMobile = () => setMobileOpen(false);
  const publicProfilePath = user?.id ? `/profile/${user.id}` : '/perfil';

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
    setNotificationsOpen(false);
    setMobileOpen(false);
  };

  const toggleNotifications = () => {
    setNotificationsOpen((current) => !current);
    setProfileOpen(false);
  };

  const dismissNotification = (notificationId) => {
    setDismissedNotificationIds((prev) => [...prev, notificationId]);
  };

  const openNotificationContract = (contractId) => {
    setNotificationsOpen(false);
    navigate(`/contracts/${contractId}`);
  };

  const runNotificationAction = async (notification) => {
    if (!notification?.actionType) return;
    if (notification.actionType === 'view') {
      openNotificationContract(notification.contractId);
      return;
    }

    try {
      setNotificationActionLoading((prev) => ({ ...prev, [notification.id]: true }));

      if (notification.actionType === 'complete') {
        await contractService.completarContrato(notification.contractId);
      } else if (notification.actionType === 'close') {
        await contractService.cerrarContrato(notification.contractId);
      }

      setDismissedNotificationIds((prev) => [...prev, notification.id]);
      navigate(`/contracts/${notification.contractId}`, {
        state: notification.actionType === 'close' ? { openReview: true } : undefined,
      });
    } catch (error) {
      logger.error('Error ejecutando acción rápida de notificación:', error);
      openNotificationContract(notification.contractId);
    } finally {
      setNotificationActionLoading((prev) => ({ ...prev, [notification.id]: false }));
    }
  };

  const formatNotificationDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('es-SV');
    } catch {
      return '';
    }
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
              {isAuthenticated && (
                <div className="navbar__notifications" ref={notificationsRef}>
                  <button
                    type="button"
                    className={`navbar__icon-btn${notificationsOpen ? ' navbar__icon-btn--active' : ''}`}
                    aria-label={nav.notifications}
                    title={nav.notifications}
                    aria-haspopup="menu"
                    aria-expanded={notificationsOpen}
                    onClick={toggleNotifications}
                  >
                    <Bell size={18} />
                    {notificationCount > 0 && (
                      <span className="navbar__notification-count">
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="navbar__notifications-dropdown" role="menu">
                      <div className="navbar__notifications-header">
                        <p>{nav.notifications}</p>
                        <span>{notificationCount}</span>
                      </div>

                      {actionableNotifications.length > 0 ? (
                        <div className="navbar__notifications-list">
                          {actionableNotifications.slice(0, 6).map((notification) => (
                            <article key={notification.id} className="navbar__notification-item">
                              <button
                                type="button"
                                className="navbar__notification-main"
                                onClick={() => openNotificationContract(notification.contractId)}
                              >
                                <strong>{notification.contractCode}</strong>
                                <p>{notification.message}</p>
                                <small>{formatNotificationDate(notification.createdAt)}</small>
                              </button>
                              <div className="navbar__notification-actions">
                                <button
                                  type="button"
                                  className="navbar__notification-action-btn"
                                  onClick={() => runNotificationAction(notification)}
                                  disabled={Boolean(notificationActionLoading[notification.id])}
                                >
                                  {notificationActionLoading[notification.id] ? 'Procesando...' : notification.actionLabel}
                                </button>
                              </div>
                              <button
                                type="button"
                                className="navbar__notification-dismiss"
                                onClick={() => dismissNotification(notification.id)}
                                aria-label="Descartar notificación"
                                title="Descartar"
                              >
                                ×
                              </button>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className="navbar__notifications-empty">No tienes notificaciones pendientes</p>
                      )}

                      <button
                        type="button"
                        className="navbar__notifications-footer"
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate('/dashboard#notifications');
                        }}
                      >
                        Ver todas en dashboard
                      </button>
                    </div>
                  )}
                </div>
              )}

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
                        to={publicProfilePath}
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
            {isAuthenticated && (
              <button
                type="button"
                className="navbar__icon-btn"
                aria-label={nav.notifications}
                title={nav.notifications}
                onClick={() => {
                  closeMobile();
                  navigate('/dashboard#notifications');
                }}
              >
                <Bell size={18} />
                {notificationCount > 0 && (
                  <span className="navbar__notification-count">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
            )}
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
                to={publicProfilePath}
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
