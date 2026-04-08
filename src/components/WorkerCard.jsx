// src/components/WorkerCard.jsx
import { useEffect, useState, memo } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Star, MapPin, Briefcase, MessageCircle, BadgeCheck } from 'lucide-react';
import { serviceService } from '../services/serviceService';
import { logger } from '../utils/logger';
import '../styles/components/WorkerCard.scss';

/* ─── Render star rating ─────────────────────────────────────── */
const StarRating = ({ value = 0 }) => (
  <div className="wcard-stars" aria-label={`${value.toFixed(1)} de 5 estrellas`}>
    {Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={13}
        strokeWidth={2}
        fill={i < Math.floor(value) ? 'currentColor' : 'none'}
        style={{ opacity: i < Math.floor(value) ? 1 : 0.28 }}
      />
    ))}
  </div>
);

/* ════════════════════════════════════════════════════════════════
   WORKER CARD
════════════════════════════════════════════════════════════════ */
const WorkerCard = memo(({ worker }) => {
  const [tarifas, setTarifas]           = useState(null);
  const [loadingTarifas, setLoadingTarifas] = useState(true);

  useEffect(() => {
    const fetchTarifas = async () => {
      if (!worker?.id) { setLoadingTarifas(false); return; }
      try {
        const data = await serviceService.getTarifasByWorker(worker.id);
        setTarifas(data);
      } catch (err) {
        logger.error('Error cargando tarifas:', err);
      } finally {
        setLoadingTarifas(false);
      }
    };
    fetchTarifas();
  }, [worker?.id]);

  /* ── helpers ─────────────────────────────────────────────── */
  const rating        = worker?.stats?.rating               || worker?.rating       || 0;
  const reviewCount   = worker?.stats?.total_reviews        || worker?.reviewCount  || 0;
  const jobsCompleted = worker?.stats?.trabajos_completados || worker?.jobsCompleted|| 0;

  const getTitle = () => {
    if (worker?.titulo_profesional && typeof worker.titulo_profesional === 'string')
      return worker.titulo_profesional;
    if (worker?.titulo && typeof worker.titulo === 'string')
      return worker.titulo;
    if (Array.isArray(worker?.categorias) && worker.categorias.length > 0) {
      const c = worker.categorias[0];
      if (typeof c === 'object' && c) return c.nombre || c.categoria || 'Profesional';
      if (typeof c === 'string')     return c;
    }
    if (Array.isArray(worker?.habilidades) && worker.habilidades.length > 0) {
      const h = worker.habilidades[0];
      if (typeof h === 'string')     return h;
      if (typeof h === 'object' && h) return h.nombre || 'Profesional';
    }
    return 'Profesional de servicios';
  };

  const formatPrice = (amount) => {
    if (!amount && amount !== 0) return null;
    try {
      return new Intl.NumberFormat('es-SV', {
        style: 'currency', currency: tarifas?.moneda || 'USD',
        minimumFractionDigits: 2, maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `$${Number(amount).toFixed(2)}`;
    }
  };

  const getMainRate = () => {
    if (!tarifas?.activo) return null;
    const rates = [
      { amount: tarifas.tarifa_hora,   period: '/hr',  priority: 1 },
      { amount: tarifas.tarifa_dia,    period: '/día',  priority: 2 },
      { amount: tarifas.tarifa_semana, period: '/sem',  priority: 3 },
      { amount: tarifas.tarifa_mes,    period: '/mes',  priority: 4 },
    ];
    const valid = rates.find(r => r.amount && Number(r.amount) > 0);
    return valid ? { amount: Number(valid.amount), period: valid.period } : null;
  };

  const mainRate = getMainRate();

  const truncate = (text, max = 78) => {
    if (!text || typeof text !== 'string') return 'Sin descripción disponible';
    return text.length <= max ? text : text.substring(0, max) + '…';
  };

  /* ── guard ───────────────────────────────────────────────── */
  if (!worker?.id) {
    logger.error('WorkerCard sin ID:', worker);
    return null;
  }

  logger.debug('Rendering WorkerCard:', worker.id);

  return (
    <Link to={`/profile/${worker.id}`} className="worker-card-link">
      <article className="worker-card">

        {/* ── Cover ──────────────────────────────────────────── */}
        <div className="wcard-cover">
          <img
            src={worker.foto_portada || '/default-cover.jpg'}
            alt=""
            aria-hidden="true"
            onError={(e) => { e.target.src = '/default-cover.jpg'; }}
          />
          <div className="wcard-cover-gradient" aria-hidden="true" />

          {worker.verificado && (
            <span className="wcard-verified" title="Perfil Verificado" aria-label="Verificado">
              <BadgeCheck size={14} strokeWidth={2.5} />
              Verificado
            </span>
          )}

          {/* Price badge floated on cover */}
          {!loadingTarifas && mainRate && (
            <div className="wcard-price-badge">
              <span className="wcard-price-amount">{formatPrice(mainRate.amount)}</span>
              <span className="wcard-price-period">{mainRate.period}</span>
              {tarifas?.negociable && (
                <MessageCircle size={12} strokeWidth={2} className="wcard-price-neg" aria-label="Negociable" />
              )}
            </div>
          )}
          {loadingTarifas && <div className="wcard-price-skeleton" aria-hidden="true" />}
        </div>

        {/* ── Avatar ─────────────────────────────────────────── */}
        <div className="wcard-avatar-wrap">
          <img
            className="wcard-avatar"
            src={worker.foto_perfil || '/default-avatar.jpg'}
            alt={`${worker.nombre || ''} ${worker.apellido || ''}`}
            loading="lazy"
            onError={(e) => { e.target.src = '/default-avatar.jpg'; }}
          />
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div className="wcard-body">
          <h3 className="wcard-name">
            {worker.nombre || 'Nombre'} {worker.apellido || 'Apellido'}
          </h3>

          <p className="wcard-title">{getTitle()}</p>

          <p className="wcard-desc">{truncate(worker.biografia)}</p>

          <p className="wcard-location">
            <MapPin size={13} strokeWidth={2} aria-hidden="true" />
            {worker.municipio || 'Ubicación'}, {worker.departamento || 'Departamento'}
          </p>
        </div>

        {/* ── Footer stats ───────────────────────────────────── */}
        <footer className="wcard-footer">
          <div className="wcard-rating">
            <StarRating value={rating} />
            <span className="wcard-rating-val">{rating.toFixed(1)}</span>
            <span className="wcard-rating-count">({reviewCount})</span>
          </div>

          {jobsCompleted > 0 && (
            <div className="wcard-jobs">
              <Briefcase size={12} strokeWidth={2} aria-hidden="true" />
              <span>{jobsCompleted} trabajos</span>
            </div>
          )}
        </footer>

        {/* ── Hover CTA strip ────────────────────────────────── */}
        <div className="wcard-cta" aria-hidden="true">
          <span>Ver perfil completo</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

      </article>
    </Link>
  );
}, (prev, next) => prev.worker.id === next.worker.id);

WorkerCard.displayName = 'WorkerCard';

WorkerCard.propTypes = {
  worker: PropTypes.shape({
    id:                  PropTypes.string.isRequired,
    nombre:              PropTypes.string,
    apellido:            PropTypes.string,
    foto_perfil:         PropTypes.string,
    foto_portada:        PropTypes.string,
    verificado:          PropTypes.bool,
    biografia:           PropTypes.string,
    titulo_profesional:  PropTypes.string,
    titulo:              PropTypes.string,
    departamento:        PropTypes.string,
    municipio:           PropTypes.string,
    tarifas:             PropTypes.object,
    stats:               PropTypes.object,
    habilidades:         PropTypes.array,
    categorias:          PropTypes.array,
  }).isRequired,
};

export default WorkerCard;
