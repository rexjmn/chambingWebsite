import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import WorkerCard from '../components/WorkerCard';
import '../styles/services.scss';

const Service = () => {
  const { t } = useTranslation();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    categoria: '',
    departamento: '',
    search: ''
  });

  // Lista de categorías disponibles
  const categories = [
    { id: '', name: t('services.filters.selectCategory'), icon: '🔍' },
    { id: 'limpieza_domestica', name: t('services.categories.domesticCleaning'), icon: '🧹' },
    { id: 'plomeria', name: t('services.categories.plumbing'), icon: '🔧' },
    { id: 'electricidad', name: t('services.categories.electricity'), icon: '⚡' },
    { id: 'jardineria', name: t('services.categories.gardening'), icon: '🌱' },
    { id: 'carpinteria', name: t('services.categories.carpentry'), icon: '🪚' },
    { id: 'construccion', name: t('services.categories.construction'), icon: '🏗️' },
    { id: 'pintura', name: t('services.categories.painting'), icon: '🎨' },
    { id: 'mecanica', name: t('services.categories.mechanics'), icon: '🚗' },
    { id: 'catering', name: t('services.categories.catering'), icon: '🍽️' },
    { id: 'seguridad', name: t('services.categories.security'), icon: '🛡️' }
  ];

  // Lista de departamentos de El Salvador
  const departments = [
    { id: '', name: t('services.filters.selectDepartment') },
    { id: 'ahuachapan', name: t('departments.ahuachapan') },
    { id: 'cabanas', name: t('departments.cabanas') },
    { id: 'chalatenango', name: t('departments.chalatenango') },
    { id: 'cuscatlan', name: t('departments.cuscatlan') },
    { id: 'la_libertad', name: t('departments.laLibertad') },
    { id: 'la_paz', name: t('departments.laPaz') },
    { id: 'la_union', name: t('departments.laUnion') },
    { id: 'morazan', name: t('departments.morazan') },
    { id: 'san_miguel', name: t('departments.sanMiguel') },
    { id: 'san_salvador', name: t('departments.sanSalvador') },
    { id: 'san_vicente', name: t('departments.sanVicente') },
    { id: 'santa_ana', name: t('departments.santaAna') },
    { id: 'sonsonate', name: t('departments.sonsonate') },
    { id: 'usulutan', name: t('departments.usulutan') }
  ];

  useEffect(() => {
    fetchWorkers();
  }, [filters]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const params = new URLSearchParams({
        tipo_usuario: 'trabajador',
        verificado: 'true',
      });

      if (filters.departamento) params.append('departamento', filters.departamento);
      if (filters.search) params.append('search', filters.search);
      if (filters.categoria) params.append('categoria', filters.categoria);

      const url = `${API_BASE_URL}/users/workers?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(t('services.error'));
      }

      const data = await response.json();

      let workersArray = [];
      if (data.status === 'success' && data.data) {
        workersArray = data.data;
      } else if (Array.isArray(data)) {
        workersArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        workersArray = data.data;
      }

      setWorkers(workersArray);

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const clearFilters = () => {
    setFilters({ categoria: '', departamento: '', search: '' });
  };

  const hasActiveFilters = filters.categoria || filters.departamento || filters.search;

  // SEO Schema para Rich Snippets
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "ChambingApp",
    "description": t('services.metaDescription'),
    "provider": {
      "@type": "Organization",
      "name": "ChambingApp",
      "url": "https://chambingapp.com"
    },
    "areaServed": {
      "@type": "Country",
      "name": "El Salvador"
    },
    "serviceType": [
      t('services.categories.domesticCleaning'),
      t('services.categories.plumbing'),
      t('services.categories.electricity'),
      t('services.categories.gardening')
    ]
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>{t('services.loading')} | ChambingApp</title>
        </Helmet>
        <div className="services-page">
          <div className="container">
            <div className="loading-state">
              <div className="spinner-container">
                <div className="spinner"></div>
                <div className="spinner-glow"></div>
              </div>
              <h3>{t('services.loading')}</h3>
              <p>{t('services.loadingProfessionals')}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>{t('services.error')} | ChambingApp</title>
        </Helmet>
        <div className="services-page">
          <div className="container">
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h2>{t('services.error')}</h2>
              <p>{error}</p>
              <button onClick={fetchWorkers} className="retry-btn">
                {t('services.retryButton')}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('services.metaTitle')}</title>
        <meta name="description" content={t('services.metaDescription')} />
        <meta property="og:title" content={t('services.metaTitle')} />
        <meta property="og:description" content={t('services.metaDescription')} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('services.metaTitle')} />
        <meta name="twitter:description" content={t('services.metaDescription')} />
        <link rel="canonical" href="https://chambingapp.com/services" />
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      </Helmet>

      <div className="services-page">
        <div className="container">
          {/* Hero Header */}
          <div className="page-header">
            <div className="header-content">
              <h1 className="page-title">{t('services.pageTitle')}</h1>
              <p className="page-subtitle">{t('services.pageSubtitle')}</p>
            </div>

            {/* Trust Badges */}
            <div className="trust-badges">
              <div className="trust-badge">
                <span className="badge-icon">✓</span>
                <span className="badge-text">{t('services.trustBadges.verified')}</span>
              </div>
              <div className="trust-badge">
                <span className="badge-icon">🛡️</span>
                <span className="badge-text">{t('services.trustBadges.backgroundCheck')}</span>
              </div>
              <div className="trust-badge">
                <span className="badge-icon">⭐</span>
                <span className="badge-text">{t('services.trustBadges.topRated')}</span>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="filters-section">
            <h2 className="filters-title">{t('services.filters.title')}</h2>

            <div className="filters-grid">
              {/* Search Input */}
              <div className="filter-item filter-search">
                <div className="input-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder={t('services.filters.searchPlaceholder')}
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="filter-item">
                <select
                  className="filter-select"
                  value={filters.categoria}
                  onChange={(e) => handleFilterChange('categoria', e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div className="filter-item">
                <select
                  className="filter-select"
                  value={filters.departamento}
                  onChange={(e) => handleFilterChange('departamento', e.target.value)}
                >
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button onClick={clearFilters} className="clear-filters-btn">
                  <span>✕</span> {t('services.filters.clearFilters')}
                </button>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="results-section">
            <div className="results-header">
              <h2 className="results-count">
                <span className="count-number">{workers.length}</span>{' '}
                {workers.length === 1
                  ? t('services.results.foundSingular')
                  : t('services.results.found')
                }
              </h2>

              {hasActiveFilters && (
                <div className="active-filters-indicator">
                  <span className="filter-badge">🔍 {t('services.filters.title')}</span>
                </div>
              )}
            </div>

            {workers.length > 0 ? (
              <div className="workers-grid">
                {workers.map(worker => (
                  <WorkerCard
                    key={worker.id}
                    worker={worker}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-illustration">
                  <span className="empty-icon">🔍</span>
                  <div className="empty-bg-circle"></div>
                </div>
                <h3>{t('services.results.noResults')}</h3>
                <p>{t('services.results.noResultsDescription')}</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="view-all-btn">
                    {t('services.results.viewAll')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Service;
