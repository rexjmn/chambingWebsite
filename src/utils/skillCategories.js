/**
 * Agrupa habilidades del catálogo por categoría para onboarding y filtros.
 * Las categorías de oficio se resuelven por sinónimos; lo que no encaja queda en
 * `custom:*` (texto del admin) o en `sin_categoria` (vacío / habilidades sociales).
 */
export const SIN_CATEGORIA_ID = 'sin_categoria';

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
  { id: SIN_CATEGORIA_ID, label: 'Sin categoría' },
];

/** Valores de `categoria` en BD que representan habilidades generales / sociales. */
const SIN_CATEGORIA_ALIASES = new Set([
  'sin_categoria',
  'sin_categoría',
  'habilidades_sociales',
  'habilidades_blandas',
  'blandas',
  'soft_skills',
  'generales',
  'general',
  'otros',
  'sin_asignar',
  'ninguna',
  'n_a',
  'na',
]);

/**
 * Sinónimos por categoría de oficio (alineado con users.service CATEGORY_SYNONYMS).
 * Se usan para coincidencia parcial en `categoria` y en `nombre` de la habilidad.
 */
export const CATEGORY_ALIASES = {
  limpieza_domestica: [
    'limpieza domestica',
    'limpieza doméstica',
    'limpieza',
    'lavanderia',
    'lavandería',
    'aseo',
    'domestica',
    'doméstica',
    'hogar',
    'sirvienta',
    'empleada domestica',
    'empleada doméstica',
    'limpiadora',
    'limpiador',
    'mucama',
    'ama de llaves',
  ],
  plomeria: [
    'plomeria',
    'plomería',
    'plomero',
    'fontaneria',
    'fontanería',
    'fontanero',
    'sanitario',
    'sanitarios',
    'tuberia',
    'tubería',
    'destape',
    'destapes',
    'agua',
    'instalacion de agua',
  ],
  electricidad: [
    'electricidad',
    'electricista',
    'electrico',
    'eléctrico',
    'instalacion electrica',
    'instalación eléctrica',
    'cableado',
    'electrodomesticos',
    'electrodomésticos',
  ],
  jardineria: [
    'jardineria',
    'jardinería',
    'jardin',
    'jardín',
    'jardinero',
    'poda',
    'paisajismo',
    'plantas',
    'areas verdes',
    'áreas verdes',
  ],
  carpinteria: [
    'carpinteria',
    'carpintería',
    'carpintero',
    'ebanisteria',
    'ebanistería',
    'ebanista',
    'madera',
    'muebles',
  ],
  construccion: [
    'construccion',
    'construcción',
    'albanil',
    'albañil',
    'albanileria',
    'albañilería',
    'obra',
    'obras',
    'mamposteria',
    'mampostería',
    'remodelacion',
    'remodelación',
    'maestro de obra',
  ],
  pintura: ['pintura', 'pintor', 'pintar', 'decorador', 'decoracion', 'decoración'],
  mecanica: [
    'mecanica',
    'mecánica',
    'mecanico',
    'mecánico',
    'automotriz',
    'taller',
    'motor',
    'vehiculo',
    'vehículo',
  ],
  catering: [
    'cocina',
    'catering',
    'chef',
    'cocinero',
    'cocinera',
    'repostero',
    'repostera',
    'reposteria',
    'repostería',
    'comida',
    'banquetes',
  ],
  seguridad: ['seguridad', 'guardia', 'vigilante', 'vigilancia'],
};

