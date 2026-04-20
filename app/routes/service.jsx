import Service from '../../src/pages/Service';

const API = process.env.API_INTERNAL_URL || 'http://localhost:3000/api';

// Corre en el servidor — pre-carga la lista inicial de trabajadores sin filtros
export async function loader() {
  try {
    const res = await fetch(`${API}/users/workers?page=1&limit=20`);
    if (!res.ok) return { initialWorkers: [] };
    const data = await res.json();
    return { initialWorkers: data.data ?? data.workers ?? [] };
  } catch {
    return { initialWorkers: [] };
  }
}

export default Service;
