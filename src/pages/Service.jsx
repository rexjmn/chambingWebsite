import React, { useState, useEffect, useRef } from 'react';
import { useLoaderData } from 'react-router';
import { X, SlidersHorizontal, Search } from 'lucide-react';
import WorkerCard from '../components/WorkerCard';
import { logger } from '../utils/logger';
import '../styles/services.scss';

const CATEGORIES = [
  { id: 'limpieza_domestica', label: 'Limpieza', icon: '🧹' },
  { id: 'plomeria',           label: 'Plomería',    icon: '🔧' },
  { id: 'electricidad',       label: 'Electricidad', icon: '⚡' },
  { id: 'jardineria',         label: 'Jardinería',  icon: '🌿' },
  { id: 'carpinteria',        label: 'Carpintería', icon: '🪚' },
  { id: 'construccion',       label: 'Construcción', icon: '🏗️' },
  { id: 'pintura',            label: 'Pintura',     icon: '🖌️' },
  { id: 'mecanica',           label: 'Mecánica',    icon: '🚗' },
  { id: 'catering',           label: 'Cocina',      icon: '🍳' },
  { id: 'seguridad',          label: 'Seguridad',   icon: '🛡️' },
];

const DEPARTMENTS = [
  { id: '', name: 'Cualquier lugar' },
  { id: 'ahuachapan',   name: 'Ahuachapán' },
  { id: 'cabanas',      name: 'Cabañas' },
  { id: 'chalatenango', name: 'Chalatenango' },
  { id: 'cuscatlan',    name: 'Cuscatlán' },
  { id: 'la_libertad',  name: 'La Libertad' },
  { id: 'la_paz',       name: 'La Paz' },
  { id: 'la_union',     name: 'La Unión' },
  { id: 'morazan',      name: 'Morazán' },
  { id: 'san_miguel',   name: 'San Miguel' },
  { id: 'san_salvador', name: 'San Salvador' },
  { id: 'san_vicente',  name: 'San Vicente' },
  { id: 'santa_ana',    name: 'Santa Ana' },
  { id: 'sonsonate',    name: 'Sonsonate' },
  { id: 'usulutan',     name: 'Usulután' },
];

const MODALITIES = [
  { id: '', name: 'Cualquier modalidad' },
  { id: 'hora',     name: 'Por hora' },
  { id: 'dia',      name: 'Por día' },
  { id: 'semana',   name: 'Por semana' },
  { id: 'mes',      name: 'Por mes' },
  { id: 'proyecto', name: 'Por proyecto' },
];

