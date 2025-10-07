// src/pages/Services.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkerCard from '../components/WorkerCard';
import '../styles/services.scss';

const Service = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    categoria: '',
    departamento: '',
    search: ''
  });

  // Cargar trabajadores al montar el componente
  useEffect(() => {
    fetchWorkers();
  }, [filters]);

 const fetchWorkers = async () => {
  try {
    setLoading(true);
    setError(null);

   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    // Construir query params
    const params = new URLSearchParams({
      tipo_usuario: 'trabajador',
      verificado: 'true',
    });

    // Agregar filtros opcionales
    if (filters.departamento) {
      params.append('departamento', filters.departamento);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.categoria) {
      params.append('categoria', filters.categoria);
    }

     const url = `${API_BASE_URL}/users/workers?${params.toString()}`;
    
    console.log('📡 Fetching workers from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error('Error al cargar trabajadores');
    }

    const data = await response.json();
    console.log('✅ Response data:', data);
    
    // ⬅️ MANEJAR AMBOS FORMATOS DE RESPUESTA
    let workersArray = [];
    
    if (data.status === 'success' && data.data) {
      // Formato con wrapper: { status: 'success', data: [...] }
      workersArray = data.data;
    } else if (Array.isArray(data)) {
      // Formato directo: [...]
      workersArray = data;
    } else if (data.data && Array.isArray(data.data)) {
      // Otro formato posible
      workersArray = data.data;
    }
    
    console.log('👥 Workers array:', workersArray);
    console.log('📊 Workers count:', workersArray.length);
    
    setWorkers(workersArray);
    
  } catch (err) {
    console.error('❌ Error fetching workers:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  // Manejar click en una tarjeta
  const handleCardClick = (workerId) => {
    navigate(`/profile/${workerId}`);
  };

  // Manejar cambios en filtros
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      categoria: '',
      departamento: '',
      search: ''
    });
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
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Encuentra Profesionales</h1>
          <p className="page-subtitle">
            Conecta con trabajadores verificados y confiables
          </p>
        </div>

        {/* Filtros */}
        <div className="filters-section">
          <div className="filters-grid">
            {/* Búsqueda por texto */}
            <div className="filter-item">
              <input
                type="text"
                placeholder="Buscar por nombre o habilidad..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="filter-input"
              />
            </div>

            {/* Filtro por categoría */}
            <div className="filter-item">
              <select
                value={filters.categoria}
                onChange={(e) => handleFilterChange('categoria', e.target.value)}
                className="filter-select"
              >
                <option value="">Todas las categorías</option>
                <option value="construccion">Construcción</option>
                <option value="limpieza">Limpieza</option>
                <option value="jardineria">Jardinería</option>
                <option value="plomeria">Plomería</option>
                <option value="electricidad">Electricidad</option>
                <option value="carpinteria">Carpintería</option>
              </select>
            </div>

            {/* Filtro por departamento */}
            <div className="filter-item">
              <select
                value={filters.departamento}
                onChange={(e) => handleFilterChange('departamento', e.target.value)}
                className="filter-select"
              >
                <option value="">Todos los departamentos</option>
                <option value="Ahuachapán">Ahuachapán</option>
                <option value="Cabañas">Cabañas</option>
                <option value="Chalatenango">Chalatenango</option>
                <option value="Cuscatlán">Cuscatlán</option>
                <option value="La Libertad">La Libertad</option>
                <option value="La Paz">La Paz</option>
                <option value="La Unión">La Unión</option>
                <option value="Morazán">Morazán</option>
                <option value="San Miguel">San Miguel</option>
                <option value="San Salvador">San Salvador</option>
                <option value="San Vicente">San Vicente</option>
                <option value="Santa Ana">Santa Ana</option>
                <option value="Sonsonate">Sonsonate</option>
                <option value="Usulután">Usulután</option>
              </select>
            </div>

            {/* Botón limpiar filtros */}
            {(filters.search || filters.categoria || filters.departamento) && (
              <button onClick={clearFilters} className="clear-filters-btn">
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Resultados */}
        <div className="results-section">
          <div className="results-header">
            <h2 className="results-count">
              {workers.length} {workers.length === 1 ? 'profesional encontrado' : 'profesionales encontrados'}
            </h2>
          </div>

          {/* Grid de tarjetas */}
          {workers.length > 0 ? (
            <div className="workers-grid">
              {workers.map(worker => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  onCardClick={handleCardClick}
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