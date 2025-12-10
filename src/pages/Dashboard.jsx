import React, { useEffect, useState } from 'react';
import { 
  Button, 
  Stack 
} from '@mui/material';
import MuiEditIcon from '@mui/icons-material/Edit'; // ✅ Renombrar para evitar conflicto
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { useTranslations } from '../hooks/useTranslations';
import { useAuth } from '../context/AuthContext';
import { serviceService } from '../services/serviceService';
import { contractService } from '../services/contractService';
import ProfilePhotoModal from '../components/ProfilePhotoModal';
import CoverPhotoModal from '../components/CoverPhotoModal';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import '../styles/dashboard.scss';
import '../styles/components/SkeletonLoader.scss';

// Iconos SVG (mantener los que uses en otras partes)
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
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const WallpaperIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, translateService, translateUserType, common } = useTranslations();
  const [categories, setCategories] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [coverPhotoModalOpen, setCoverPhotoModalOpen] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500));

        const dataPromises = Promise.all([
          serviceService.getCategorias().catch(error => {
            console.error('Error cargando categorías:', error);
            return [
              { id: 1, nombre: 'domesticCleaning', descripcion: 'Servicio de limpieza' },
              { id: 2, nombre: 'plumbing', descripcion: 'Reparaciones' },
              { id: 3, nombre: 'electricity', descripcion: 'Trabajos eléctricos' },
              { id: 4, nombre: 'gardening', descripcion: 'Mantenimiento' },
              { id: 5, nombre: 'carpentry', descripcion: 'Trabajos en madera' },
              { id: 6, nombre: 'construction', descripcion: 'Obras' },
            ];
          }),
          contractService.getMyContracts().catch(error => {
            console.error('Error cargando contratos:', error);
            return { status: 'success', data: [] };
          })
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
      } catch (error) {
        console.error('Error general:', error);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    window.scrollTo(0, 0);
    loadDashboardData();
  }, []);

  const handleViewWorkers = (categoryId) => {
    navigate(`/workers?category=${categoryId}`);
  };

  const handleActivateContract = async (contract) => {
    const pin = prompt(t('dashboard.contract.enterPin', { code: contract.codigo_contrato }));
    if (!pin) return;

    try {
      const response = await contractService.activarContratoConPIN(
        contract.codigo_contrato,
        pin
      );

      if (response.status === 'success') {
        alert(t('dashboard.contract.activated'));
        window.location.reload();
      }
    } catch (error) {
      alert(t('dashboard.contract.activationError') + ': ' + (error.response?.data?.message || error.message));
    }
  };

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const renderProfileAvatar = () => {
    if (user?.foto_perfil) {
      return (
        <img
          src={user.foto_perfil}
          alt={`Foto de perfil de ${user.nombre}`}
          className="dashboard__avatar"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      );
    }

    return (
      <div className="dashboard__avatar dashboard__avatar--placeholder" aria-label="Avatar por defecto">
        {user?.nombre?.charAt(0) || '?'}
      </div>
    );
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="dashboard">
      {/* Header/AppBar */}
      <header className="dashboard__header" role="banner">
        <div className="dashboard__header-toolbar">
          <h1 className="dashboard__header-title">
            {t('nav.dashboard')} - ChambingApp
          </h1>

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
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
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
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999
                }}
              />
              <div className="dashboard__menu" role="menu">
                <button
                  className="dashboard__menu-item"
                  onClick={handleMenuClose}
                  role="menuitem"
                  type="button"
                >
                  <AccountCircleIcon />
                  {t('nav.profile')}
                </button>
                <button
                  className="dashboard__menu-item"
                  onClick={handleLogout}
                  role="menuitem"
                  type="button"
                >
                  <LogoutIcon />
                  {t('nav.logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="dashboard__container">
        {/* Sección de Perfil con Foto de Portada */}
        <article className="dashboard__profile-card" aria-labelledby="profile-heading">
          <div
            className="dashboard__cover-photo"
            style={{
              backgroundImage: user?.foto_portada ? `url(${user.foto_portada})` : undefined
            }}
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
            <div className="dashboard__cover-photo-overlay" aria-hidden="true"></div>
          </div>

          <div className="dashboard__profile-info">
            <div className="dashboard__profile-grid">
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

              
              <div className="dashboard__user-details">
                <h2 id="profile-heading">
                  {t('dashboard.welcome', { name: user?.nombre || 'Usuario' })}
                </h2>
                <p className="dashboard__user-details-email">{user?.email}</p>
                {user?.biografia && (
                  <p className="dashboard__user-bio">{user.biografia}</p>
                )}

                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2} 
                  sx={{ mt: 3 }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<MuiEditIcon />}
                    onClick={() => navigate('/edit-profile')}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 3,
                      py: 1,
                    }}
                  >
                    Editar Perfil
                  </Button>

                  <Button
                    variant="contained"
                    startIcon={<VisibilityIcon />}
                    onClick={() => navigate(`/profile/${user?.id}`)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 3,
                      py: 1,
                      boxShadow: 2,
                      '&:hover': {
                        boxShadow: 4,
                      },
                    }}
                  >
                    Ver Perfil Público
                  </Button>
                </Stack>
              </div>

              <div className="dashboard__user-chips"> 
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
          </div>
        </article>

        {/* Resto del código permanece igual... */}
        {error && (
          <div className="dashboard__alert dashboard__alert--error" role="alert">
            {error}
          </div>
        )}

        <section className="dashboard__stats" aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="visually-hidden">Estadísticas del Dashboard</h2>

          <article className="dashboard__stat-card">
            <div className="dashboard__stat-card-icon" aria-hidden="true">
              <WorkIcon />
            </div>
            <div className="dashboard__stat-card-content">
              <h3>{categories.length}</h3>
              <p>{t('dashboard.stats.availableServices')}</p>
            </div>
          </article>

          <article className="dashboard__stat-card">
            <div className="dashboard__stat-card-icon" aria-hidden="true">
              <AssignmentIcon />
            </div>
            <div className="dashboard__stat-card-content">
              <h3>{contracts.length}</h3>
              <p>{t('dashboard.stats.myContracts')}</p>
            </div>
          </article>

          <article className="dashboard__stat-card">
            <div className="dashboard__stat-card-icon" aria-hidden="true">
              <PaymentIcon />
            </div>
            <div className="dashboard__stat-card-content">
              <h3>$10.00</h3>
              <p>{t('dashboard.stats.availableBalance')}</p>
            </div>
          </article>

          <article className="dashboard__stat-card">
            <div className="dashboard__stat-card-icon" aria-hidden="true">
              <NotificationsIcon />
            </div>
            <div className="dashboard__stat-card-content">
              <h3>0</h3>
              <p>{t('dashboard.stats.notifications')}</p>
            </div>
          </article>
        </section>

        <section className="dashboard__section" aria-labelledby="services-heading">
          <div className="dashboard__section-header">
            <h2 id="services-heading">{t('dashboard.availableServices')}</h2>
          </div>
          <div className="dashboard__services">
            {categories.map((category) => (
              <article key={category.id} className="dashboard__service-card">
                <h3>{translateService(category.nombre)}</h3>
                <p>{category.descripcion}</p>
                <button
                  className="dashboard__btn dashboard__btn--outlined"
                  onClick={() => handleViewWorkers(category.id)}
                  type="button"
                >
                  {t('dashboard.viewWorkers')}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard__section" aria-labelledby="contracts-heading">
          <div className="dashboard__section-header">
            <h2 id="contracts-heading">{t('dashboard.recentContracts')}</h2>
            <button className="dashboard__btn dashboard__btn--outlined" type="button">
              <AssignmentIcon />
              {t('dashboard.viewAll')}
            </button>
          </div>

          {contracts.length > 0 ? (
            <div className="dashboard__contracts">
              {contracts.slice(0, 3).map((contract) => (
                <article key={contract.id} className="dashboard__contract-card">
                  <div className="dashboard__contract-header">
                    <h3>{t('dashboard.contract.code', { code: contract.codigo_contrato })}</h3>
                    <span className={`dashboard__contract-status dashboard__contract-status--${contract.estado}`}>
                      {contract.estado.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="dashboard__contract-details">
                    <p><strong>{t('dashboard.contract.category')}</strong> {contract.categoria?.nombre || 'N/A'}</p>
                    <p><strong>{t('dashboard.contract.amount')}</strong> ${contract.monto_total}</p>
                    <p><strong>{t('dashboard.contract.date', { date: formatDate(contract.fecha_creacion) })}</strong></p>

                    {contract.estado === 'pendiente_activacion' && (
                      <div className="dashboard__contract-pin">
                        <p><strong>{t('dashboard.contract.activationPin')}</strong></p>
                        <code className="dashboard__pin-code">{contract.pin_activacion}</code>
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

                    {contract.estado === 'pendiente_activacion' && (
                      <button
                        className="dashboard__btn dashboard__btn--primary dashboard__btn--sm"
                        onClick={() => handleActivateContract(contract)}
                        type="button"
                      >
                        {t('dashboard.contract.activateContract')}
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

      <ProfilePhotoModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onPhotoUpdated={(newPhotoUrl) => console.log('Foto actualizada:', newPhotoUrl)}
      />

      <CoverPhotoModal
        open={coverPhotoModalOpen}
        onClose={() => setCoverPhotoModalOpen(false)}
        onPhotoUpdated={(newCoverUrl) => console.log('Foto de portada actualizada:', newCoverUrl)}
      />
    </div>
  );
};

export default Dashboard;
