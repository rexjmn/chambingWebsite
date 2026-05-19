import { describe, it, expect } from 'vitest';
import {
  resolveSkillCategoryId,
  resolveSkillCategoryFromSkill,
  getSkillCategoryLabel,
  getCategoriesWithSkills,
  groupSkillsByCategory,
  SIN_CATEGORIA_ID,
} from './skillCategories';

describe('skillCategories', () => {
  it('resolves category labels and slugs to trade ids', () => {
    expect(resolveSkillCategoryId('Limpieza')).toBe('limpieza_domestica');
    expect(resolveSkillCategoryId('Limpieza Doméstica')).toBe('limpieza_domestica');
    expect(resolveSkillCategoryId('limpieza-domestica')).toBe('limpieza_domestica');
    expect(resolveSkillCategoryId('Fontanería')).toBe('plomeria');
    expect(resolveSkillCategoryId('')).toBe(SIN_CATEGORIA_ID);
    expect(resolveSkillCategoryId('Sin categoria')).toBe(SIN_CATEGORIA_ID);
    expect(resolveSkillCategoryId('Otros')).toBe(SIN_CATEGORIA_ID);
  });

  it('puts unknown trade labels in custom groups', () => {
    expect(resolveSkillCategoryId('Tecnología')).toBe('custom:tecnologia');
    expect(
      getSkillCategoryLabel('custom:tecnologia', { categoria: 'Tecnología' }),
    ).toBe('Tecnología');
  });

  it('infers trade from skill name when categoria is empty or sin categoria', () => {
    expect(
      resolveSkillCategoryFromSkill({ nombre: 'Instalación eléctrica', categoria: '' }),
    ).toBe('electricidad');
    expect(
      resolveSkillCategoryFromSkill({ nombre: 'Trabajo en equipo', categoria: 'Otros' }),
    ).toBe(SIN_CATEGORIA_ID);
    expect(
      resolveSkillCategoryFromSkill({ nombre: 'Destape de tuberías', categoria: 'Sin categoria' }),
    ).toBe('plomeria');
  });

  it('groups skills and lists categories with items', () => {
    const skills = [
      { id: '1', nombre: 'A', categoria: 'Limpieza' },
      { id: '2', nombre: 'B', categoria: 'Plomería' },
      { id: '3', nombre: 'C', categoria: 'Limpieza' },
      { id: '4', nombre: 'Puntualidad', categoria: '' },
    ];
    const groups = groupSkillsByCategory(skills);
    expect(groups.get('limpieza_domestica')).toHaveLength(2);
    expect(groups.get(SIN_CATEGORIA_ID)).toHaveLength(1);
    const cats = getCategoriesWithSkills(skills);
    expect(cats.some((c) => c.id === 'limpieza_domestica')).toBe(true);
    expect(cats[cats.length - 1].id).toBe(SIN_CATEGORIA_ID);
    expect(getSkillCategoryLabel('plomeria')).toBe('Plomería');
  });
});
