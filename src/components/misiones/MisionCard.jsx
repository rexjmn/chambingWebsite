import { Link } from 'react-router-dom';
import { Users, Clock, DollarSign, Briefcase } from 'lucide-react';
import '../../styles/misiones.scss';

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

function ClientAvatar({ cliente }) {
  if (cliente?.foto_perfil) {
    return <img src={cliente.foto_perfil} alt={cliente.nombre} />;
  }
  return (
    <div className="mision-card__meta-avatar">
      {cliente?.nombre?.charAt(0) || 'C'}
    </div>
  );
}

export default function MisionCard({ mision, showApplyButton = true, isOwner = false }) {
  const {
    id,
    titulo,
    descripcion,
    foto_portada,
    cantidad_personas,
    salario_por_persona,
    duracion,
    estado,
    habilidades_requeridas = [],
    aplicaciones = [],
    cliente,
  } = mision;

  const VISIBLE_SKILLS = 3;
  const visibleSkills = habilidades_requeridas.slice(0, VISIBLE_SKILLS);
  const extraSkills = habilidades_requeridas.length - VISIBLE_SKILLS;

  return (
    <article className="mision-card">
      {/* Cover */}
      {foto_portada ? (
        <div className="mision-card__cover">
          <img src={foto_portada} alt={titulo} loading="lazy" />
          <span className={`mision-card__estado-badge mision-card__estado-badge--${estado}`}>
            {ESTADO_LABELS[estado] || estado}
          </span>
        </div>
      ) : (
        <div className="mision-card__cover-placeholder">
          <Briefcase size={56} />
          <span className={`mision-card__estado-badge mision-card__estado-badge--${estado}`}>
            {ESTADO_LABELS[estado] || estado}
          </span>
        </div>
      )}

      {/* Body */}
      <div className="mision-card__body">
        <div className="mision-card__header">
          <h3 className="mision-card__title">{titulo}</h3>
        </div>

        <p className="mision-card__description">{descripcion}</p>

        {/* Stats */}
        <div className="mision-card__stats">
          <div className="mision-card__stat">
            <Users size={14} />
            <strong>{cantidad_personas}</strong> persona{cantidad_personas !== 1 ? 's' : ''}
          </div>
          <div className="mision-card__stat">
            <Clock size={14} />
            {duracion}
          </div>
          {aplicaciones.length > 0 && (
            <div className="mision-card__stat">
              <Briefcase size={14} />
              {aplicaciones.length} aplicaci{aplicaciones.length !== 1 ? 'ones' : 'ón'}
            </div>
          )}
        </div>

        {/* Skills */}
        {habilidades_requeridas.length > 0 && (
          <div className="mision-card__skills">
            {visibleSkills.map((skill) => (
              <span key={skill.id} className="mision-card__skill-chip">
                {skill.nombre}
              </span>
            ))}
            {extraSkills > 0 && (
              <span className="mision-card__skills-more">+{extraSkills} más</span>
            )}
          </div>
        )}

        {/* Salary */}
        <div className="mision-card__salary">
          <span className="mision-card__salary-label">Salario por persona</span>
          <div>
            <div className="mision-card__salary-amount">{formatSalary(salario_por_persona)}</div>
            <div className="mision-card__salary-per">por {duracion}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mision-card__footer">
        <div className="mision-card__meta">
          <ClientAvatar cliente={cliente} />
          <span>{cliente?.nombre?.split(' ')[0] || 'Cliente'}</span>
        </div>

        <Link
          to={`/misiones/${id}`}
          className={isOwner ? 'mision-card__manage-btn' : 'mision-card__apply-btn'}
        >
          {isOwner ? 'Gestionar' : showApplyButton ? 'Ver misión' : 'Ver detalles'}
        </Link>
      </div>
    </article>
  );
}
