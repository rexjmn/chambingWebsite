
import React, { useState, useEffect } from 'react';
import WorkerCard from '../components/WorkerCard';
import '../styles/services.scss';

const Service = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    categoria: '',
    departamento: '',
    search: ''
  });

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

      console.log('📡 Fetching from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Error al cargar trabajadores');
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

      console.log('✅ Workers loaded:', workersArray.length);
      
      // 🔍 DEBUG: Ver IDs de los trabajadores
      if (workersArray.length > 0) {
        console.log('🔍 First worker:', workersArray[0]);
        console.log('🔍 First worker ID:', workersArray[0].id);
        console.log('🔍 ID type:', typeof workersArray[0].id);
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

  if (loading) {
    return (
      <div className="services-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando profesionales...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="services-page">
        <div className="container">
          <div className="error-state">
            <h2>Error al cargar los datos</h2>
            <p>{error}</p>
            <button onClick={fetchWorkers} className="retry-btn">
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="services-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Encuentra Profesionales</h1>
          <p className="page-subtitle">
            Conecta con trabajadores verificados y confiables
          </p>
        </div>

        {/* Filtros - mismo código */}
        <div className="filters-section">
          {/* ... tu código de filtros ... */}
        </div>

        {/* Grid de tarjetas */}
        <div className="results-section">
          <div className="results-header">
            <h2 className="results-count">
              {workers.length} {workers.length === 1 ? 'profesional encontrado' : 'profesionales encontrados'}
            </h2>
          </div>

          {workers.length > 0 ? (
            <div className="workers-grid">
              {workers.map(worker => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  // ❌ Ya no pasas onCardClick
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No se encontraron profesionales</h3>
              <p>Intenta ajustar tus filtros de búsqueda</p>
              <button onClick={clearFilters} className="clear-filters-btn">
                Ver todos los profesionales
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Service;
