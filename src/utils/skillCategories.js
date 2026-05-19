/**
 * Agrupa habilidades del catálogo por categoría para onboarding y filtros.
 */
export const SKILL_CATEGORY_META = [
  { id: 'limpieza_domestica', label: 'Limpieza' },
  { id: 'plomeria', label: 'Plomería' },
  { id: 'electricidad', label: 'Electricidad' },
  { id: 'jardineria', label: 'Jardinería' },
  { id: 'carpinteria', label: 'Carpintería' },
  { id: 'construccion', label: 'Construcción' },
  { id: 'pintura', label: 'Pintura' },
  { id: 'mecanica', label: 'Mecánica' },
  { id: 'catering', label: 'Cocina' },
  { id: 'seguridad', label: 'Seguridad' },
  { id: '__otros__', label: 'Otros' },
];

const normalize = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');

const LABEL_TO_ID = SKILL_CATEGORY_META.reduce((acc, cat) => {
  acc[normalize(cat.label)] = cat.id;
  acc[normalize(cat.id)] = cat.id;
  return acc;
}, {});

/** Resuelve la clave de categoría de una habilidad. */
export const resolveSkillCategoryId = (categoria) => {
  if (!categoria || !String(categoria).trim()) return '__otros__';
  const key = normalize(categoria);
  if (LABEL_TO_ID[key]) return LABEL_TO_ID[key];
  if (SKILL_CATEGORY_META.some((c) => c.id === key)) return key;
  return '__otros__';
};

export const getSkillCategoryLabel = (categoryId) =>
  SKILL_CATEGORY_META.find((c) => c.id === categoryId)?.label ?? 'Otros';

/** Agrupa habilidades por categoría (orden alfabético dentro de cada grupo). */
export const groupSkillsByCategory = (skills = []) => {
  const groups = new Map();
  for (const skill of skills) {
    const catId = resolveSkillCategoryId(skill.categoria);
    if (!groups.has(catId)) groups.set(catId, []);
    groups.get(catId).push(skill);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }
  return groups;
};

/** Categorías que tienen al menos una habilidad activa en el catálogo. */
export const getCategoriesWithSkills = (skills = []) => {
  const groups = groupSkillsByCategory(skills);
  const ordered = SKILL_CATEGORY_META.map((c) => c.id).filter((id) => groups.has(id) && groups.get(id).length > 0);
  return ordered.map((id) => ({
    id,
    label: getSkillCategoryLabel(id),
    count: groups.get(id).length,
  }));
};
