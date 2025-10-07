import React from 'react';
import { workerService } from '../services/workerService';
import '../styles/components/WorkerCard.scss';

const WorkerCard = ({ worker, onCardClick }) => {
  // Calcular rating promedio y número de reviews
  const rating = worker.stats?.rating || worker.rating || 0;
  const reviewCount = worker.stats?.total_reviews || worker.reviewCount || 0;
  const jobsCompleted = worker.stats?.trabajos_completados || worker.jobsCompleted || 0;

  // Renderizar estrellas
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span 
        key={i} 
        className={`star ${i < Math.floor(rating) ? 'filled' : 'empty'}`}
      >
        ★
      </span>
    ));
  };

  // Función para formatear tarifas
  const formatPrice = (amount) => {
    if (!amount) return null;
    return new Intl.NumberFormat('es-SV', {
      style: 'currency',
      currency: worker.tarifas?.moneda || 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getMostRelevantRate = () => {
    if (!worker.tarifas) return null;
    
    const { tarifa_hora, tarifa_dia, tarifa_semana, tarifa_mes } = worker.tarifas;
    
    if (tarifa_hora) return { amount: tarifa_hora, period: '/hora' };
    if (tarifa_dia) return { amount: tarifa_dia, period: '/día' };
    if (tarifa_semana) return { amount: tarifa_semana, period: '/semana' };
    if (tarifa_mes) return { amount: tarifa_mes, period: '/mes' };
    
    return null;
  };

  const mainRate = getMostRelevantRate();

  // Truncar texto largo
  const truncateText = (text, maxLength = 80) => {
    if (!text) return 'Sin descripción disponible';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Obtener título/categoría principal
  const getWorkerTitle = () => {
    // Prioridad: titulo_profesional > categoría > habilidad > default
    if (worker.titulo_profesional) return worker.titulo_profesional;
    if (worker.titulo) return worker.titulo;
    if (worker.categorias && worker.categorias.length > 0) {
      return worker.categorias[0].nombre;
    }
    if (worker.habilidades && worker.habilidades.length > 0) {
      return worker.habilidades[0].nombre;
    }
    return 'Trabajador Profesional';
  };

  // ⬅️ AGREGAR ESTA FUNCIÓN
  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(worker.id);
    }
  };

  return (
    <div className="worker-card" onClick={handleCardClick}>
      {/* Foto de portada como fondo */}
      <div 
        className="card-cover"
        style={{
          backgroundImage: worker.foto_portada 
            ? `url(${worker.foto_portada})` 
            : 'linear-gradient(135deg, #2540FF 0%, #1a2ecc 100%)'
        }}
      >
        {/* Overlay oscuro para mejorar legibilidad */}
        <div className="cover-overlay" />
        
        {/* Badge de verificación */}
        {worker.verificado && (
          <div className="verified-badge" title="Trabajador Verificado">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#4CAF50"/>
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Contenido de la tarjeta */}
      <div className="card-content">
        {/* Foto de perfil centrada */}
        <div className="profile-photo-container">
          <img 
            src={worker.foto_perfil || 'https://via.placeholder.com/100'} 
            alt={`${worker.nombre} ${worker.apellido}`}
            className="profile-photo"
          />
        </div>

        {/* Información del trabajador */}
        <div className="worker-info">
          {/* Nombre completo */}
          <h3 className="worker-name">
            {worker.nombre} {worker.apellido}
          </h3>

          {/* Título/Profesión */}
          <p className="worker-title">
            {getWorkerTitle()}
          </p>

          {/* 🆕 MOSTRAR TARIFA PRINCIPAL */}
          {mainRate && (
            <div className="price-tag">
              <span className="price-amount">{formatPrice(mainRate.amount)}</span>
              <span className="price-period">{mainRate.period}</span>
            </div>
          )}

          {/* Ubicación */}
          {(worker.departamento || worker.municipio) && (
            <div className="worker-location">
              <span className="location-icon">📍</span>
              <span className="location-text">
                {worker.municipio || worker.departamento}
                {worker.municipio && worker.departamento && `, ${worker.departamento}`}
              </span>
            </div>
          )}

          {/* Descripción breve */}
          <p className="worker-description">
            {truncateText(worker.biografia)}
          </p>

          {/* Skills/Habilidades */}
          {worker.habilidades && worker.habilidades.length > 0 && (
            <div className="skills-container">
              {worker.habilidades.slice(0, 3).map((skill, index) => (
                <span key={skill.id || index} className="skill-badge">
                  {skill.nombre}
                </span>
              ))}
              {worker.habilidades.length > 3 && (
                <span className="skill-badge more">
                  +{worker.habilidades.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Rating y estadísticas */}
          <div className="card-footer">
            <div className="rating-section">
              <div className="stars">{renderStars(rating)}</div>
              <span className="rating-number">{rating.toFixed(1)}</span>
              <span className="review-count">({reviewCount})</span>
            </div>

            {jobsCompleted > 0 && (
              <>
                <span className="separator">•</span>
                <div className="jobs-info">
                  <span className="jobs-count">{jobsCompleted} trabajos</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Botón hover para ver perfil */}
      <div className="card-hover-overlay">
        <button className="view-profile-btn">
          Ver Perfil Completo
        </button>
      </div>
    </div>
  );
};

export default WorkerCard;