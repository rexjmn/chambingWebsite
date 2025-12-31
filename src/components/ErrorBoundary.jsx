import React from 'react';
import { logger } from '../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to our logger service
    logger.error('Error capturado por ErrorBoundary:', error.message, {
      componentStack: errorInfo.componentStack,
      error: error.toString()
    });

    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem'
          }}>
            ⚠️
          </div>
          <h2 style={{ marginBottom: '1rem' }}>
            {this.props.title || 'Algo salió mal'}
          </h2>
          <p style={{
            color: '#666',
            marginBottom: '2rem',
            maxWidth: '500px'
          }}>
            {this.props.message || 'Ha ocurrido un error inesperado. Por favor, intenta recargar la página.'}
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginBottom: '2rem',
              padding: '1rem',
              background: '#f5f5f5',
              borderRadius: '8px',
              maxWidth: '600px',
              textAlign: 'left'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Detalles del error (solo en desarrollo)
              </summary>
              <pre style={{
                fontSize: '0.875rem',
                overflow: 'auto',
                padding: '1rem',
                background: '#fff',
                borderRadius: '4px'
              }}>
                {this.state.error.toString()}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              Intentar de nuevo
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f5f5f5',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
