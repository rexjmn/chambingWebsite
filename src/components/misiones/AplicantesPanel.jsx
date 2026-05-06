import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, User, ExternalLink, Loader } from 'lucide-react';
import { misionService } from '../../services/misionService';
import { logger } from '../../utils/logger';
import '../../styles/misiones.scss';

function StarRating({ rating }) {
  const filled = Math.round(rating || 0);
  return (
    <div className="aplicantes-panel__stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          fill={i <= filled ? '#f59e0b' : 'none'}
          color={i <= filled ? '#f59e0b' : '#cbd5e1'}
        />
      ))}
      {rating ? <span>({Number(rating).toFixed(1)})</span> : <span>Sin reseñas</span>}
    </div>
  );
}

function AplicanteAvatar({ trabajador }) {
  if (trabajador?.foto_perfil) {
    return (
      <div className="aplicantes-panel__avatar">
        <img src={trabajador.foto_perfil} alt={trabajador.nombre} />
      </div>
    );
  }
  return (
    <div className="aplicantes-panel__avatar">
      {trabajador?.nombre?.charAt(0) || <User size={22} />}
    </div>
  );
}

export default function AplicantesPanel({ misionId }) {
  const [aplicaciones, setAplicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!misionId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await misionService.getAplicaciones(misionId);
        setAplicaciones(res.data || []);
      } catch (err) {
        logger.error('Error cargando aplicaciones:', err.message);
        setError('No se pudieron cargar las aplicaciones');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [misionId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
        <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: 8 }}>Cargando postulantes...</p>
      </div>
    );
  }

  if (error) {
    return <p style={{ color: '#ef4444', textAlign: 'center', padding: '1rem' }}>{error}</p>;
  }

  if (aplicaciones.length === 0) {
    return (
      <div className="misiones-empty" style={{ padding: '2rem 1rem' }}>
        <User size={48} className="misiones-empty__icon" />
        <p className="misiones-empty__title">Aún no hay postulantes</p>
        <p className="misiones-empty__text">
          Cuando los trabajadores apliquen a esta misión, aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="aplicantes-panel">
      <p className="aplicantes-panel__count">
        Postulantes <span>{aplicaciones.length}</span>
      </p>

      <div className="aplicantes-panel__list">
        {aplicaciones.map((aplicacion) => {
          const { trabajador, estado } = aplicacion;
          const rating = trabajador?.promedio_calificacion || trabajador?.rating;

          return (
            <div key={aplicacion.id} className="aplicantes-panel__card">
              <AplicanteAvatar trabajador={trabajador} />

              <div className="aplicantes-panel__info">
                <p className="aplicantes-panel__name">
                  {trabajador?.nombre} {trabajador?.apellido}
                </p>
                {trabajador?.titulo_profesional && (
                  <p className="aplicantes-panel__title">{trabajador.titulo_profesional}</p>
                )}
                <StarRating rating={rating} />
              </div>

              <div className="aplicantes-panel__actions">
                <span className={`aplicantes-panel__estado-chip aplicantes-panel__estado-chip--${estado}`}>
                  {estado === 'pendiente' ? 'Pendiente' :
                   estado === 'aceptado' ? 'Aceptado' :
                   estado === 'rechazado' ? 'Rechazado' : 'Retirado'}
                </span>

                <Link
                  to={`/profile/${trabajador?.id}`}
                  className="aplicantes-panel__view-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver perfil <ExternalLink size={14} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
