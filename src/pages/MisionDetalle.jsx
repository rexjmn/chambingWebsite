import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users, Clock, DollarSign, Briefcase, ArrowLeft, Loader,
  AlertCircle, Edit, X, CheckCircle,
} from 'lucide-react';
import { misionService } from '../services/misionService';
import { useAuth } from '../context/AuthContext';
import ApplyModal from '../components/misiones/ApplyModal';
import AplicantesPanel from '../components/misiones/AplicantesPanel';
import { logger } from '../utils/logger';
import '../styles/misiones.scss';

const ESTADO_LABELS = {
  activa: 'Activa',
  pausada: 'Pausada',
  cerrada: 'Cerrada',
};

function formatSalary(amount) {
  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function MisionDetalle() {
  const { misionId } = useParams();
  const { isAuthenticated, user } = useAuth();

  const [mision, setMision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [yaAplico, setYaAplico] = useState(false);
  const [closingMision, setClosingMision] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const isWorker = user?.tipo_usuario === 'trabajador';
  const isOwner = isAuthenticated && mision && user?.id === mision.cliente?.id;
  const trabajadorHabilidades = user?.habilidades || [];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await misionService.getMisionById(misionId);
        const m = res.data;
        setMision(m);

        // Check if worker already applied
        if (isAuthenticated && user?.tipo_usuario === 'trabajador') {
          const alreadyApplied = m.aplicaciones?.some(
            (a) => a.trabajador?.id === user.id || a.trabajador_id === user.id,
          );
          setYaAplico(alreadyApplied);
        }
      } catch (err) {
        logger.error('Error cargando misión:', err.message);
        setError('No se pudo cargar la misión');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [misionId, isAuthenticated, user?.id]);

  const handleApplySuccess = () => {
    setYaAplico(true);
    setSuccessMsg('¡Tu postulación fue enviada exitosamente!');
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleWithdraw = async () => {
    try {
      await misionService.retirarAplicacion(misionId);
      setYaAplico(false);
      setSuccessMsg('Postulación retirada');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      logger.error('Error retirando aplicación:', err.message);
    }
  };

  const handleClose = async () => {
    if (!window.confirm('¿Cerrar esta misión? Los trabajadores no podrán aplicar más.')) return;
    setClosingMision(true);
    try {
      await misionService.cerrarMision(misionId);
      setMision((prev) => ({ ...prev, estado: 'cerrada' }));
      setSuccessMsg('Misión cerrada exitosamente');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      logger.error('Error cerrando misión:', err.message);
    } finally {
      setClosingMision(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 2rem', color: '#64748b' }}>
        <Loader size={36} style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
        <p>Cargando misión...</p>
      </div>
    );
  }

  if (error || !mision) {
    return (
      <div className="mision-detalle" style={{ textAlign: 'center', padding: '4rem' }}>
        <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: 16 }} />
        <p style={{ color: '#1e293b', fontWeight: 700, fontSize: '1.25rem' }}>Misión no encontrada</p>
        <p style={{ color: '#64748b', marginBottom: 24 }}>{error}</p>
        <Link to="/misiones" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
          ← Volver a Misiones
        </Link>
      </div>
    );
  }

  const {
    titulo, descripcion, foto_portada, cantidad_personas,
    salario_por_persona, duracion, notas, estado,
    habilidades_requeridas = [], aplicaciones = [], cliente,
    fecha_creacion,
  } = mision;

  return (
    <div className="mision-detalle">
      {/* Back link */}
      <Link
        to="/misiones"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b', textDecoration: 'none', marginBottom: 20, fontSize: '0.9rem', fontWeight: 500 }}
      >
        <ArrowLeft size={16} />
        Volver a Misiones
      </Link>

      {/* Success/error banner */}
      {successMsg && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: '#065f46' }}>
          <CheckCircle size={18} />
          {successMsg}
        </div>
      )}

      {/* Cover */}
      {foto_portada ? (
        <div className="mision-detalle__cover">
          <img src={foto_portada} alt={titulo} />
        </div>
      ) : (
        <div className="mision-detalle__cover-placeholder">
          <Briefcase size={80} />
        </div>
      )}

      {/* Layout */}
      <div className="mision-detalle__layout">

        {/* ── Main content ── */}
        <div className="mision-detalle__main">
          <h1 className="mision-detalle__title">{titulo}</h1>

          {/* Meta row */}
          <div className="mision-detalle__meta">
            <div className="mision-detalle__meta-item">
              <Users size={16} />
              <span><strong>{cantidad_personas}</strong> persona{cantidad_personas !== 1 ? 's' : ''} necesaria{cantidad_personas !== 1 ? 's' : ''}</span>
            </div>
            <div className="mision-detalle__meta-item">
              <Clock size={16} />
              <span>Duración: <strong>{duracion}</strong></span>
            </div>
            <div className="mision-detalle__meta-item">
              <Briefcase size={16} />
              <span>{aplicaciones.length} postulante{aplicaciones.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mision-detalle__section">
            <h2 className="mision-detalle__section-title">Descripción del trabajo</h2>
            <p>{descripcion}</p>
          </div>

          {/* Skills */}
          {habilidades_requeridas.length > 0 && (
            <div className="mision-detalle__section">
              <h2 className="mision-detalle__section-title">Habilidades requeridas</h2>
              <div className="mision-detalle__skills">
                {habilidades_requeridas.map((skill) => (
                  <span key={skill.id} className="mision-detalle__skill-chip">
                    {skill.nombre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {notas && (
            <div className="mision-detalle__section">
              <h2 className="mision-detalle__section-title">Notas adicionales</h2>
              <p>{notas}</p>
            </div>
          )}

          {/* Applicants panel — only for the mission owner */}
          {isOwner && (
            <div className="mision-detalle__section">
              <h2 className="mision-detalle__section-title">Postulantes</h2>
              <AplicantesPanel misionId={misionId} />
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="mision-detalle__sidebar">
          <div className="mision-detalle__action-card">

            {/* Client info */}
            <div className="mision-detalle__client-info">
              {cliente?.foto_perfil ? (
                <img src={cliente.foto_perfil} alt={cliente.nombre} className="mision-detalle__client-info-avatar" style={{ objectFit: 'cover' }} />
              ) : (
                <div className="mision-detalle__client-info-avatar">
                  {cliente?.nombre?.charAt(0) || 'C'}
                </div>
              )}
              <div>
                <p className="mision-detalle__client-info-name">{cliente?.nombre} {cliente?.apellido}</p>
                <p className="mision-detalle__client-info-label">Publicado por</p>
              </div>
            </div>

            {/* Salary */}
            <div className="mision-detalle__salary-display">
              <div className="mision-detalle__salary-display-amount">
                {formatSalary(salario_por_persona)}
              </div>
              <div className="mision-detalle__salary-display-label">
                por persona · {duracion}
              </div>
            </div>

            {/* Info rows */}
            <div className="mision-detalle__info-row">
              <span className="mision-detalle__info-row-label">Personas</span>
              <span className="mision-detalle__info-row-value">{cantidad_personas}</span>
            </div>
            <div className="mision-detalle__info-row">
              <span className="mision-detalle__info-row-label">Duración</span>
              <span className="mision-detalle__info-row-value">{duracion}</span>
            </div>
            <div className="mision-detalle__info-row">
              <span className="mision-detalle__info-row-label">Estado</span>
              <span className={`aplicantes-panel__estado-chip aplicantes-panel__estado-chip--${estado === 'activa' ? 'aceptado' : estado === 'pausada' ? 'pendiente' : 'rechazado'}`}>
                {ESTADO_LABELS[estado] || estado}
              </span>
            </div>
            <div className="mision-detalle__info-row">
              <span className="mision-detalle__info-row-label">Publicado</span>
              <span className="mision-detalle__info-row-value">
                {fecha_creacion ? new Date(fecha_creacion).toLocaleDateString('es-SV') : '—'}
              </span>
            </div>

            {/* Actions */}
            {isAuthenticated && isWorker && estado === 'activa' && !isOwner && (
              yaAplico ? (
                <button
                  className="mision-detalle__apply-btn mision-detalle__apply-btn--danger"
                  onClick={handleWithdraw}
                >
                  Retirar postulación
                </button>
              ) : (
                <button
                  className="mision-detalle__apply-btn"
                  onClick={() => setApplyModalOpen(true)}
                >
                  Postularme
                </button>
              )
            )}

            {isAuthenticated && isWorker && yaAplico && (
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#10b981', marginTop: 8 }}>
                ✓ Ya postulaste a esta misión
              </p>
            )}

            {!isAuthenticated && estado === 'activa' && (
              <Link
                to="/login"
                className="mision-detalle__apply-btn"
                style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
              >
                Iniciar sesión para postularme
              </Link>
            )}

            {isOwner && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                <Link
                  to={`/misiones/${misionId}/editar`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.7rem', borderRadius: 10, border: '1px solid rgba(37,99,235,0.3)', color: '#2563eb', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}
                >
                  <Edit size={15} />
                  Editar misión
                </Link>
                {estado !== 'cerrada' && (
                  <button
                    onClick={handleClose}
                    disabled={closingMision}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.7rem', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                  >
                    <X size={15} />
                    {closingMision ? 'Cerrando...' : 'Cerrar misión'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply modal */}
      <ApplyModal
        open={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        mision={mision}
        trabajadorHabilidades={trabajadorHabilidades}
        onSuccess={handleApplySuccess}
      />
    </div>
  );
}
