import React from 'react';
import '../../styles/chip.scss';

const Chip = ({
  label,
  onClick,
  size = 'medium',
  className = '',
  variant = 'default',
  ...props
}) => {
  const getChipClasses = () => {
    const classes = ['custom-chip'];

    // Size classes
    if (size === 'small') {
      classes.push('custom-chip-small');
    } else if (size === 'large') {
      classes.push('custom-chip-large');
    }

    // Variant classes
    if (variant) {
      classes.push(`custom-chip-${variant}`);
    }

    // Clickable
    if (onClick) {
      classes.push('custom-chip-clickable');
    }

    // Custom className
    if (className) {
      classes.push(className);
    }

    return classes.join(' ');
  };

  // FORZAR estilos inline para prevenir tema oscuro del navegador
  const getInlineStyles = () => {
    const baseStyles = {
      colorScheme: 'light',
      WebkitColorScheme: 'light',
    };

    // Estilos por variante
    const variantStyles = {
      trending: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
        color: '#DC2626',
      },
      urgent: {
        borderColor: '#F59E0B',
        backgroundColor: '#FFFBEB',
        color: '#D97706',
      },
      popular: {
        borderColor: '#233DFF',
        backgroundColor: '#E8EBFF',
        color: '#233DFF',
      },
      seasonal: {
        borderColor: '#10B981',
        backgroundColor: '#ECFDF5',
        color: '#059669',
      },
      default: {
        borderColor: '#E5E7EB',
        backgroundColor: '#FAFAFB',
        color: '#374151',
      },
    };

    return {
      ...baseStyles,
      ...(variantStyles[variant] || variantStyles.default),
    };
  };

  return (
    <div
      className={getChipClasses()}
      style={getInlineStyles()}
      onClick={onClick}
      role={onClick ? 'button' : 'status'}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          onClick();
        }
      }}
      {...props}
    >
      {label}
    </div>
  );
};

export default Chip;
