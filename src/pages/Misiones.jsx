import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Loader, Briefcase } from 'lucide-react';
import { misionService } from '../services/misionService';
import { useAuth } from '../context/AuthContext';
import MisionCard from '../components/misiones/MisionCard';
import { logger } from '../utils/logger';
import '../styles/misiones.scss';

const LIMIT = 12;

export default function Misiones() {
  const { isAuthenticated, user } = useAuth();
  const isCliente = user?.tipo_usuario === 'cliente';

  const [misiones, setMisiones] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMisiones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await misionService.getMisiones({ search, page, limit: LIMIT });
      setMisiones(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      logger.error('Error cargando misiones:', err.message);
      setError('No se pudieron cargar las misiones');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadMisiones();
  }, [loadMisiones]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="misiones-page">
      {/* Hero */}
      <section className="misiones-hero">
        <h1 className="misiones-hero__title">Misión Chambing</h1>
        <p className="misiones-hero__subtitle">
          Proyectos y trabajos publicados por clientes buscando talento
        </p>
        {isAuthenticated && isCliente && (
          <Link to="/misiones/crear" className="misiones-hero__cta">
            <Plus size={18} />
            Publicar Misión
          </Link>
        )}
      </section>

      {/* Filtros */}
      <div className="misiones-filters">
        <div className="misiones-filters__inner">
          <form className="misiones-filters__search" onSubmit={handleSearch}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar misiones..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
          {!loading && (
            <span className="misiones-filters__count">
              {total} misión{total !== 1 ? 'es' : ''} disponible{total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="misiones-grid-section">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            <Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
            <p>Cargando misiones...</p>
          </div>
        ) : error ? (
          <div className="misiones-empty">
            <div className="misiones-empty__icon"><Briefcase size={56} /></div>
            <p className="misiones-empty__title">Error al cargar misiones</p>
            <p className="misiones-empty__text">{error}</p>
            <button
              style={{ padding: '0.75rem 1.5rem', borderRadius: 12, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              onClick={loadMisiones}
            >
              Reintentar
            </button>
          </div>
        ) : misiones.length === 0 ? (
          <div className="misiones-empty">
            <div className="misiones-empty__icon"><Briefcase size={56} /></div>
            <p className="misiones-empty__title">
              {search ? 'Sin resultados' : 'Aún no hay misiones publicadas'}
            </p>
            <p className="misiones-empty__text">
              {search
                ? `No encontramos misiones para "${search}"`
                : 'Sé el primero en publicar una misión de trabajo'}
            </p>
            {isAuthenticated && isCliente && (
              <Link
                to="/misiones/crear"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.75rem 1.5rem', borderRadius: 12, background: '#2563eb', color: '#fff', textDecoration: 'none', fontWeight: 600 }}
              >
                <Plus size={16} />
                Publicar Misión
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="misiones-grid">
              {misiones.map((mision) => (
                <MisionCard
                  key={mision.id}
                  mision={mision}
                  isOwner={isAuthenticated && user?.id === mision.cliente?.id}
                />
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid rgba(0,0,0,0.15)', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                >
                  Anterior
                </button>
                <span style={{ padding: '0.5rem 1rem', color: '#64748b', fontSize: '0.9rem' }}>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid rgba(0,0,0,0.15)', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
