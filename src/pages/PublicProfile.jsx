import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { publicProfileService } from '../services/publicProfileService';
import '../styles/Public-profile.scss';
// Iconos de Material UI
import {
  VerifiedUser as VerifiedUserIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Info as InfoIcon,
  LocationOn as LocationOnIcon,
  Phone as PhoneIcon,
  Star as StarIcon,
  StarHalf as StarHalfIcon,
  StarOutline as StarOutlineIcon,
  WorkOutline as WorkOutlineIcon,
  CalendarToday as CalendarTodayIcon,
  DateRange as DateRangeIcon,
  AccessTime as AccessTimeIcon,
  AccountCircle as AccountCircleIcon,
  Email as EmailIcon,
  Close as CloseIcon,
  FormatQuote as FormatQuoteIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

const PublicProfile = () => {
  const { t, i18n } = useTranslation();
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();

  const [user, setUser] = useState(null);
  const [skills, setSkills] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);

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

          // Cargar datos adicionales solo si es trabajador
          if (userData.tipo_usuario === 'trabajador') {
            try {
              const [reviewsRes, statsRes] = await Promise.allSettled([
                publicProfileService.getUserReviews(userId),
                publicProfileService.getUserStats(userId)
              ]);

              if (reviewsRes.status === 'fulfilled') {
                setReviews(reviewsRes.value.data || []);
              }

              if (statsRes.status === 'fulfilled') {
                setStats(statsRes.value.data || {
                  trabajos_completados: 0,
                  rating: 0,
                  total_reviews: 0
                });
              }
            } catch (additionalError) {
              console.warn('Error loading additional data:', additionalError);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
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
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
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

              {/* Rating y Estadísticas - Solo para trabajadores verificados */}
              {isTrabajador && isVerified && (
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
                {/* Botón de Contacto - Solo si hay teléfono (trabajadores verificados) */}
                {user.telefono && (
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="contact-button"
                  >
                    <PhoneIcon />
                    {t('publicProfile.contact') || 'Contactar'}
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

          {/* Tarifas - Solo para trabajadores verificados con tarifas */}
          {isTrabajador && isVerified && user.tarifas && (
            <div className="section-card rates-section">
              <div className="section-header">
                <AccountCircleIcon className="section-icon" />
                <h2 className="section-title">
                  {t('publicProfile.rates') || 'Tarifas'}
                </h2>
              </div>
              <div className="rates-grid">
                {user.tarifas.tarifa_hora && (
                  <div className="rate-item">
                    <AccessTimeIcon className="rate-icon" />
                    <div className="rate-label">{t('publicProfile.hourlyRate') || 'Por Hora'}</div>
                    <div className="rate-value">
                      ${parseFloat(user.tarifas.tarifa_hora).toFixed(2)}
                    </div>
                  </div>
                )}
                {user.tarifas.tarifa_dia && (
                  <div className="rate-item">
                    <CalendarTodayIcon className="rate-icon" />
                    <div className="rate-label">{t('publicProfile.dailyRate') || 'Por Día'}</div>
                    <div className="rate-value">
                      ${parseFloat(user.tarifas.tarifa_dia).toFixed(2)}
                    </div>
                  </div>
                )}
                {user.tarifas.tarifa_semana && (
                  <div className="rate-item">
                    <DateRangeIcon className="rate-icon" />
                    <div className="rate-label">{t('publicProfile.weeklyRate') || 'Por Semana'}</div>
                    <div className="rate-value">
                      ${parseFloat(user.tarifas.tarifa_semana).toFixed(2)}
                    </div>
                  </div>
                )}
                {user.tarifas.tarifa_mes && (
                  <div className="rate-item">
                    <CalendarTodayIcon className="rate-icon" />
                    <div className="rate-label">{t('publicProfile.monthlyRate') || 'Por Mes'}</div>
                    <div className="rate-value">
                      ${parseFloat(user.tarifas.tarifa_mes).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Habilidades - Solo si es trabajador y tiene habilidades */}
          {isTrabajador && skills.length > 0 && (
            <div className="section-card skills-section">
              <div className="section-header">
                <WorkIcon className="section-icon" />
                <h2 className="section-title">
                  {t('publicProfile.mySkills') || 'Mis Habilidades'}
                </h2>
              </div>
              <div className="skills-container">
                {skills.map((skill, index) => (
                  <div key={skill.id || index} className="skill-badge">
                    <CheckCircleIcon className="checkmark" />
                    {skill.nombre || skill.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reviews - Solo si es trabajador verificado y tiene reviews */}
        {isTrabajador && isVerified && reviews.length > 0 && (
          <div className="reviews-section section-card">
            <div className="section-header">
              <StarIcon className="section-icon" />
              <h2 className="section-title">
                {t('publicProfile.clientReviews') || 'Reseñas de Clientes'} ({displayReviewCount})
              </h2>
            </div>

            <div className="reviews-list">
              {reviews.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-name">
                        <AccountCircleIcon sx={{ marginRight: 1, verticalAlign: 'middle' }} />
                        {review.cliente_nombre || review.cliente}
                      </div>
                      <div className="stars">
                        {renderStars(review.rating || review.calificacion)}
                      </div>
                    </div>
                    <div className="review-date">
                      <CalendarTodayIcon sx={{ fontSize: 16, marginRight: 0.5, verticalAlign: 'middle' }} />
                      {formatDate(review.fecha || review.created_at)}
                    </div>
                  </div>
                  <p className="review-comment">
                    {review.comentario || review.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Contacto */}
      {showContactModal && (
        <>
          <div
            onClick={() => setShowContactModal(false)}
            className="modal-overlay"
          />
          <div className="modal">
            <div className="section-header">
              <PhoneIcon className="section-icon" />
              <h3 className="modal-title">
                {t('publicProfile.contactInfo') || 'Información de Contacto'}
              </h3>
            </div>
            <div className="modal-content">
              {user.telefono && (
                <div className="contact-info">
                  <PhoneIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                  <div>
                    <div className="label">{t('publicProfile.phone') || 'Teléfono'}</div>
                    <div className="value">
                      <a href={`tel:${user.telefono}`}>{user.telefono}</a>
                    </div>
                  </div>
                </div>
              )}
              {user.email && (
                <div className="contact-info">
                  <EmailIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                  <div>
                    <div className="label">Email</div>
                    <div className="value">
                      <a href={`mailto:${user.email}`}>{user.email}</a>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowContactModal(false)}
                className="close-button"
              >
                <CloseIcon sx={{ marginRight: 1 }} />
                {t('common.close') || 'Cerrar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PublicProfile;