const normalize = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[-/]+/g, '_')
    .replace(/[^a-z0-9_\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');

const LABEL_TO_ID = SKILL_CATEGORY_META.reduce((acc, cat) => {
  if (cat.id === SIN_CATEGORIA_ID) return acc;
  acc[normalize(cat.label)] = cat.id;
  acc[normalize(cat.id)] = cat.id;
  return acc;
}, {});

const isSinCategoriaValue = (categoria) => {
  if (categoria == null || !String(categoria).trim()) return true;
  return SIN_CATEGORIA_ALIASES.has(normalize(categoria));
};

const matchKnownCategory = (text) => {
  const key = normalize(text);
  if (!key) return null;
  if (SIN_CATEGORIA_ALIASES.has(key)) return SIN_CATEGORIA_ID;
  if (LABEL_TO_ID[key]) return LABEL_TO_ID[key];
  if (SKILL_CATEGORY_META.some((c) => c.id === key && c.id !== SIN_CATEGORIA_ID)) return key;

  let bestId = null;
  let bestLen = 0;

  for (const [catId, aliases] of Object.entries(CATEGORY_ALIASES)) {
    for (const alias of aliases) {
      const a = normalize(alias);
      if (a.length < 3) continue;
      const matches = key === a || key.includes(a) || a.includes(key);
      if (matches && a.length > bestLen) {
        bestLen = a.length;
        bestId = catId;
      }
    }
  }

  return bestId;
};

/** Resuelve la clave de categoría a partir del campo `categoria` del catálogo. */
export const resolveSkillCategoryId = (categoria) => {
  if (isSinCategoriaValue(categoria)) return SIN_CATEGORIA_ID;
  const known = matchKnownCategory(categoria);
  if (known && known !== SIN_CATEGORIA_ID) return known;
  const key = normalize(categoria);
  return `custom:${key}`;
};

/** Resuelve categoría usando `categoria` y, si hace falta, el nombre de la habilidad. */
export const resolveSkillCategoryFromSkill = (skill) => {
  const categoria = skill?.categoria;
  const nombre = skill?.nombre;

  if (!isSinCategoriaValue(categoria)) {
    const fromField = matchKnownCategory(categoria);
    if (fromField && fromField !== SIN_CATEGORIA_ID) return fromField;
  }

  const fromName = matchKnownCategory(nombre);
  if (fromName && fromName !== SIN_CATEGORIA_ID) return fromName;

  if (isSinCategoriaValue(categoria)) return SIN_CATEGORIA_ID;

  const key = normalize(categoria);
  return key ? `custom:${key}` : SIN_CATEGORIA_ID;
};

export const getSkillCategoryLabel = (categoryId, sampleSkill) => {
  const known = SKILL_CATEGORY_META.find((c) => c.id === categoryId);
  if (known) return known.label;
  if (categoryId?.startsWith('custom:')) {
    const fromSkill = sampleSkill?.categoria?.trim();
    if (fromSkill) return fromSkill;
    return categoryId
      .slice('custom:'.length)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }
  return 'Sin categoría';
};

/** Agrupa habilidades por categoría (orden alfabético dentro de cada grupo). */
export const groupSkillsByCategory = (skills = []) => {
  const groups = new Map();
  for (const skill of skills) {
    const catId = resolveSkillCategoryFromSkill(skill);
    if (!groups.has(catId)) groups.set(catId, []);
    groups.get(catId).push(skill);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }
  return groups;
};

const KNOWN_TRADE_IDS = SKILL_CATEGORY_META.map((c) => c.id).filter((id) => id !== SIN_CATEGORIA_ID);

/** Categorías que tienen al menos una habilidad activa en el catálogo. */
export const getCategoriesWithSkills = (skills = []) => {
  const groups = groupSkillsByCategory(skills);

  const known = KNOWN_TRADE_IDS.filter((id) => groups.has(id) && groups.get(id).length > 0);

  const custom = [...groups.keys()]
    .filter((id) => id.startsWith('custom:') && groups.get(id).length > 0)
    .sort((a, b) =>
      getSkillCategoryLabel(a, groups.get(a)[0]).localeCompare(
        getSkillCategoryLabel(b, groups.get(b)[0]),
        'es',
      ),
    );

  const sinCat =
    groups.has(SIN_CATEGORIA_ID) && groups.get(SIN_CATEGORIA_ID).length > 0
      ? [SIN_CATEGORIA_ID]
      : [];

  return [...known, ...custom, ...sinCat].map((id) => ({
    id,
    label: getSkillCategoryLabel(id, groups.get(id)[0]),
    count: groups.get(id).length,
  }));
};
