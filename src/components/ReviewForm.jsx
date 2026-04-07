import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, StarOutline, Send, X } from '@mui/icons-material';
import { reviewService } from '../services/reviewService';
import { logger } from '../utils/logger';
import '../styles/components/ReviewForm.scss';

/**
 * ReviewForm Component
 *
 * Formulario para que los clientes dejen reseñas a los trabajadores
 * después de completar un contrato.
 *
 * Props:
 * - contratoId: ID del contrato
 * - trabajadorId: ID del trabajador a calificar
 * - trabajadorNombre: Nombre del trabajador
 * - onSuccess: Callback cuando se crea exitosamente
 * - onCancel: Callback para cancelar
 * - onClose: Callback para cerrar el modal
 */
const ReviewForm = ({
  contratoId,
  trabajadorId,
  trabajadorNombre,
  onSuccess,
  onCancel,
  onClose,
}) => {
  const { t } = useTranslation();
  const [calificacion, setCalificacion] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Validación en tiempo real
  const isValid = calificacion > 0 && comentario.trim().length >= 10;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValid) {
      setError(
        t('reviews.validationError') ||
          'Por favor, selecciona una calificación y escribe un comentario (mínimo 10 caracteres)'
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      logger.form('Enviando reseña', {
        contratoId,
        trabajadorId,
        calificacion,
      });

      await reviewService.createReview({
        contratoId,
        trabajadorId,
        calificacion,
        comentario: comentario.trim(),
      });

      logger.form('Reseña creada exitosamente');

      // Callback de éxito
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      logger.error('Error creando reseña:', err);

      // Manejar diferentes tipos de error
      if (err.response?.status === 409) {
        setError(
          t('reviews.alreadyReviewed') ||
            'Ya has dejado una reseña para este contrato'
        );
      } else if (err.response?.status === 403) {
        setError(
          t('reviews.notAuthorized') ||
            'No tienes permiso para dejar una reseña en este contrato'
        );
      } else {
        setError(
          err.response?.data?.message ||
            t('reviews.submitError') ||
            'Error al enviar la reseña. Por favor, intenta de nuevo.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    if (onClose) {
      onClose();
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isFilled =
        hoverRating > 0 ? starValue <= hoverRating : starValue <= calificacion;

      return (
        <button
          key={starValue}
          type="button"
          className={`star-button ${isFilled ? 'filled' : ''}`}
          onClick={() => setCalificacion(starValue)}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
          aria-label={`${starValue} ${starValue === 1 ? 'estrella' : 'estrellas'}`}
        >
          {isFilled ? (
            <Star className="star-icon" />
          ) : (
            <StarOutline className="star-icon" />
          )}
        </button>
      );
    });
  };

  return (
    <div className="review-form-container">
      <div className="review-form-header">
        <div>
          <h2 className="review-form-title">
            {t('reviews.leaveReview') || 'Califica tu Experiencia'}
          </h2>
          <p className="review-form-subtitle">
            {t('reviews.reviewFor') || 'Trabajador'}: <strong>{trabajadorNombre}</strong>
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="close-button"
            aria-label="Cerrar"
          >
            <X />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="review-form">
        {/* Rating Stars */}
        <div className="form-group">
          <label className="form-label">
            {t('reviews.rating') || 'Calificación'}
            <span className="required">*</span>
          </label>
          <div className="stars-container">
            {renderStars()}
            {calificacion > 0 && (
              <span className="rating-text">
                {calificacion} {t('reviews.stars') || 'estrellas'}
              </span>
            )}
          </div>
          <p className="form-help">
            {t('reviews.ratingHelp') || 'Selecciona de 1 a 5 estrellas'}
          </p>
        </div>

        {/* Comentario */}
        <div className="form-group">
          <label htmlFor="comentario" className="form-label">
            {t('reviews.comment') || 'Comentario'}
            <span className="required">*</span>
          </label>
          <textarea
            id="comentario"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className="form-textarea"
            placeholder={
              t('reviews.commentPlaceholder') ||
              'Cuéntanos sobre tu experiencia con este trabajador...'
            }
            rows={5}
            maxLength={500}
            disabled={loading}
          />
          <div className="char-counter">
            {comentario.length}/500 {t('reviews.characters') || 'caracteres'}
            {comentario.trim().length > 0 && comentario.trim().length < 10 && (
              <span className="char-warning">
                {' '}
                ({t('reviews.minChars') || 'Mínimo 10 caracteres'})
              </span>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-cancel"
            disabled={loading}
          >
            {t('common.cancel') || 'Cancelar'}
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={!isValid || loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                {t('reviews.submitting') || 'Enviando...'}
              </>
            ) : (
              <>
                <Send className="icon" />
                {t('reviews.submit') || 'Enviar Reseña'}
              </>
            )}
          </button>
        </div>

        {/* Info note */}
        <p className="info-note">
          {t('reviews.infoNote') ||
            'Tu reseña será pública y ayudará a otros usuarios a tomar mejores decisiones.'}
        </p>
      </form>
    </div>
  );
};

export default ReviewForm;
