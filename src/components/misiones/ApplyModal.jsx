import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { X, Star, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { misionService } from '../../services/misionService';
import { logger } from '../../utils/logger';
import '../../styles/misiones.scss';

function SkillMatchBanner({ matchCount, totalRequired }) {
  if (totalRequired === 0) {
    return (
      <div className="apply-modal__match-banner apply-modal__match-banner--ok">
        <Info size={18} style={{ flexShrink: 0, marginTop: 2 }} />
        <p>Esta misión no requiere habilidades específicas. ¡Cualquier trabajador puede aplicar!</p>
      </div>
    );
  }

  if (matchCount >= 3) {
    return (
      <div className="apply-modal__match-banner apply-modal__match-banner--great">
        <CheckCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
        <p>
          <strong>¡Podrías ser un excelente candidato!</strong> Tienes {matchCount} de las {totalRequired} habilidades requeridas para esta misión.
        </p>
      </div>
    );
  }

  if (matchCount > 0) {
    return (
      <div className="apply-modal__match-banner apply-modal__match-banner--ok">
        <Star size={18} style={{ flexShrink: 0, marginTop: 2 }} />
        <p>
          Tienes <strong>{matchCount} de {totalRequired}</strong> habilidades requeridas. Puedes aplicar y el cliente evaluará tu perfil.
        </p>
      </div>
    );
  }

  return (
    <div className="apply-modal__match-banner apply-modal__match-banner--warn">
      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
      <p>
        <strong>No tienes habilidades requeridas</strong> en tu perfil para esta misión. Puedes aplicar de todos modos, aunque el cliente podría preferir candidatos con las habilidades requeridas.
      </p>
    </div>
  );
}

export default function ApplyModal({ open, onClose, mision, trabajadorHabilidades = [], onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requiredSkills = mision?.habilidades_requeridas || [];

  const matchingSkillIds = new Set(trabajadorHabilidades.map((s) => s.id));
  const matchingSkills = requiredSkills.filter((s) => matchingSkillIds.has(s.id));
  const missingSkills = requiredSkills.filter((s) => !matchingSkillIds.has(s.id));
  const matchCount = matchingSkills.length;

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const handleApply = async () => {
    setLoading(true);
    setError(null);
    try {
      await misionService.aplicar(mision.id);
      onSuccess?.();
      onClose();
    } catch (err) {
      logger.error('Error aplicando a misión:', err.message);
      const msg = err.response?.data?.message || 'Error al enviar la postulación';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!mision) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <span style={{ fontWeight: 700 }}>Postularte a esta misión</span>
        <IconButton onClick={onClose} size="small" disabled={loading}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Mission summary */}
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid rgba(0,0,0,0.07)' }}>
          <p style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{mision.titulo}</p>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
            Salario: <strong style={{ color: '#2563eb' }}>
              ${Number(mision.salario_por_persona).toLocaleString('es-SV')}
            </strong> · Duración: {mision.duracion}
          </p>
        </div>

        {/* Skill match banner */}
        <SkillMatchBanner matchCount={matchCount} totalRequired={requiredSkills.length} />

        {/* Skills comparison */}
        {requiredSkills.length > 0 && (
          <div className="apply-modal__skills-section">
            {matchingSkills.length > 0 && (
              <>
                <p className="apply-modal__skills-title">✓ Tienes estas habilidades</p>
                <div className="apply-modal__skills-list">
                  {matchingSkills.map((s) => (
                    <span key={s.id} className="apply-modal__skill-chip apply-modal__skill-chip--match">
                      {s.nombre}
                    </span>
                  ))}
                </div>
              </>
            )}

            {missingSkills.length > 0 && (
              <>
                <p className="apply-modal__skills-title" style={{ marginTop: matchingSkills.length ? 8 : 0 }}>
                  Habilidades requeridas que no tienes
                </p>
                <div className="apply-modal__skills-list">
                  {missingSkills.map((s) => (
                    <span key={s.id} className="apply-modal__skill-chip apply-modal__skill-chip--missing">
                      {s.nombre}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {error && (
          <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: 8 }}>{error}</p>
        )}

        {/* Actions */}
        <div className="apply-modal__actions">
          <button
            className="apply-modal__btn apply-modal__btn--secondary"
            onClick={onClose}
            disabled={loading}
          >
            Volver
          </button>

          {matchCount === 0 && requiredSkills.length > 0 ? (
            <button
              className="apply-modal__btn apply-modal__btn--warn"
              onClick={handleApply}
              disabled={loading}
            >
              {loading ? <CircularProgress size={16} /> : 'Aplicar de todos modos'}
            </button>
          ) : (
            <button
              className="apply-modal__btn apply-modal__btn--primary"
              onClick={handleApply}
              disabled={loading}
            >
              {loading ? <CircularProgress size={16} color="inherit" /> : '¡Postularme!'}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
