import React, { useEffect, useState } from 'react';
import {
  Snackbar,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslations } from '../hooks/useTranslations';
import { useAuth } from '../context/AuthContext';
import { serviceService } from '../services/serviceService';
import { contractService } from '../services/contractService';
import ProfilePhotoModal from '../components/ProfilePhotoModal';
import CoverPhotoModal from '../components/CoverPhotoModal';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import { logger } from '../utils/logger';
import '../styles/dashboard.scss';
import '../styles/components/SkeletonLoader.scss';

// ── Icons ────────────────────────────────────────────────────────────────────

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const NotificationsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const AccountCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const WorkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const AssignmentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PaymentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const WallpaperIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

// ── Category icons ────────────────────────────────────────────────────────────

const CATEGORY_ICONS = {
  domesticCleaning: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  plumbing: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  ),
  electricity: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  gardening: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  carpentry: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  construction: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
};

const DefaultCategoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CATEGORY_COLORS = {
  domesticCleaning: 'blue',
  plumbing: 'cyan',
  electricity: 'amber',
  gardening: 'green',
  carpentry: 'orange',
  construction: 'slate',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

const formatDateLong = () =>
  new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

// ── Component ─────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, translateService, translateUserType } = useTranslations();
  const [categories, setCategories] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [coverPhotoModalOpen, setCoverPhotoModalOpen] = useState(false);
  const [showAllContracts, setShowAllContracts] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500));

        const dataPromises = Promise.all([
          serviceService.getCategorias().catch(err => {
            logger.error('Error cargando categorías:', err);
            return [
              { id: 1, nombre: 'domesticCleaning', descripcion: 'Servicio de limpieza' },
              { id: 2, nombre: 'plumbing', descripcion: 'Reparaciones' },
              { id: 3, nombre: 'electricity', descripcion: 'Trabajos eléctricos' },
              { id: 4, nombre: 'gardening', descripcion: 'Mantenimiento' },
              { id: 5, nombre: 'carpentry', descripcion: 'Trabajos en madera' },
              { id: 6, nombre: 'construction', descripcion: 'Obras' },
            ];
          }),
          contractService.getMyContracts().catch(err => {
            logger.error('Error cargando contratos:', err);
            return { status: 'success', data: [] };
          }),
        ]);

        const [results] = await Promise.all([dataPromises, minLoadingTime]);
        const [categoriesData, contractsResponse] = results;

        setCategories(categoriesData);

        if (contractsResponse.status === 'success') {
          setContracts(contractsResponse.data || []);
        } else if (Array.isArray(contractsResponse)) {
          setContracts(contractsResponse);
        } else {
          setContracts([]);
        }
      } catch (err) {
        logger.error('Error general:', err);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    window.scrollTo(0, 0);
    loadDashboardData();
  }, [refreshKey]);

  const handleViewWorkers = (categoryId) => navigate(`/workers?category=${categoryId}`);

  const handleMenuToggle = () => setMenuOpen(v => !v);
  const handleMenuClose = () => setMenuOpen(false);
  const handleLogout = async () => { await logout(); handleMenuClose(); };
  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  const formatDate = (dateString) => {
    try { return new Date(dateString).toLocaleDateString(); }
    catch { return dateString; }
  };

  const renderProfileAvatar = () => {
    if (user?.foto_perfil) {
      return (
        <img
          src={user.foto_perfil}
          alt={`Foto de perfil de ${user.nombre}`}
          className="dashboard__avatar"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      );
    }
    return (
      <div className="dashboard__avatar dashboard__avatar--placeholder" aria-label="Avatar por defecto">
        {user?.nombre?.charAt(0) || '?'}
      </div>
    );
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="dashboard">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="dashboard__header" role="banner">
        <div className="dashboard__header-toolbar">

          <div className="dashboard__header-brand">
            <div className="dashboard__header-logo">C</div>
            <h1 className="dashboard__header-title">Chambing</h1>
          </div>

          <nav className="dashboard__header-actions" role="navigation" aria-label="Navegación principal">
            {(user?.tipo_usuario === 'admin' || user?.tipo_usuario === 'super_admin') && (
              <button
                className="dashboard__icon-btn dashboard__icon-btn--admin"
                onClick={() => navigate('/admin')}
                aria-label="Panel de Administración"
                type="button"
                title="Ir al Panel de Administración"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}

            <button
              className="dashboard__icon-btn"
              onClick={handleRefresh}
              aria-label="Actualizar página"
              type="button"
            >
              <RefreshIcon />
            </button>

            <button
              className="dashboard__icon-btn"
              aria-label="Notificaciones"
              type="button"
            >
              <NotificationsIcon />
            </button>

            <button
              className="dashboard__icon-btn"
              onClick={handleMenuToggle}
              aria-label="Menú de usuario"
              aria-expanded={menuOpen}
              aria-haspopup="true"
              type="button"
            >
              {user?.foto_perfil ? (
                <img
                  src={user.foto_perfil}
                  alt=""
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <AccountCircleIcon />
              )}
            </button>
          </nav>

          {menuOpen && (
            <>
              <div
                className="dashboard__menu-overlay"
                onClick={handleMenuClose}
                aria-hidden="true"
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
              />
              <div className="dashboard__menu" role="menu">
                <button className="dashboard__menu-item" onClick={handleMenuClose} role="menuitem" type="button">
                  <AccountCircleIcon />
                  {t('nav.profile')}
                </button>
                <button className="dashboard__menu-item" onClick={handleLogout} role="menuitem" type="button">
                  <LogoutIcon />
                  {t('nav.logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="dashboard__container">

        {/* ── Greeting banner ─────────────────────────────────────────────── */}
        <div className="dashboard__greeting">
          <div className="dashboard__greeting-text">
            <span className="dashboard__greeting-time">{getGreeting()},</span>
            <strong className="dashboard__greeting-name">
              {user?.nombre?.split(' ')[0] || 'Usuario'}
            </strong>
          </div>
          <span className="dashboard__greeting-date">{formatDateLong()}</span>
        </div>

        {/* ── Profile card ────────────────────────────────────────────────── */}
        <article className="dashboard__profile-card" aria-labelledby="profile-heading">
          <div
            className="dashboard__cover-photo"
            style={{ backgroundImage: user?.foto_portada ? `url(${user.foto_portada})` : undefined }}
            role="img"
            aria-label="Foto de portada del perfil"
          >
            <button
              className="dashboard__cover-photo-btn"
              onClick={() => setCoverPhotoModalOpen(true)}
              aria-label="Cambiar foto de portada"
              type="button"
            >
              <WallpaperIcon />
            </button>
            <div className="dashboard__cover-photo-overlay" aria-hidden="true" />
          </div>

          <div className="dashboard__profile-body">

            {/* Row: avatar + action buttons */}
            <div className="dashboard__profile-top">
              <div className="dashboard__avatar-container">
                {renderProfileAvatar()}
                <button
                  className="dashboard__avatar-btn"
                  onClick={() => setPhotoModalOpen(true)}
                  aria-label="Cambiar foto de perfil"
                  type="button"
                >
                  <CameraIcon />
                </button>
              </div>

              <div className="dashboard__profile-actions">
                <button
                  className="dashboard__action-btn"
                  onClick={() => navigate('/edit-profile')}
                  type="button"
                >
                  <EditIcon />
                  <span>Editar</span>
                </button>

                <button
                  className="dashboard__action-btn dashboard__action-btn--primary"
                  onClick={() => navigate(`/profile/${user?.id}`)}
                  type="button"
                >
                  <EyeIcon />
                  <span>Perfil</span>
                </button>

                {user?.tipo_usuario === 'trabajador' && (
                  <button
                    className="dashboard__action-btn dashboard__action-btn--success"
                    onClick={() => navigate('/availability')}
                    type="button"
                  >
                    <CalendarIcon />
                    <span>Agenda</span>
                  </button>
                )}
              </div>
            </div>

            {/* Identity: name, email, bio */}
            <div className="dashboard__profile-identity">
              <h2 id="profile-heading">
                {t('dashboard.welcome', { name: user?.nombre || 'Usuario' })}
              </h2>
              <p className="dashboard__user-details-email">{user?.email}</p>
              {user?.biografia && (
                <p className="dashboard__user-bio">{user.biografia}</p>
              )}
            </div>

            {/* Chips: horizontal scroll */}
            <div className="dashboard__profile-chips">
              <div className="dashboard__chips" role="list">
                <span className="dashboard__chip dashboard__chip--primary" role="listitem">
                  {t('dashboard.userType', { type: translateUserType(user?.tipo_usuario || 'usuario') })}
                </span>
                {user?.departamento && (
                  <span className="dashboard__chip dashboard__chip--info" role="listitem">
                    {`${user.departamento}, ${user.municipio}`}
                  </span>
                )}
                {user?.telefono && (
                  <span className="dashboard__chip dashboard__chip--secondary" role="listitem">
                    {user.telefono}
                  </span>
                )}
              </div>
            </div>

          </div>
        </article>

        {error && (
          <div className="dashboard__alert dashboard__alert--error" role="alert">
            {error}
          </div>
        )}

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <section className="dashboard__stats" aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="visually-hidden">Estadísticas del Dashboard</h2>

          <article className="dashboard__stat-card dashboard__stat-card--blue">
            <div className="dashboard__stat-card-icon" aria-hidden="true">
              <WorkIcon />
            </div>
            <div className="dashboard__stat-card-content">
              <h3>{categories.length}</h3>
              <p>{t('dashboard.stats.availableServices')}</p>
            </div>
          </article>

          <article className="dashboard__stat-card dashboard__stat-card--green">
            <div className="dashboard__stat-card-icon" aria-hidden="true">
              <AssignmentIcon />
            </div>
            <div className="dashboard__stat-card-content">
              <h3>{contracts.length}</h3>
              <p>{t('dashboard.stats.myContracts')}</p>
            </div>
          </article>

          <article className="dashboard__stat-card dashboard__stat-card--amber">
            <div className="dashboard__stat-card-icon" aria-hidden="true">
              <PaymentIcon />
            </div>
            <div className="dashboard__stat-card-content">
              <h3>$10.00</h3>
              <p>{t('dashboard.stats.availableBalance')}</p>
            </div>
          </article>

          <article className="dashboard__stat-card dashboard__stat-card--indigo">
            <div className="dashboard__stat-card-icon" aria-hidden="true">
              <NotificationsIcon />
            </div>
            <div className="dashboard__stat-card-content">
              <h3>0</h3>
              <p>{t('dashboard.stats.notifications')}</p>
            </div>
          </article>
        </section>

        {/* ── Services ────────────────────────────────────────────────────── */}
        <section className="dashboard__section" aria-labelledby="services-heading">
          <div className="dashboard__section-header">
            <div>
              <h2 id="services-heading">{t('dashboard.availableServices')}</h2>
              <p className="dashboard__section-subtitle">Explora los servicios disponibles en tu área</p>
            </div>
          </div>

          <div className="dashboard__services">
            {categories.map((category) => {
              const CategoryIcon = CATEGORY_ICONS[category.nombre] || DefaultCategoryIcon;
              const color = CATEGORY_COLORS[category.nombre] || 'blue';
              return (
                <article key={category.id} className={`dashboard__service-card dashboard__service-card--${color}`}>
                  <div className="dashboard__service-icon">
                    <CategoryIcon />
                  </div>
                  <h3>{translateService(category.nombre)}</h3>
                  <p>{category.descripcion}</p>
                  <button
                    className="dashboard__service-btn"
                    onClick={() => handleViewWorkers(category.id)}
                    type="button"
                  >
                    {t('dashboard.viewWorkers')}
                    <ArrowRightIcon />
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── Contracts ───────────────────────────────────────────────────── */}
        <section className="dashboard__section" aria-labelledby="contracts-heading">
          <div className="dashboard__section-header">
            <div>
              <h2 id="contracts-heading">{t('dashboard.recentContracts')}</h2>
              <p className="dashboard__section-subtitle">
                {contracts.length} contrato{contracts.length !== 1 ? 's' : ''} en total
              </p>
            </div>
            {contracts.length > 3 && (
              <button
                className="dashboard__btn dashboard__btn--outlined dashboard__btn--sm"
                type="button"
                onClick={() => setShowAllContracts(v => !v)}
              >
                {showAllContracts ? t('dashboard.showLess') : t('dashboard.viewAll')}
              </button>
            )}
          </div>

          {contracts.length > 0 ? (
            <div className="dashboard__contracts">
              {(showAllContracts ? contracts : contracts.slice(0, 3)).map((contract) => (
                <article key={contract.id} className="dashboard__contract-card">
                  <div className="dashboard__contract-header">
                    <div className="dashboard__contract-title-row">
                      <span
                        className={`dashboard__status-dot dashboard__status-dot--${contract.estado}`}
                        aria-hidden="true"
                      />
                      <h3>{t('dashboard.contract.code', { code: contract.codigo_contrato })}</h3>
                    </div>
                    <span className={`dashboard__contract-status dashboard__contract-status--${contract.estado}`}>
                      {contract.estado.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="dashboard__contract-details">
                    <div className="dashboard__contract-row">
                      <span className="dashboard__contract-label">{t('dashboard.contract.category')}</span>
                      <span className="dashboard__contract-value">{contract.categoria?.nombre || 'N/A'}</span>
                    </div>
                    <div className="dashboard__contract-row">
                      <span className="dashboard__contract-label">{t('dashboard.contract.amount')}</span>
                      <span className="dashboard__contract-value dashboard__contract-value--amount">
                        ${contract.monto_total}
                      </span>
                    </div>
                    <div className="dashboard__contract-row">
                      <span className="dashboard__contract-label">Fecha</span>
                      <span className="dashboard__contract-value">{formatDate(contract.fecha_creacion)}</span>
                    </div>

                    {contract.estado === 'en_camino' && (
                      <div className="dashboard__contract-pin">
                        <p>🚶 <strong>El trabajador está en camino</strong></p>
                      </div>
                    )}
                  </div>

                  <div className="dashboard__contract-actions">
                    <button
                      className="dashboard__btn dashboard__btn--text"
                      onClick={() => navigate(`/contracts/${contract.id}`)}
                      type="button"
                    >
                      {t('dashboard.contract.viewDetails')}
                    </button>
                    {(contract.estado === 'confirmado' || contract.estado === 'en_camino') && (
                      <button
                        className="dashboard__btn dashboard__btn--primary dashboard__btn--sm"
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                        type="button"
                      >
                        Ver detalles →
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard__empty-state">
              <div className="dashboard__empty-state-icon" aria-hidden="true">
                <AssignmentIcon />
              </div>
              <h3>{t('dashboard.noContracts.title')}</h3>
              <p>{t('dashboard.noContracts.subtitle')}</p>
              <button
                className="dashboard__btn dashboard__btn--primary"
                onClick={() => navigate('/')}
                type="button"
              >
                {t('dashboard.noContracts.exploreServices')}
              </button>
            </div>
          )}
        </section>

      </main>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <ProfilePhotoModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onPhotoUpdated={(url) => logger.log('Foto actualizada:', url)}
      />

      <CoverPhotoModal
        open={coverPhotoModalOpen}
        onClose={() => setCoverPhotoModalOpen(false)}
        onPhotoUpdated={(url) => logger.log('Foto de portada actualizada:', url)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Dashboard;
