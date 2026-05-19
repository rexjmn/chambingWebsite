import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLoaderData } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, SlidersHorizontal, Search, MapPin } from 'lucide-react';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import PlumbingIcon from '@mui/icons-material/Plumbing';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import GrassIcon from '@mui/icons-material/Grass';
import HandymanIcon from '@mui/icons-material/Handyman';
import ConstructionIcon from '@mui/icons-material/Construction';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SecurityIcon from '@mui/icons-material/Security';
import WorkerCard from '../components/WorkerCard';
import { workerService } from '../services/workerService';
import {
  getStoredClientLocation,
  requestClientLocation,
} from '../utils/clientLocation';
import { logger } from '../utils/logger';
import '../styles/services.scss';

const CATEGORIES = [
  { id: 'limpieza_domestica', label: 'Limpieza', icon: CleaningServicesIcon },
  { id: 'plomeria',           label: 'Plomería', icon: PlumbingIcon },
  { id: 'electricidad',       label: 'Electricidad', icon: ElectricBoltIcon },
  { id: 'jardineria',         label: 'Jardinería', icon: GrassIcon },
  { id: 'carpinteria',        label: 'Carpintería', icon: HandymanIcon },
  { id: 'construccion',       label: 'Construcción', icon: ConstructionIcon },
  { id: 'pintura',            label: 'Pintura', icon: FormatPaintIcon },
  { id: 'mecanica',           label: 'Mecánica', icon: DirectionsCarIcon },
  { id: 'catering',           label: 'Cocina', icon: RestaurantIcon },
  { id: 'seguridad',          label: 'Seguridad', icon: SecurityIcon },
];

const CATEGORY_ALIASES = {
  limpieza_domestica: ['limpieza domestica', 'limpieza', 'lavanderia', 'limpieza de oficinas'],
  plomeria: ['plomeria', 'instalacion sanitarios', 'destapes', 'fontaneria'],
  electricidad: ['electricidad', 'instalacion electrica', 'electrico', 'reparacion electrodomesticos'],
  jardineria: ['jardineria', 'jardin', 'paisajismo', 'poda'],
  carpinteria: ['carpinteria', 'muebles', 'ebanisteria'],
  construccion: ['construccion', 'albanileria', 'albanilería', 'obra', 'obras'],
  pintura: ['pintura', 'pintor', 'pintar'],
  mecanica: ['mecanica', 'mecanica automotriz', 'mecánico', 'mecanico'],
  catering: ['cocina', 'catering', 'chef', 'comida'],
  seguridad: ['seguridad', 'vigilancia', 'guardia'],
};

const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const getWorkerSkillNames = (worker) => {
  const source = worker?.skills || worker?.habilidades || [];
  if (!Array.isArray(source)) return [];
  return source
    .map((skill) => {
      if (typeof skill === 'string') return skill;
      return skill?.nombre || skill?.name || '';
    })
    .filter(Boolean)
    .map(normalizeText);
};

const workerMatchesCategory = (worker, categoryId) => {
  if (!categoryId) return true;
  const aliases = CATEGORY_ALIASES[categoryId] || [];
  if (aliases.length === 0) return true;
  const normalizedAliases = aliases.map(normalizeText);
  const skills = getWorkerSkillNames(worker);
  return skills.some((skill) => normalizedAliases.some((alias) => skill.includes(alias) || alias.includes(skill)));
};

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
  const { t } = useTranslation();
  const loaderData = useLoaderData();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('categoria') || '';
  const [workers, setWorkers] = useState(loaderData?.initialWorkers || []);
  const [loading, setLoading] = useState(!loaderData?.initialWorkers?.length);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [clientLocation, setClientLocation] = useState(() => getStoredClientLocation());
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const [searchText, setSearchText] = useState(initialSearch);
  const [committedSearch, setCommittedSearch] = useState(initialSearch);
  const searchDebounce = useRef(null);

  const [filters, setFilters] = useState({
    categoria: initialCategory,
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

  const fetchWorkers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const apiFilters = {
        verificado: true,
        sort: 'relevance',
        departamento: filters.departamento || undefined,
        search: committedSearch.trim() || undefined,
        categoria: filters.categoria || undefined,
        modalidad: filters.modalidad || undefined,
        fecha_inicio: filters.fechaInicio || undefined,
        fecha_fin: filters.fechaFin || undefined,
      };

      if (clientLocation) {
        apiFilters.lat = clientLocation.lat;
        apiFilters.lng = clientLocation.lng;
      }

      const data = await workerService.getVerifiedWorkers(apiFilters);
      const arr =
        data?.status === 'success' ? data.data
        : Array.isArray(data) ? data
        : data?.data || [];

      const filteredByCategory = filters.categoria
        ? arr.filter((worker) => workerMatchesCategory(worker, filters.categoria))
        : arr;

      setWorkers(filteredByCategory);
    } catch (err) {
      logger.error('Error fetching workers:', err);
      setError(err.message || 'No se pudo cargar la lista de profesionales');
    } finally {
      setLoading(false);
    }
  }, [filters, committedSearch, clientLocation]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleUseLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const coords = await requestClientLocation();
      setClientLocation(coords);
    } catch {
      setLocationError(t('servicePage.locationDenied'));
    } finally {
      setLocationLoading(false);
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
      <title>Profesionales | Chambing</title>
      <meta name="description" content="Encuentra trabajadores verificados en El Salvador" />
      <script type="application/ld+json">{JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Chambing',
        description: 'Encuentra trabajadores verificados en El Salvador',
        provider: { '@type': 'Organization', name: 'Chambing', url: 'https://chambing.com' },
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
                (() => {
                  const CategoryIcon = cat.icon;
                  return (
                <button
                  key={cat.id}
                  className={`svc-cat-pill${filters.categoria === cat.id ? ' active' : ''}`}
                  onClick={() => toggleCategory(cat.id)}
                  aria-pressed={filters.categoria === cat.id}
                >
                  <span className="svc-cat-icon" aria-hidden="true">
                    <CategoryIcon fontSize="inherit" />
                  </span>
                  <span>{cat.label}</span>
                </button>
                  );
                })()
              ))}
            </div>
          </nav>

          <div className="svc-location-row">
            <button
              type="button"
              className={`svc-location-btn${clientLocation ? ' active' : ''}`}
              onClick={handleUseLocation}
              disabled={locationLoading}
              aria-pressed={Boolean(clientLocation)}
            >
              <MapPin size={15} aria-hidden="true" />
              {locationLoading
                ? t('servicePage.locationLoading')
                : clientLocation
                  ? t('servicePage.locationActive')
                  : t('servicePage.useLocation')}
            </button>
            {locationError && (
              <span className="svc-location-hint svc-location-hint--error">{locationError}</span>
            )}
            {!locationError && !clientLocation && (
              <span className="svc-location-hint">{t('servicePage.locationHint')}</span>
            )}
          </div>

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
