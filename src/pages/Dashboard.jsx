import React, { useEffect, useMemo, useState } from 'react';
import {
  Snackbar,
  Alert
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslations } from '../hooks/useTranslations';
import { useAdmin } from '../hooks/useAdmin';
import { useAuth } from '../context/AuthContext';
import { serviceService } from '../services/serviceService';
import { contractService } from '../services/contractService';
import { workerService } from '../services/workerService';
import ProfilePhotoModal from '../components/ProfilePhotoModal';
import CoverPhotoModal from '../components/CoverPhotoModal';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import { logger } from '../utils/logger';
import '../styles/dashboard.scss';
import '../styles/components/SkeletonLoader.scss';

// ── Icons ────────────────────────────────────────────────────────────────────

const NotificationsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
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

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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

const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const SERVICE_FILTER_CATEGORIES = [
  { id: 'limpieza_domestica', label: 'Limpieza' },
  { id: 'plomeria', label: 'Plomería' },
  { id: 'electricidad', label: 'Electricidad' },
  { id: 'jardineria', label: 'Jardinería' },
  { id: 'carpinteria', label: 'Carpintería' },
  { id: 'construccion', label: 'Construcción' },
  { id: 'pintura', label: 'Pintura' },
  { id: 'mecanica', label: 'Mecánica' },
  { id: 'catering', label: 'Cocina' },
  { id: 'seguridad', label: 'Seguridad' },
];

const CATEGORY_ALIASES = {
  limpieza_domestica: ['limpieza domestica', 'limpieza', 'lavanderia', 'limpieza de oficinas'],
  plomeria: ['plomeria', 'instalacion sanitarios', 'destapes', 'fontaneria'],
  electricidad: ['electricidad', 'instalacion electrica', 'electrico', 'reparacion electrodomesticos'],
  jardineria: ['jardineria', 'jardin', 'paisajismo', 'poda'],
  carpinteria: ['carpinteria', 'muebles', 'ebanisteria'],
  construccion: ['construccion', 'albanileria', 'albanilería', 'obra', 'obras'],
  pintura: ['pintura', 'pintor', 'pintar'],
  mecanica: ['mecanica', 'mecanica automotriz', 'mecánico', 'mecanico'],
  catering: ['cocina', 'catering', 'chef', 'comida'],
  seguridad: ['seguridad', 'vigilancia', 'guardia'],
};

const getWorkerSkillNames = (worker) => {
  const source = worker?.skills || worker?.habilidades || [];
  if (!Array.isArray(source)) return [];
  return source
    .map((skill) => (typeof skill === 'string' ? skill : (skill?.nombre || skill?.name || '')))
    .filter(Boolean)
    .map(normalizeText);
};

