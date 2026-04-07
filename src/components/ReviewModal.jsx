import React from 'react';
import ReviewForm from './ReviewForm';
import '../styles/components/ReviewModal.scss';

/**
 * ReviewModal Component
 *
 * Modal wrapper para el formulario de reseñas.
 * Se muestra después de que un cliente cierra un contrato exitosamente.
 *
 * Props:
 * - isOpen: Boolean para mostrar/ocultar el modal
 * - contratoId: ID del contrato
 * - trabajadorId: ID del trabajador
 * - trabajadorNombre: Nombre del trabajador
 * - onSuccess: Callback cuando se crea la reseña exitosamente
 * - onClose: Callback para cerrar el modal
 * - canSkip: Permite omitir dejar reseña (default: true)
 */
const ReviewModal = ({
  isOpen,
  contratoId,
  trabajadorId,
  trabajadorNombre,
  onSuccess,
  onClose,
  canSkip = true,
}) => {
  if (!isOpen) return null;

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleSkip = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="review-modal-overlay"
        onClick={canSkip ? handleSkip : undefined}
        role="presentation"
      />

      {/* Modal Content */}
      <div className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
        <ReviewForm
          contratoId={contratoId}
          trabajadorId={trabajadorId}
          trabajadorNombre={trabajadorNombre}
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
