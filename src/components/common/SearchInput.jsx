import React from 'react';
import '../../styles/searchInput.scss';

const SearchInput = ({
  value,
  onChange,
  placeholder = 'Buscar...',
  onSubmit,
  startIcon,
  endButton,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`search-input-form ${fullWidth ? 'fullwidth' : ''} ${className}`}>
      <div className="search-input-wrapper">
        {startIcon && (
          <div className="search-input-icon-start">
            {startIcon}
          </div>
        )}

        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="search-input-field"
          {...props}
        />

        {endButton && (
          <div className="search-input-icon-end">
            {endButton}
          </div>
        )}
      </div>
    </form>
  );
};

export default SearchInput;
