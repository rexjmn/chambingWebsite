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

  return (
    <div
      className={getChipClasses()}
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
