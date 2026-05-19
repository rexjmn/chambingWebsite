import { describe, it, expect } from 'vitest';
import {
  buildServiceCategories,
  findServiceCategory,
  workerMatchesServiceCategory,
} from './serviceCategoryFilters';

const catalog = [
  { id: 'uuid-construccion', nombre: 'Construcción', activo: true },
  { id: 'uuid-pintura', nombre: 'Pintura', activo: true },
  { id: 'uuid-limpieza', nombre: 'Limpieza Doméstica', activo: true },
];

describe('serviceCategoryFilters', () => {
  it('builds categories with filterParam for API', () => {
    const list = buildServiceCategories(catalog);
    const construccion = list.find((c) => c.id === 'uuid-construccion');
    expect(construccion.filterParam).toBe('construccion');
    expect(construccion.label).toBe('Construcción');
  });

  it('finds category by uuid, slug or nombre', () => {
    const list = buildServiceCategories(catalog);
    expect(findServiceCategory('uuid-pintura', list)?.nombre).toBe('Pintura');
    expect(findServiceCategory('pintura', list)?.id).toBe('uuid-pintura');
    expect(findServiceCategory('construccion', list)?.id).toBe('uuid-construccion');
  });

  it('matches workers by skill names', () => {
    const list = buildServiceCategories(catalog);
    const pintura = list.find((c) => c.nombre === 'Pintura');
    const worker = { habilidades: [{ nombre: 'Pintura de paredes' }] };
    expect(workerMatchesServiceCategory(worker, pintura)).toBe(true);
  });
});
