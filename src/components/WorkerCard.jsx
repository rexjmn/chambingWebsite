// src/components/WorkerCard.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // ← ¡AGREGAR ESTA LÍNEA!
import PropTypes from 'prop-types';
import { serviceService } from '../services/serviceService';
import '../styles/components/WorkerCard.scss';

const WorkerCard = ({ worker }) => { // ← Quitar onCardClick de los props
  const [tarifas, setTarifas] = useState(null);
  const [loadingTarifas, setLoadingTarifas] = useState(true);

  // 💰 Cargar tarifas al montar
  useEffect(() => {
    const fetchTarifas = async () => {
      if (!worker?.id) {
        setLoadingTarifas(false);
        return;
      }

      try {
        const tarifasData = await serviceService.getTarifasByWorker(worker.id);
        setTarifas(tarifasData);
      } catch (error) {
        console.error('Error cargando tarifas:', error);
        setTarifas(null);
      } finally {
        setLoadingTarifas(false);
      }
    };

    fetchTarifas();
  }, [worker?.id]);

  // Stats
  const rating = worker?.stats?.rating || worker?.rating || 0;
  const reviewCount = worker?.stats?.total_reviews || worker?.reviewCount || 0;
  const jobsCompleted = worker?.stats?.trabajos_completados || worker?.jobsCompleted || 0;

  // 🎯 FUNCIÓN SEGURA para obtener el título
  const getWorkerTitle = () => {
    if (worker?.titulo_profesional && typeof worker.titulo_profesional === 'string') {
      return worker.titulo_profesional;
    }

    if (worker?.titulo && typeof worker.titulo === 'string') {
      return worker.titulo;
    }

    if (Array.isArray(worker?.categorias) && worker.categorias.length > 0) {
      const firstCategory = worker.categorias[0];

      if (typeof firstCategory === 'object' && firstCategory !== null) {
        return firstCategory.nombre || firstCategory.categoria || 'Profesional';
      }

      if (typeof firstCategory === 'string') {
        return firstCategory;
      }
    }

    if (Array.isArray(worker?.habilidades) && worker.habilidades.length > 0) {
      const firstSkill = worker.habilidades[0];

      if (typeof firstSkill === 'string') {
        return firstSkill;
      }

      if (typeof firstSkill === 'object' && firstSkill !== null) {
        return firstSkill.nombre || 'Profesional';
      }
    }

    return 'Profesional de servicios';
  };

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

  // 💰 Formatear precio
  const formatPrice = (amount) => {
    if (!amount && amount !== 0) return null;

    const currency = tarifas?.moneda || 'USD';

    try {
      return new Intl.NumberFormat('es-SV', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      return `$${Number(amount).toFixed(2)}`;
    }
  };

  // 🎯 Obtener tarifa más relevante
  const getMostRelevantRate = () => {
    if (!tarifas || !tarifas.activo) return null;

    const rates = [
      { amount: tarifas.tarifa_hora, period: '/hora', priority: 1 },
      { amount: tarifas.tarifa_dia, period: '/día', priority: 2 },
      { amount: tarifas.tarifa_semana, period: '/semana', priority: 3 },
      { amount: tarifas.tarifa_mes, period: '/mes', priority: 4 }
    ];

    const validRate = rates.find(r => r.amount && Number(r.amount) > 0);

    return validRate ? { 
      amount: Number(validRate.amount), 
      period: validRate.period 
    } : null;
  };

  const mainRate = getMostRelevantRate();

  // Truncar texto largo
  const truncateText = (text, maxLength = 80) => {
    if (!text || typeof text !== 'string') return 'Sin descripción disponible';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // 🛡️ Guard clause - Validar que worker existe y tiene ID
  if (!worker || !worker.id) {
    console.error('❌ Worker sin ID:', worker);
    return <div className="worker-card-error">Trabajador no disponible</div>;
  }

  // 🔍 DEBUG: Ver el ID antes de renderizar
  console.log('🔍 Rendering WorkerCard for ID:', worker.id);

  return (
    <Link 
      to={`/profile/${worker.id}`}  // ✅ Solo el ID (string UUID)
      className="worker-card-link"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="worker-card">
        {/* Imagen de portada */}
        <div className="worker-card-cover">
          <img
            src={worker.foto_portada || '/default-cover.jpg'}
            alt={`Portada de ${worker.nombre || 'trabajador'}`}
            onError={(e) => { e.target.src = '/default-cover.jpg'; }}
          />
          {worker.verificado && (
            <div className="verified-badge" title="Perfil Verificado">
              <span>✓</span>
            </div>
          )}
        </div>

        {/* Contenido principal */}
        <div className="worker-card-content">
          {/* Avatar */}
          <div className="worker-avatar-wrapper">
            <img
              className="worker-avatar"
              src={worker.foto_perfil || '/default-avatar.jpg'}
              alt={`${worker.nombre || ''} ${worker.apellido || ''}`}
              loading="lazy"
              onError={(e) => { e.target.src = '/default-avatar.jpg'; }}
            />
          </div>

          {/* Info básica */}
          <div className="worker-info">
            <h3 className="worker-name">
              {worker.nombre || 'Nombre'} {worker.apellido || 'Apellido'}
            </h3>

            <p className="worker-title">
              {getWorkerTitle()}
            </p>

            {/* 💰 TARIFA PRINCIPAL */}
            {!loadingTarifas && mainRate && (
              <div className="price-tag">
                <span className="price-amount">{formatPrice(mainRate.amount)}</span>
                <span className="price-period">{mainRate.period}</span>
                {tarifas?.negociable && (
                  <span className="price-negotiable" title="Precio negociable">
                    💬
                  </span>
                )}
              </div>
            )}

            {loadingTarifas && (
              <div className="price-tag skeleton">
                <span className="skeleton-text"></span>
              </div>
            )}

            {/* Ubicación */}
            <p className="worker-location">
              📍 {worker.municipio || 'Ubicación'}, {worker.departamento || 'Departamento'}
            </p>

            {/* Descripción */}
            <p className="worker-description">
              {truncateText(worker.biografia)}
            </p>

            {/* Rating y stats */}
            <div className="worker-stats">
              <div className="rating-section">
                <div className="stars">{renderStars(rating)}</div>
                <span className="rating-value">{rating.toFixed(1)}</span>
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

        {/* Hover overlay */}
        <div className="card-hover-overlay">
          <button className="view-profile-btn" type="button">
            Ver Perfil Completo
          </button>
        </div>
      </div>
    </Link>
  );
};

WorkerCard.propTypes = {
  worker: PropTypes.shape({
    id: PropTypes.string.isRequired, // ✅ REQUERIDO
    nombre: PropTypes.string,
    apellido: PropTypes.string,
    foto_perfil: PropTypes.string,
    foto_portada: PropTypes.string,
    verificado: PropTypes.bool,
    biografia: PropTypes.string,
    titulo_profesional: PropTypes.string,
    titulo: PropTypes.string,
    departamento: PropTypes.string,
    municipio: PropTypes.string,
    tarifas: PropTypes.object,
    stats: PropTypes.object,
    habilidades: PropTypes.array,
    categorias: PropTypes.array
  }).isRequired
  // ❌ Ya no necesitas onCardClick en PropTypes
};

export default WorkerCard;
