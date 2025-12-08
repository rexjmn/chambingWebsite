import React from 'react';
import { Box } from '@mui/material';
import useIntersectionObserver from '../../hooks/useIntersectionObserver';
import '../../styles/animatedSection.scss';

/**
 * Componente que anima su contenido cuando entra en el viewport
 * Optimizado para performance y accesibilidad
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido a animar
 * @param {string} props.animation - Tipo de animación ('fadeUp', 'fadeIn', 'slideLeft', 'slideRight', 'scale')
 * @param {number} props.delay - Delay de la animación en ms
 * @param {number} props.duration - Duración de la animación en ms
 * @param {Object} props.sx - Estilos adicionales de MUI
 * @param {string} props.className - Clases CSS adicionales
 */
const AnimatedSection = ({
  children,
  animation = 'fadeUp',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  sx = {},
  className = '',
  ...props
}) => {
  const [ref, isVisible] = useIntersectionObserver({
    threshold,
    triggerOnce: true
  });

  // Respetar preferencias de usuario para reducción de movimiento
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <Box
      ref={ref}
      className={`animated-section ${className} ${isVisible ? 'is-visible' : ''} ${
        prefersReducedMotion ? 'no-animation' : `animation-${animation}`
      }`}
      sx={{
        ...sx
      }}
      style={{
        '--animation-delay': `${delay}ms`,
        '--animation-duration': `${duration}ms`
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default AnimatedSection;