const Service = () => {
  const loaderData = useLoaderData();
  const [workers, setWorkers] = useState(loaderData?.initialWorkers || []);
  const [loading, setLoading] = useState(!loaderData?.initialWorkers?.length);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const searchDebounce = useRef(null);

  const [filters, setFilters] = useState({
    categoria: '',
    departamento: '',
    modalidad: '',
    fechaInicio: '',
    fechaFin: '',
  });

  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setCommittedSearch(searchText), 420);
    return () => clearTimeout(searchDebounce.current);
  }, [searchText]);

  useEffect(() => {
    fetchWorkers();
  }, [filters, committedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const params = new URLSearchParams({ tipo_usuario: 'trabajador', verificado: 'true' });

      if (filters.departamento) params.append('departamento', filters.departamento);
      if (committedSearch.trim()) params.append('search', committedSearch.trim());
      if (filters.categoria)    params.append('categoria', filters.categoria);
      if (filters.fechaInicio)  params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin)     params.append('fechaFin', filters.fechaFin);
      if (filters.modalidad)    params.append('modalidad', filters.modalidad);

      const response = await fetch(`${API_BASE_URL}/users/workers?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('No se pudo cargar la lista de profesionales');

      const data = await response.json();
      const arr = data.status === 'success' ? data.data
        : Array.isArray(data) ? data
        : data.data || [];
      setWorkers(arr);
    } catch (err) {
      logger.error('Error fetching workers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (catId) =>
    setFilters(prev => ({ ...prev, categoria: prev.categoria === catId ? '' : catId }));

  const setFilter = (key, value) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const removeFilter = (key) => {
    if (key === 'search') {
      setSearchText('');
      setCommittedSearch('');
    } else {
      setFilters(prev => ({ ...prev, [key]: '' }));
    }
  };

  const clearAll = () => {
    setSearchText('');
    setCommittedSearch('');
    setFilters({ categoria: '', departamento: '', modalidad: '', fechaInicio: '', fechaFin: '' });
  };

  const chips = [
    filters.categoria    && { key: 'categoria',    label: CATEGORIES.find(c => c.id === filters.categoria)?.label },
    filters.departamento && { key: 'departamento', label: DEPARTMENTS.find(d => d.id === filters.departamento)?.name },
    filters.modalidad    && { key: 'modalidad',    label: MODALITIES.find(m => m.id === filters.modalidad)?.name },
    filters.fechaInicio  && { key: 'fechaInicio',  label: `Desde ${new Date(filters.fechaInicio).toLocaleDateString('es-SV', { month: 'short', day: 'numeric' })}` },
    committedSearch      && { key: 'search',       label: `"${committedSearch}"` },
  ].filter(Boolean);

  const advancedCount = [filters.departamento, filters.modalidad, filters.fechaInicio].filter(Boolean).length;

  return (
    <>
      <title>Profesionales | ChambingApp</title>
      <meta name="description" content="Encuentra trabajadores verificados en El Salvador" />
      <script type="application/ld+json">{JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'ChambingApp',
        description: 'Encuentra trabajadores verificados en El Salvador',
        provider: { '@type': 'Organization', name: 'ChambingApp', url: 'https://chambing.com' },
        areaServed: { '@type': 'Country', name: 'El Salvador' },
      })}</script>

      <div className="services-page">
        <div className="svc-container">

          {/* Header */}
          <header className="svc-header">
            <h1>Encuentra la persona<br />que necesitas</h1>
            <p>Trabajadores verificados en El Salvador, listos para chambear</p>
          </header>

          {/* Search */}
          <div className="svc-search-wrap">
            <Search size={18} className="svc-search-icon" aria-hidden="true" />
            <input
              className="svc-search-input"
              type="text"
              placeholder="Busca por nombre o tipo de trabajo…"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              aria-label="Buscar profesional"
            />
            {searchText && (
              <button
                className="svc-search-clear"
                onClick={() => { setSearchText(''); setCommittedSearch(''); }}
                aria-label="Borrar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category pills */}
          <nav className="svc-categories" aria-label="Categorías de servicio">
            <div className="svc-cat-scroll">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`svc-cat-pill${filters.categoria === cat.id ? ' active' : ''}`}
                  onClick={() => toggleCategory(cat.id)}
                  aria-pressed={filters.categoria === cat.id}
                >
                  <span className="svc-cat-icon" aria-hidden="true">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Advanced filters toggle */}
          <div className="svc-adv-toggle">
            <button
              className={`svc-adv-btn${showAdvanced ? ' open' : ''}`}
              onClick={() => setShowAdvanced(v => !v)}
              aria-expanded={showAdvanced}
            >
              <SlidersHorizontal size={15} aria-hidden="true" />
              Más filtros
              {advancedCount > 0 && (
                <span className="svc-adv-count" aria-label={`${advancedCount} filtros activos`}>
                  {advancedCount}
                </span>
              )}
            </button>
          </div>

          {/* Advanced filters panel */}
          {showAdvanced && (
            <div className="svc-adv-panel">
              <div className="svc-adv-grid">
                <div className="svc-adv-field">
                  <label htmlFor="filter-dept">Departamento</label>
                  <select
                    id="filter-dept"
                    value={filters.departamento}
                    onChange={e => setFilter('departamento', e.target.value)}
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="svc-adv-field">
                  <label htmlFor="filter-mod">Modalidad de trabajo</label>
                  <select
                    id="filter-mod"
                    value={filters.modalidad}
                    onChange={e => setFilter('modalidad', e.target.value)}
                  >
                    {MODALITIES.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="svc-adv-field">
                  <label htmlFor="filter-start">Disponible desde</label>
                  <input
                    id="filter-start"
                    type="datetime-local"
                    value={filters.fechaInicio}
                    onChange={e => setFilter('fechaInicio', e.target.value)}
                  />
                </div>

                <div className="svc-adv-field">
                  <label htmlFor="filter-end">Disponible hasta <span className="svc-optional">(opcional)</span></label>
                  <input
                    id="filter-end"
                    type="datetime-local"
                    value={filters.fechaFin}
                    onChange={e => setFilter('fechaFin', e.target.value)}
                    min={filters.fechaInicio || undefined}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active filter chips */}
          {chips.length > 0 && (
            <div className="svc-chips" aria-label="Filtros activos">
              {chips.map(chip => (
                <button
                  key={chip.key}
                  className="svc-chip"
                  onClick={() => removeFilter(chip.key)}
                  aria-label={`Quitar filtro: ${chip.label}`}
                >
                  {chip.label}
                  <X size={12} aria-hidden="true" />
                </button>
              ))}
              {chips.length > 1 && (
                <button className="svc-chip svc-chip-clear" onClick={clearAll}>
                  Limpiar todo
                </button>
              )}
            </div>
          )}

          {/* Results */}
          <section className={`svc-results${loading ? ' is-loading' : ''}`} aria-live="polite" aria-busy={loading}>
            {error ? (
              <div className="svc-error">
                <p>Algo salió mal al cargar los profesionales.</p>
                <button onClick={fetchWorkers} className="svc-retry-btn">Reintentar</button>
              </div>
            ) : (
              <>
                <div className="svc-results-meta">
                  <span className="svc-results-count">
                    {loading ? 'Buscando…' : `${workers.length} profesional${workers.length !== 1 ? 'es' : ''}`}
                  </span>
                  {!loading && chips.length > 0 && (
                    <span className="svc-results-label">con filtros activos</span>
                  )}
                </div>

                {!loading && workers.length === 0 ? (
                  <div className="svc-empty">
                    <p>No encontramos profesionales con esos filtros.</p>
                    {chips.length > 0 && (
                      <button onClick={clearAll} className="svc-empty-btn">
                        Ver todos los profesionales
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="svc-grid">
                    {workers.map(worker => (
                      <WorkerCard key={worker.id} worker={worker} />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

        </div>
      </div>
    </>
  );
};

export default Service;