// ── Component ─────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t, nav, translateService, translateUserType } = useTranslations();
  const { isAdmin } = useAdmin();
  const [categories, setCategories] = useState([]);
  const [verifiedWorkers, setVerifiedWorkers] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [coverPhotoModalOpen, setCoverPhotoModalOpen] = useState(false);
  const [showAllContracts, setShowAllContracts] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [refreshKey] = useState(0);

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
          workerService.getVerifiedWorkers({ verificado: true }).catch(err => {
            logger.error('Error cargando trabajadores verificados:', err);
            return { status: 'success', data: [] };
          }),
          contractService.getMyContracts().catch(err => {
            logger.error('Error cargando contratos:', err);
            return { status: 'success', data: [] };
          }),
        ]);

        const [results] = await Promise.all([dataPromises, minLoadingTime]);
        const [categoriesData, workersResponse, contractsResponse] = results;

        setCategories(categoriesData);
        setVerifiedWorkers(
          workersResponse?.status === 'success'
            ? (workersResponse.data || [])
            : (Array.isArray(workersResponse) ? workersResponse : [])
        );

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

  useEffect(() => {
    if (location.hash === '#notifications') {
      setNotificationsOpen(true);
    }
  }, [location.hash]);

  const serviceCategories = useMemo(() => {
    const workers = Array.isArray(verifiedWorkers) ? verifiedWorkers : [];

    const result = SERVICE_FILTER_CATEGORIES.map((category) => {
      const aliases = (CATEGORY_ALIASES[category.id] || []).map(normalizeText);
      const workersCount = workers.reduce((acc, worker) => {
        const skills = getWorkerSkillNames(worker);
        const matches = skills.some((skill) =>
          aliases.some((alias) => skill.includes(alias) || alias.includes(skill))
        );
        return acc + (matches ? 1 : 0);
      }, 0);

      return {
        id: category.id,
        nombre: category.label,
        descripcion: `${workersCount} trabajador${workersCount === 1 ? '' : 'es'} disponible${workersCount === 1 ? '' : 's'}`,
        workersCount,
      };
    })
      .filter((category) => category.workersCount > 0)
      .sort((a, b) => b.workersCount - a.workersCount);

    return result.length > 0 ? result : categories;
  }, [verifiedWorkers, categories]);

  const handleViewWorkers = (category) => {
    const categoryId = category?.id || '';
    if (categoryId) {
      navigate(`/service?categoria=${encodeURIComponent(categoryId)}`);
      return;
    }
    const categoryLabel = category?.nombre || '';
    navigate(`/service?search=${encodeURIComponent(categoryLabel)}`);
  };

  const dismissNotification = (notificationId) => {
    setDismissedNotifications(prev => [...prev, notificationId]);
  };

  const formatDate = (dateString) => {
    try { return new Date(dateString).toLocaleDateString(); }
    catch { return dateString; }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-SV', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);

  const monthlyContractsTotal = contracts.reduce((total, contract) => {
    if (!contract?.fecha_creacion) return total;

    const createdAt = new Date(contract.fecha_creacion);
    const now = new Date();
    const isCurrentMonth =
      createdAt.getMonth() === now.getMonth() &&
      createdAt.getFullYear() === now.getFullYear();

    if (!isCurrentMonth) return total;

    const amount = Number(contract.monto_total) || 0;
    return total + amount;
  }, 0);

  const getActionBanner = (contract) => {
    const esEmpleador  = String(user?.id) === String(contract.empleador?.id);
    const esTrabajador = String(user?.id) === String(contract.trabajador?.id);

    if (contract.estado === 'oferta_pendiente' && esTrabajador)
      return { color: '#fff3e0', border: '#f57c00', icon: '⚡', text: 'Tienes una oferta pendiente — responde antes de 72 h' };
    if (contract.estado === 'en_camino' && esEmpleador)
      return { color: '#e8f5e9', border: '#388e3c', icon: '🔑', text: 'El trabajador está en camino — pídele el código al llegar' };
    if (contract.estado === 'en_camino' && esTrabajador)
      return { color: '#e3f2fd', border: '#1976d2', icon: '🚶', text: 'Muestra tu código al cliente cuando llegues' };
    if (contract.estado === 'activo' && esTrabajador)
      return { color: '#f3e5f5', border: '#7b1fa2', icon: '✅', text: 'Trabajo en progreso — marca como completado cuando termines' };
    if (contract.estado === 'completado' && esEmpleador)
      return { color: '#fce4ec', border: '#c62828', icon: '⭐', text: 'El trabajador terminó — confirma y deja tu reseña' };
    return null;
  };

  const dashboardNotifications = useMemo(() => {
    const generated = contracts
      .map((contract) => {
        const banner = getActionBanner(contract);
        if (!banner) return null;
        return {
          id: `contract-${contract.id}-${contract.estado}`,
          contractId: contract.id,
          text: banner.text,
          icon: banner.icon,
          color: banner.color,
          border: banner.border,
          contractCode: contract.codigo_contrato,
          createdAt: contract.fecha_actualizacion || contract.fecha_creacion,
        };
      })
      .filter(Boolean);

    return generated.filter(n => !dismissedNotifications.includes(n.id));
  }, [contracts, dismissedNotifications]);

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

      <main className="dashboard__container">

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

                {isAdmin && (
                  <button
                    className="dashboard__action-btn dashboard__action-btn--admin"
                    onClick={() => navigate('/admin')}
                    type="button"
                  >
                    <ShieldIcon />
                    <span>{nav.adminPanel}</span>
                  </button>
                )}

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
              <h3>{serviceCategories.length}</h3>
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
              <h3>{formatCurrency(monthlyContractsTotal)}</h3>
              <p>Monto contratos del mes</p>
            </div>
          </article>

          <article className="dashboard__stat-card dashboard__stat-card--indigo">
            <div className="dashboard__stat-card-icon" aria-hidden="true">
              <NotificationsIcon />
            </div>
            <div className="dashboard__stat-card-content">
              <h3>{dashboardNotifications.length}</h3>
              <p>{t('dashboard.stats.notifications')}</p>
            </div>
          </article>
        </section>

        {notificationsOpen && (
          <section id="notifications" className="dashboard__section" aria-labelledby="notifications-heading">
            <div className="dashboard__section-header">
              <div>
                <h2 id="notifications-heading">Notificaciones</h2>
                <p className="dashboard__section-subtitle">
                  {dashboardNotifications.length} alerta{dashboardNotifications.length !== 1 ? 's' : ''} activa{dashboardNotifications.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {dashboardNotifications.length > 0 ? (
              <div className="dashboard__contracts">
                {dashboardNotifications.map((notification) => (
                  <article
                    key={notification.id}
                    className="dashboard__contract-card"
                    style={{ border: `2px solid ${notification.border}` }}
                  >
                    <div style={{
                      background: notification.color,
                      borderBottom: `1px solid ${notification.border}`,
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#333',
                      borderRadius: '6px 6px 0 0',
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{notification.icon}</span>
                        {notification.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => dismissNotification(notification.id)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: 16,
                          lineHeight: 1,
                          color: '#444',
                        }}
                        aria-label="Descartar notificación"
                        title="Descartar"
                      >
                        ×
                      </button>
                    </div>

                    <div className="dashboard__contract-details">
                      <div className="dashboard__contract-row">
                        <span className="dashboard__contract-label">Contrato</span>
                        <span className="dashboard__contract-value">{notification.contractCode}</span>
                      </div>
                      <div className="dashboard__contract-row">
                        <span className="dashboard__contract-label">Fecha</span>
                        <span className="dashboard__contract-value">{formatDate(notification.createdAt)}</span>
                      </div>
                    </div>

                    <div className="dashboard__contract-actions">
                      <button
                        className="dashboard__btn dashboard__btn--primary dashboard__btn--sm"
                        onClick={() => navigate(`/contracts/${notification.contractId}`)}
                        type="button"
                      >
                        Ver contrato
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashboard__empty-state">
                <div className="dashboard__empty-state-icon" aria-hidden="true">
                  <NotificationsIcon />
                </div>
                <h3>Sin notificaciones pendientes</h3>
                <p>Cuando haya acciones importantes en tus contratos aparecerán aquí.</p>
              </div>
            )}
          </section>
        )}

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
              {(showAllContracts ? contracts : contracts.slice(0, 3))
                .slice()
                .sort((a, b) => (getActionBanner(b) ? 1 : 0) - (getActionBanner(a) ? 1 : 0))
                .map((contract) => {
                const banner = getActionBanner(contract);
                return (
                <article
                  key={contract.id}
                  className="dashboard__contract-card"
                  style={banner ? { border: `2px solid ${banner.border}` } : undefined}
                >
                  {banner && (
                    <div style={{
                      background: banner.color,
                      borderBottom: `1px solid ${banner.border}`,
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#333',
                      borderRadius: '6px 6px 0 0',
                    }}>
                      <span style={{ fontSize: 16 }}>{banner.icon}</span>
                      {banner.text}
                    </div>
                  )}

                  <div className="dashboard__contract-header">
                    <div className="dashboard__contract-title-row">
                      <span
                        className={`dashboard__status-dot dashboard__status-dot--${contract.estado}`}
                        aria-hidden="true"
                      />
                      <h3>{t('dashboard.contract.code', { code: contract.codigo_contrato })}</h3>
                    </div>
                    <span className={`dashboard__contract-status dashboard__contract-status--${contract.estado}`}>
                      {contract.estado.replace(/_/g, ' ').toUpperCase()}
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
                  </div>

                  <div className="dashboard__contract-actions">
                    <button
                      className="dashboard__btn dashboard__btn--text"
                      onClick={() => navigate(`/contracts/${contract.id}`)}
                      type="button"
                    >
                      {t('dashboard.contract.viewDetails')}
                    </button>
                    {banner && (
                      <button
                        className="dashboard__btn dashboard__btn--primary dashboard__btn--sm"
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                        type="button"
                      >
                        Ir ahora →
                      </button>
                    )}
                  </div>
                </article>
                );
              })}
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

        {/* ── Services ────────────────────────────────────────────────────── */}
        <section className="dashboard__section" aria-labelledby="services-heading">
          <div className="dashboard__section-header">
            <div>
              <h2 id="services-heading">{t('dashboard.availableServices')}</h2>
              <p className="dashboard__section-subtitle">Explora los servicios disponibles en tu área</p>
            </div>
          </div>

          <div className="dashboard__services">
            {serviceCategories.map((category) => {
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
                    onClick={() => handleViewWorkers(category)}
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
