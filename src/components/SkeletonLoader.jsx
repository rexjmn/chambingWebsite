import React from 'react';
import '../styles/components/SkeletonLoader.scss';

// Componente base de skeleton
const SkeletonBase = ({ className = '', style = {} }) => (
  <div className={`skeleton ${className}`} style={style} aria-hidden="true"></div>
);

// Skeleton para el header
export const SkeletonHeader = () => (
  <header className="skeleton-header">
    <div className="skeleton-header__toolbar">
      <SkeletonBase className="skeleton-header__title" style={{ width: '250px', height: '28px' }} />
      <div className="skeleton-header__actions">
        <SkeletonBase className="skeleton-header__icon" />
        <SkeletonBase className="skeleton-header__icon" />
        <SkeletonBase className="skeleton-header__icon" />
      </div>
    </div>
  </header>
);

// Skeleton para la tarjeta de perfil
export const SkeletonProfileCard = () => (
  <article className="skeleton-profile-card">
    <SkeletonBase className="skeleton-profile-card__cover" />
    
    <div className="skeleton-profile-card__content">
      <div className="skeleton-profile-card__grid">
        <div className="skeleton-profile-card__avatar-container">
          <SkeletonBase className="skeleton-profile-card__avatar" />
        </div>
        
        <div className="skeleton-profile-card__details">
          <SkeletonBase style={{ width: '60%', height: '32px', marginBottom: '12px' }} />
          <SkeletonBase style={{ width: '40%', height: '20px', marginBottom: '16px' }} />
          <SkeletonBase style={{ width: '80%', height: '16px', marginBottom: '8px' }} />
          <SkeletonBase style={{ width: '70%', height: '16px', marginBottom: '20px' }} />
          
          <div className="skeleton-profile-card__actions">
            <SkeletonBase style={{ width: '120px', height: '36px' }} />
            <SkeletonBase style={{ width: '160px', height: '36px' }} />
          </div>
          
          <div className="skeleton-profile-card__chips">
            <SkeletonBase style={{ width: '100px', height: '28px', borderRadius: '14px' }} />
            <SkeletonBase style={{ width: '140px', height: '28px', borderRadius: '14px' }} />
            <SkeletonBase style={{ width: '120px', height: '28px', borderRadius: '14px' }} />
          </div>
        </div>
      </div>
    </div>
  </article>
);

// Skeleton para las tarjetas de estadísticas
export const SkeletonStatsCard = () => (
  <div className="skeleton-stats-card">
    <SkeletonBase className="skeleton-stats-card__icon" />
    <div className="skeleton-stats-card__content">
      <SkeletonBase style={{ width: '60px', height: '32px', marginBottom: '8px' }} />
      <SkeletonBase style={{ width: '100%', height: '20px' }} />
    </div>
  </div>
);

// Skeleton para las tarjetas de servicios
export const SkeletonServiceCard = () => (
  <div className="skeleton-service-card">
    <SkeletonBase style={{ width: '70%', height: '24px', marginBottom: '12px' }} />
    <SkeletonBase style={{ width: '100%', height: '16px', marginBottom: '8px' }} />
    <SkeletonBase style={{ width: '90%', height: '16px', marginBottom: '20px' }} />
    <SkeletonBase style={{ width: '120px', height: '36px' }} />
  </div>
);

// Skeleton para las tarjetas de contratos
export const SkeletonContractCard = () => (
  <div className="skeleton-contract-card">
    <div className="skeleton-contract-card__header">
      <SkeletonBase style={{ width: '140px', height: '24px' }} />
      <SkeletonBase style={{ width: '100px', height: '24px', borderRadius: '12px' }} />
    </div>
    
    <div className="skeleton-contract-card__details">
      <SkeletonBase style={{ width: '70%', height: '20px', marginBottom: '12px' }} />
      <SkeletonBase style={{ width: '50%', height: '20px', marginBottom: '12px' }} />
      <SkeletonBase style={{ width: '60%', height: '20px' }} />
    </div>
    
    <div className="skeleton-contract-card__actions">
      <SkeletonBase style={{ width: '100px', height: '36px' }} />
      <SkeletonBase style={{ width: '130px', height: '36px' }} />
    </div>
  </div>
);

// Skeleton completo del Dashboard
export const DashboardSkeleton = () => (
  <div className="dashboard-skeleton">
    <SkeletonHeader />
    
    <main className="dashboard-skeleton__container">
      <SkeletonProfileCard />
      
      <section className="dashboard-skeleton__stats">
        {[...Array(4)].map((_, i) => (
          <SkeletonStatsCard key={i} />
        ))}
      </section>
      
      <section className="dashboard-skeleton__section">
        <SkeletonBase style={{ width: '200px', height: '28px', marginBottom: '24px' }} />
        <div className="dashboard-skeleton__services">
          {[...Array(6)].map((_, i) => (
            <SkeletonServiceCard key={i} />
          ))}
        </div>
      </section>
      
      <section className="dashboard-skeleton__section">
        <div className="dashboard-skeleton__section-header">
          <SkeletonBase style={{ width: '180px', height: '28px' }} />
          <SkeletonBase style={{ width: '120px', height: '36px' }} />
        </div>
        <div className="dashboard-skeleton__contracts">
          {[...Array(3)].map((_, i) => (
            <SkeletonContractCard key={i} />
          ))}
        </div>
      </section>
    </main>
  </div>
);

// Ejemplo de uso en el componente
const SkeletonLoaderDemo = () => {
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Contenido cargado</h2>
      <p>El skeleton loader ha sido reemplazado por el contenido real.</p>
      <button 
        onClick={() => setLoading(true)}
        style={{
          marginTop: '1rem',
          padding: '0.75rem 1.5rem',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Volver a cargar skeleton
      </button>
    </div>
  );
};

export default SkeletonLoaderDemo;