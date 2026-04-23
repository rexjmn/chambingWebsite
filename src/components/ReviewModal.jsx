import React from 'react';
import ReviewForm from './ReviewForm';
import '../styles/components/ReviewModal.scss';

/**
 * ReviewModal — bidireccional (cliente ↔ trabajador)
 *
 * Props:
 * - isOpen: Boolean para mostrar/ocultar el modal
 * - contratoId: ID del contrato
 * - calificadoId: ID del usuario a calificar
 * - calificadoNombre: Nombre del usuario a calificar
 * - titulo: (opcional) título personalizado
 * - onSuccess: Callback cuando se crea la reseña exitosamente
 * - onClose: Callback para cerrar el modal
 * - canSkip: Permite omitir dejar reseña (default: true)
 */
const ReviewModal = ({
  isOpen,
  contratoId,
  calificadoId,
  calificadoNombre,
  titulo,
  onSuccess,
  onClose,
  canSkip = true,
}) => {
  if (!isOpen) return null;

  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    if (onClose) onClose();
  };

  const handleSkip = () => {
    if (onClose) onClose();
  };

  return (
    <>
      <div
        className="review-modal-overlay"
        onClick={canSkip ? handleSkip : undefined}
        role="presentation"
      />

      <div className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
        <ReviewForm
          contratoId={contratoId}
          calificadoId={calificadoId}
          calificadoNombre={calificadoNombre}
          titulo={titulo}
          onSuccess={handleSuccess}
          onCancel={canSkip ? handleSkip : undefined}
          onClose={canSkip ? onClose : undefined}
        />

        {canSkip && (
          <button
            onClick={handleSkip}
            className="skip-review-btn"
            type="button"
          >
            Omitir por ahora
          </button>
        )}
      </div>
    </>
  );
};

export default ReviewModal;
