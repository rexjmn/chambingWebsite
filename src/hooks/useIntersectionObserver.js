import { useEffect, useRef, useState } from 'react';

/**
 * Hook personalizado para detectar cuando un elemento entra en el viewport
 * Usado para animaciones de scroll y lazy loading
 *
 * @param {Object} options - Opciones para el IntersectionObserver
 * @param {number} options.threshold - Umbral de visibilidad (0-1)
 * @param {string} options.rootMargin - Margen del root
 * @param {boolean} options.triggerOnce - Si debe dispararse solo una vez
 * @returns {Array} [ref, isVisible] - Referencia y estado de visibilidad
 */
export const useIntersectionObserver = ({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true
} = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const currentRef = ref.current;

    // Si ya se disparó y solo debe dispararse una vez, no hacer nada
    if (hasTriggered && triggerOnce) return;

    // Verificar soporte del navegador
    if (!window.IntersectionObserver) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;

        if (isIntersecting) {
          setIsVisible(true);
          setHasTriggered(true);

          // Si solo debe dispararse una vez, desconectar el observer
          if (triggerOnce && currentRef) {
            observer.unobserve(currentRef);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return [ref, isVisible];
};

export default useIntersectionObserver;
