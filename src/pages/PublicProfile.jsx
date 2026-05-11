import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useLoaderData } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { publicProfileService } from '../services/publicProfileService';
import { serviceService } from '../services/serviceService';
import { logger } from '../utils/logger';
import AvailabilityCalendar from '../components/calendar/AvailabilityCalendar';
import '../styles/Public-profile.scss';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WorkIcon from '@mui/icons-material/Work';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import InfoIcon from '@mui/icons-material/Info';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import StarHalfIcon from '@mui/icons-material/StarHalf';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DateRangeIcon from '@mui/icons-material/DateRange';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CloseIcon from '@mui/icons-material/Close';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import AssignmentIcon from '@mui/icons-material/Assignment';

const PublicProfile = () => {
  const { t, i18n } = useTranslation();
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();

  // loaderData viene del servidor en SSR; undefined en CSR puro
  const loaderData = useLoaderData();

  const [user, setUser] = useState(loaderData?.profile || null);
  const [skills, setSkills] = useState(loaderData?.profile?.habilidades || []);
  const [reviews, setReviews] = useState(loaderData?.reviews || []);
  const [stats, setStats] = useState(null);
  const [tarifas, setTarifas] = useState(loaderData?.profile?.tarifas || null);
  const [loading, setLoading] = useState(!loaderData?.profile);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        const profileResponse = await publicProfileService.getPublicProfile(userId);

        if (profileResponse.status === 'success') {
          const userData = profileResponse.data;
          setUser(userData);

          // Las habilidades ya vienen en el perfil público
          if (userData.habilidades && userData.habilidades.length > 0) {
            setSkills(userData.habilidades);
          }

          // Cargar reviews y stats para todos los usuarios
          const [reviewsRes, statsRes] = await Promise.allSettled([
            publicProfileService.getUserReviews(userId),
            publicProfileService.getUserStats(userId),
          ]);

          if (reviewsRes.status === 'fulfilled') {
            setReviews(reviewsRes.value.data || []);
          }

          if (statsRes.status === 'fulfilled') {
            setStats(statsRes.value.data || {
              trabajos_completados: 0,
              rating: 0,
              total_reviews: 0,
            });
          }

          // Tarifas: solo para trabajadores
          if (userData.tipo_usuario === 'trabajador') {
            const tarifasRes = await Promise.allSettled([serviceService.getTarifasByWorker(userId)]);
            const tr = tarifasRes[0];
            if (tr.status === 'fulfilled' && tr.value) {
              setTarifas(tr.value);
            } else if (userData.tarifas) {
              setTarifas(userData.tarifas);
            }
          }
        }
      } catch (err) {
        logger.error('Error fetching user profile:', err);
        setError(err.message || 'Error al cargar el perfil');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    } else {
      setError('ID de usuario no válido');
      setLoading(false);
    }
  }, [userId]);

  const renderStars = (rating) => {
    const safeRating = Number.isFinite(Number(rating)) ? Number(rating) : 0;
    const boundedRating = Math.min(5, Math.max(0, safeRating));
    // Redondeo visual al 0.5 más cercano: 4.8 -> 5 estrellas, 4.2 -> 4 estrellas.
    const roundedRating = Math.round(boundedRating * 2) / 2;
    const fullStars = Math.floor(roundedRating);
    const hasHalfStar = roundedRating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <>
        {Array.from({ length: fullStars }).map((_, i) => (
          <StarIcon key={`full-${i}`} className="star filled" />
        ))}
        {hasHalfStar && <StarHalfIcon key="half" className="star filled" />}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <StarOutlineIcon key={`empty-${i}`} className="star empty" />
        ))}
      </>
    );
  };

  const getRateLabel = (customLabel, fallbackLabel) => {
    const trimmed = (customLabel || '').trim();
    return trimmed || fallbackLabel;
  };

  const handleHire = () => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: `/profile/${userId}` } });
      return;
    }

    // Navigate to contract creation page with worker ID
    navigate(`/contracts/create?workerId=${userId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatMemberSince = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  // Estados de carga y error
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">
          <HourglassEmptyIcon sx={{ fontSize: 40, marginRight: 1 }} />
          {t('publicProfile.loading') || 'Cargando...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="not-found">
        <InfoIcon sx={{ fontSize: 60, color: 'primary.main', marginBottom: 2 }} />
        <h1>{t('publicProfile.notFound') || 'Perfil no encontrado'}</h1>
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="contact-button">
          <CloseIcon sx={{ marginRight: 1 }} />
          {t('common.back') || 'Volver'}
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="not-found">
        <InfoIcon sx={{ fontSize: 60, color: 'primary.main', marginBottom: 2 }} />
        <h1>{t('publicProfile.notFound') || 'Perfil no encontrado'}</h1>
        <button onClick={() => navigate('/')} className="contact-button">
          <CloseIcon sx={{ marginRight: 1 }} />
          {t('common.back') || 'Volver'}
        </button>
      </div>
    );
  }

  // Determinar si mostrar estadísticas (solo para trabajadores)
  const isTrabajador = user.tipo_usuario === 'trabajador';
  const isVerified = user.verificado === true;
  const displayRating = stats?.rating || 0;
  const displayReviewCount = stats?.total_reviews || reviews.length || 0;
  const displayJobsCompleted = stats?.trabajos_completados || 0;
  const isOwnProfile = isAuthenticated && currentUser?.id && String(currentUser.id) === String(user?.id || userId);

  return (
    <div className="public-profile">
      {/* Foto de Portada */}
      <div
        className={`cover-photo ${!user.foto_portada ? 'default-cover' : ''}`}
        style={user.foto_portada ? { backgroundImage: `url(${user.foto_portada})` } : {}}
      >
        <div className="overlay" />
      </div>

      {/* Contenido Principal */}
      <div className="profile-content">
        {/* Tarjeta de Información Principal */}
        <div className="main-card">
          <div className="card-inner">
            {/* Foto de Perfil */}
            <div className="profile-photo">
              <img
                src={user.foto_perfil || 'https://via.placeholder.com/150'}
                alt={`${user.nombre} ${user.apellido}`}
              />
              {/* Badge de Verificación para Trabajadores */}
              {isTrabajador && isVerified && (
                <div className="verified-badge" title={t('publicProfile.verifiedWorker') || 'Trabajador Verificado'}>
                  <VerifiedUserIcon />
                </div>
              )}
            </div>

            {/* Información Básica */}
            <div className="basic-info">
              <div className="name-container">
                <h1 className="name">
                  {user.nombre} {user.apellido}
                </h1>

                {/* Título Profesional */}
                {isTrabajador && user.titulo_profesional && (
                  <div className="professional-title">
                    <WorkOutlineIcon className="title-icon" />
                    {user.titulo_profesional}
                  </div>
                )}

                <div className="meta-badges">
                  {/* Badge de Tipo de Usuario */}
                  <span className={`user-type-badge ${isTrabajador ? 'worker' : 'client'}`}>
                    {isTrabajador ? <WorkIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
                    {isTrabajador ? t('publicProfile.worker') || 'Trabajador' : t('publicProfile.client') || 'Cliente'}
                  </span>

                  {/* Estado de Verificación */}
                  {isTrabajador && (
                    <span className={`verification-status ${isVerified ? 'verified' : 'pending'}`}>
                      {isVerified ? (
                        <>
                          <VerifiedUserIcon fontSize="small" />
                          {t('publicProfile.verified') || 'Verificado'}
                        </>
                      ) : (
                        <>
                          <HourglassEmptyIcon fontSize="small" />
                          {t('publicProfile.verificationPending') || 'Pendiente de Verificación'}
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Rating y Estadísticas - Para cualquier usuario con reseñas */}
              {(displayReviewCount > 0 || (isTrabajador && isVerified)) && (
                <div className="rating-stats">
                  <div className="rating-container">
                    <div className="stars">
                      {renderStars(displayRating)}
                    </div>
                    <span className="rating-number">
                      {displayRating.toFixed(1)}
                    </span>
                    <span className="review-count">
                      ({displayReviewCount} {t('publicProfile.reviews') || 'reseñas'})
                    </span>
                  </div>
                  <span className="separator">•</span>
                  <div className="jobs-completed">
                    <CheckCircleIcon className="checkmark" />
                    <span className="count">
                      {displayJobsCompleted} {t('publicProfile.jobsCompleted') || 'trabajos completados'}
                    </span>
                  </div>
                </div>
              )}

              {/* Ubicación */}
              {(user.departamento || user.municipio) && (
                <div className="location">
                  <LocationOnIcon className="icon" />
                  <span>
                    {user.municipio && `${user.municipio}, `}
                    {user.departamento}
                  </span>
                </div>
              )}

              {/* Botones de acción */}
              <div className="action-buttons">
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/edit-profile')}
                    className="edit-button"
                  >
                    <EditIcon />
                    {t('common.edit') || 'Editar'}
                  </button>
                )}

                {/* Botón de Contratar - Solo para trabajadores verificados */}
                {isTrabajador && isVerified && (
                  <button
                    onClick={handleHire}
                    className="hire-button"
                  >
                    <AssignmentIcon />
                    {t('publicProfile.hire') || 'Contratar'}
                  </button>
                )}
              </div>

              {/* Mensaje si no está verificado */}
              {isTrabajador && !isVerified && (
                <div className="info-message">
                  <InfoIcon />
                  {t('publicProfile.verificationPending') || 'Este trabajador está pendiente de verificación'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid de Información */}
        <div className="info-grid">
          {/* Sobre Mí */}
          <div className="section-card about-section">
            <div className="section-header">
              <FormatQuoteIcon className="section-icon" />
              <h2 className="section-title">
                {t('publicProfile.aboutMe') || 'Sobre mí'}
              </h2>
            </div>
            <p className="bio">
              {user.biografia || (t('publicProfile.noBio') || 'Sin biografía')}
            </p>
            {user.fecha_registro && (
              <div className="info-item">
                <CalendarTodayIcon />
                <div>
                  <span className="info-label">{t('publicProfile.memberSince') || 'Miembro desde'}</span>
                  <span className="info-value">{formatMemberSince(user.fecha_registro)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tarifas - Solo para trabajadores con tarifas */}
          {isTrabajador && tarifas && (
            <div className="section-card rates-section">
              <div className="section-header">
                <AccountCircleIcon className="section-icon" />
                <h2 className="section-title">
                  {t('publicProfile.rates') || 'Tarifas'}
                </h2>
              </div>
              <div className="rates-grid">
                {tarifas.tarifa_hora > 0 && (
                  <div className="rate-item">
                    <AccessTimeIcon className="rate-icon" />
                    <div className="rate-label">
                      {getRateLabel(
                        tarifas.etiqueta_tarifa_hora,
                        t('publicProfile.hourlyRate') || 'Por Hora',
                      )}
                    </div>
                    <div className="rate-value">
                      ${parseFloat(tarifas.tarifa_hora).toFixed(2)}
                    </div>
                  </div>
                )}
                {tarifas.tarifa_dia > 0 && (
                  <div className="rate-item">
                    <CalendarTodayIcon className="rate-icon" />
                    <div className="rate-label">
                      {getRateLabel(
                        tarifas.etiqueta_tarifa_dia,
                        t('publicProfile.dailyRate') || 'Por Día',
                      )}
                    </div>
                    <div className="rate-value">
                      ${parseFloat(tarifas.tarifa_dia).toFixed(2)}
                    </div>
                  </div>
                )}
                {tarifas.tarifa_semana > 0 && (
                  <div className="rate-item">
                    <DateRangeIcon className="rate-icon" />
                    <div className="rate-label">
                      {getRateLabel(
                        tarifas.etiqueta_tarifa_semana,
                        t('publicProfile.weeklyRate') || 'Por Semana',
                      )}
                    </div>
                    <div className="rate-value">
                      ${parseFloat(tarifas.tarifa_semana).toFixed(2)}
                    </div>
                  </div>
                )}
                {tarifas.tarifa_mes > 0 && (
                  <div className="rate-item">
                    <CalendarTodayIcon className="rate-icon" />
                    <div className="rate-label">
                      {getRateLabel(
                        tarifas.etiqueta_tarifa_mes,
                        t('publicProfile.monthlyRate') || 'Por Mes',
                      )}
                    </div>
                    <div className="rate-value">
                      ${parseFloat(tarifas.tarifa_mes).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Servicios ofrecidos */}
          {isTrabajador && skills.length > 0 && (
            <div className="section-card services-section">
              <div className="section-header">
                <WorkIcon className="section-icon" />
                <h2 className="section-title">Servicios que ofrezco</h2>
              </div>
              <ul className="services-list">
                {skills.map((skill, index) => (
                  <li key={skill.id || index} className="services-list__item">
                    <CheckCircleIcon className="services-list__icon" />
                    <span>{skill.nombre || skill.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* Calendario de Disponibilidad - Ancho completo, fuera del info-grid */}
        {isTrabajador && isVerified && (
          <div className="section-card availability-section">
            <div className="section-header">
              <CalendarTodayIcon className="section-icon" />
              <h2 className="section-title">
                {t('publicProfile.availability') || 'Disponibilidad y Horarios'}
              </h2>
            </div>
            <AvailabilityCalendar trabajadorId={userId} />
          </div>
        )}

        {/* Reviews - Para cualquier usuario que tenga reseñas */}
        {reviews.length > 0 && (
          <div className="reviews-section section-card">
            <div className="section-header">
              <StarIcon className="section-icon" />
              <h2 className="section-title">
                {isTrabajador
                  ? (t('publicProfile.clientReviews') || 'Reseñas de Clientes')
                  : 'Reseñas de trabajadores'
                } ({displayReviewCount})
              </h2>
            </div>

            <div className="reviews-list">
              {reviews.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-name">
                        {review.calificador?.foto_perfil ? (
                          <img
                            src={review.calificador.foto_perfil}
                            alt={`Foto de ${review.calificador?.nombre || 'usuario'}`}
                            className="reviewer-avatar"
                          />
                        ) : (
                          <span className="reviewer-avatar reviewer-avatar--placeholder" aria-hidden="true">
                            {(review.calificador?.nombre?.charAt(0) || '?').toUpperCase()}
                          </span>
                        )}
                        {review.calificador?.nombre} {review.calificador?.apellido}
                      </div>
                      <div className="stars">
                        {renderStars(review.estrellas || 0)}
                      </div>
                    </div>
                    <div className="review-date">
                      <CalendarTodayIcon sx={{ fontSize: 16, marginRight: 0.5, verticalAlign: 'middle' }} />
                      {formatDate(review.fecha_creacion)}
                    </div>
                  </div>
                  <p className="review-comment">
                    {review.comentario}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
