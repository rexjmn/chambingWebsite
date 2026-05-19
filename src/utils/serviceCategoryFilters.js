/**
 * Categorías de servicio para /service y dashboard, alineadas con `categorias_servicio` (API).
 */

const LEGACY_SLUG_ALIASES = {
  limpieza_domestica: [
    'limpieza domestica',
    'limpieza doméstica',
    'limpieza',
    'lavanderia',
    'aseo',
    'domestica',
    'hogar',
  ],
  plomeria: ['plomeria', 'plomería', 'plomero', 'fontaneria', 'fontanería', 'sanitario', 'tuberia', 'destape'],
  electricidad: ['electricidad', 'electricista', 'electrico', 'cableado', 'electrodomesticos'],
  jardineria: ['jardineria', 'jardinería', 'jardin', 'jardinero', 'poda', 'paisajismo'],
  carpinteria: ['carpinteria', 'carpintería', 'ebanisteria', 'madera', 'muebles'],
  construccion: ['construccion', 'construcción', 'albanil', 'albañil', 'obra', 'obras'],
  pintura: ['pintura', 'pintor', 'decorador'],
  mecanica: ['mecanica', 'mecánica', 'mecanico', 'automotriz', 'taller'],
  catering: ['cocina', 'catering', 'chef', 'cocinero', 'comida'],
  seguridad: ['seguridad', 'guardia', 'vigilante', 'vigilancia'],
};

export const normalizeCategoryText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[-/]+/g, '_')
    .replace(/[^a-z0-9_\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');

const resolveLegacySlug = (nombre) => {
  const key = normalizeCategoryText(nombre);
  for (const [slug, aliases] of Object.entries(LEGACY_SLUG_ALIASES)) {
    const slugKey = normalizeCategoryText(slug.replace(/_/g, ' '));
    if (key === slugKey || key.includes(slugKey) || slugKey.includes(key)) return slug;
    for (const alias of aliases) {
      const a = normalizeCategoryText(alias);
      if (a.length < 3) continue;
      if (key === a || key.includes(a) || a.includes(key)) return slug;
    }
  }
  return null;
};

const collectAliases = (nombre, filterParam) => {
  const aliases = new Set([normalizeCategoryText(nombre)]);
  aliases.add(normalizeCategoryText(filterParam.replace(/_/g, ' ')));
  const slugAliases = LEGACY_SLUG_ALIASES[filterParam];
  if (slugAliases) slugAliases.forEach((a) => aliases.add(normalizeCategoryText(a)));
  return [...aliases];
};

/** Lista de categorías para filtros UI + parámetro API (`filterParam`). */
export const buildServiceCategories = (catalogCategories = []) =>
  (catalogCategories || [])
    .filter((c) => c && c.activo !== false && c.nombre)
    .map((c) => {
      const nombre = String(c.nombre).trim();
      const legacySlug = resolveLegacySlug(nombre);
      const filterParam = legacySlug || nombre;
      return {
        id: String(c.id),
        dbId: String(c.id),
        nombre,
        label: nombre,
        filterParam,
        aliases: collectAliases(nombre, filterParam),
      };
    });

export const findServiceCategory = (param, categories = []) => {
  if (!param) return null;
  const key = normalizeCategoryText(param);
  return (
    categories.find((c) => c.id === param || c.filterParam === param) ||
    categories.find((c) => normalizeCategoryText(c.nombre) === key) ||
    categories.find((c) => c.aliases.includes(key)) ||
    categories.find(
      (c) =>
        key.includes(normalizeCategoryText(c.nombre)) ||
        normalizeCategoryText(c.nombre).includes(key),
    ) ||
    null
  );
};

export const getWorkerSkillNames = (worker) => {
  const source = worker?.skills || worker?.habilidades || [];
  if (!Array.isArray(source)) return [];
  return source
    .map((skill) => {
      if (typeof skill === 'string') return skill;
      return skill?.nombre || skill?.name || skill?.categoria || '';
    })
    .filter(Boolean)
    .map(normalizeCategoryText);
};

/** Coincidencia en cliente (refuerzo del filtro del API). */
export const workerMatchesServiceCategory = (worker, category) => {
  if (!category) return true;
  const skills = getWorkerSkillNames(worker);
  if (skills.length === 0) return false;
  return skills.some((skill) =>
    category.aliases.some((alias) => skill.includes(alias) || alias.includes(skill)),
  );
};

/** Clave de icono para dashboard (mapeo visual opcional). */
export const getServiceCategoryIconKey = (category) => {
  const slug = category?.filterParam;
  const map = {
    limpieza_domestica: 'domesticCleaning',
    plomeria: 'plumbing',
    electricidad: 'electricity',
    jardineria: 'gardening',
    carpinteria: 'carpentry',
    construccion: 'construction',
    pintura: 'construction',
    mecanica: 'construction',
    catering: 'construction',
    seguridad: 'construction',
  };
  return map[slug] || null;
};

export const getServiceCategoryColorKey = (category) =>
  getServiceCategoryIconKey(category) || 'blue';
