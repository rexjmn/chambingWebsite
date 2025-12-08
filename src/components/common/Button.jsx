import React from 'react';
import '../../styles/button.scss';

const Button = ({
  children,
  variant = 'contained',
  size = 'medium',
  className = '',
  onClick,
  disabled = false,
  fullWidth = false,
  type = 'button',
  ...props
}) => {
  const getButtonClasses = () => {
    const classes = ['custom-btn'];

    // Variant classes
    if (variant === 'contained') {
      classes.push('custom-btn-contained');
    } else if (variant === 'outlined') {
      classes.push('custom-btn-outlined');
    } else if (variant === 'text') {
      classes.push('custom-btn-text');
    }

    // Size classes
    if (size === 'large') {
      classes.push('custom-btn-large');
    } else if (size === 'small') {
      classes.push('custom-btn-small');
    }

    // Full width
    if (fullWidth) {
      classes.push('custom-btn-fullwidth');
    }

    // Disabled
    if (disabled) {
      classes.push('custom-btn-disabled');
    }

    // Custom className
    if (className) {
      classes.push(className);
    }

    return classes.join(' ');
  };

  return (
    <button
      type={type}
      className={getButtonClasses()}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
