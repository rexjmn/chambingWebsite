import { describe, it, expect } from 'vitest';
import {
  resolveSkillCategoryFromSkill,
  getSkillCategoryLabel,
  getCategoriesWithSkills,
  groupSkillsByCategory,
  SOCIAL_SKILLS_ID,
  SOCIAL_SKILLS_LABEL,
} from './skillCategories';

const catalog = [
  { id: 'cat-1', nombre: 'Limpieza Doméstica', activo: true },
  { id: 'cat-2', nombre: 'Plomería', activo: true },
  { id: 'cat-3', nombre: 'Electricidad', activo: true },
];

describe('skillCategories', () => {
  it('maps skill categoria to database category id', () => {
    expect(
      resolveSkillCategoryFromSkill({ nombre: 'A', categoria: 'Limpieza Doméstica' }, catalog),
    ).toBe('db:cat-1');
    expect(
      resolveSkillCategoryFromSkill({ nombre: 'B', categoria: 'limpieza-domestica' }, catalog),
    ).toBe('db:cat-1');
    expect(
      resolveSkillCategoryFromSkill({ nombre: 'C', categoria: 'Fontanería' }, catalog),
    ).toBe('db:cat-2');
  });

  it('uses social skills bucket for empty or social labels', () => {
    expect(resolveSkillCategoryFromSkill({ nombre: 'Puntualidad', categoria: '' }, catalog)).toBe(
      SOCIAL_SKILLS_ID,
    );
    expect(
      resolveSkillCategoryFromSkill({ nombre: 'Trabajo en equipo', categoria: 'Otros' }, catalog),
    ).toBe(SOCIAL_SKILLS_ID);
    expect(getSkillCategoryLabel(SOCIAL_SKILLS_ID)).toBe(SOCIAL_SKILLS_LABEL);
  });

  it('infers trade from skill name when categoria is social', () => {
    expect(
      resolveSkillCategoryFromSkill(
        { nombre: 'Destape de tuberías', categoria: 'Sin categoria' },
        catalog,
      ),
    ).toBe('db:cat-2');
    expect(
      resolveSkillCategoryFromSkill(
        { nombre: 'Instalación eléctrica', categoria: '' },
        catalog,
      ),
    ).toBe('db:cat-3');
  });

  it('lists all database categories and social bucket last', () => {
    const skills = [
      { id: '1', nombre: 'A', categoria: 'Limpieza Doméstica' },
      { id: '2', nombre: 'B', categoria: 'Plomería' },
      { id: '3', nombre: 'C', categoria: 'Limpieza Doméstica' },
      { id: '4', nombre: 'Puntualidad', categoria: '' },
    ];
    const groups = groupSkillsByCategory(skills, catalog);
    expect(groups.get('db:cat-1')).toHaveLength(2);
    expect(groups.get(SOCIAL_SKILLS_ID)).toHaveLength(1);

    const cats = getCategoriesWithSkills(skills, catalog);
    expect(cats).toHaveLength(4);
    expect(cats[0].id).toBe('db:cat-1');
    expect(cats[0].count).toBe(2);
    expect(cats.find((c) => c.id === 'db:cat-3')?.count).toBe(0);
    expect(cats[cats.length - 1].id).toBe(SOCIAL_SKILLS_ID);
    expect(cats[cats.length - 1].label).toBe(SOCIAL_SKILLS_LABEL);
  });
});
