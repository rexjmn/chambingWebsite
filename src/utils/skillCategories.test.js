import { describe, it, expect } from 'vitest';
import {
  resolveSkillCategoryId,
  getSkillCategoryLabel,
  getCategoriesWithSkills,
  groupSkillsByCategory,
} from './skillCategories';

describe('skillCategories', () => {
  it('resolves category labels to ids', () => {
    expect(resolveSkillCategoryId('Limpieza')).toBe('limpieza_domestica');
    expect(resolveSkillCategoryId('')).toBe('__otros__');
  });

  it('groups skills and lists categories with items', () => {
    const skills = [
      { id: '1', nombre: 'A', categoria: 'Limpieza' },
      { id: '2', nombre: 'B', categoria: 'Plomería' },
      { id: '3', nombre: 'C', categoria: 'Limpieza' },
    ];
    const groups = groupSkillsByCategory(skills);
    expect(groups.get('limpieza_domestica')).toHaveLength(2);
    const cats = getCategoriesWithSkills(skills);
    expect(cats.some((c) => c.id === 'limpieza_domestica')).toBe(true);
    expect(getSkillCategoryLabel('plomeria')).toBe('Plomería');
  });
});
