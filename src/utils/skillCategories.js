/**
 * Agrupa habilidades del catálogo usando las categorías reales de la BD
 * (`GET /services/categorias`) y un bucket aparte para habilidades sociales.
 */

export const SOCIAL_SKILLS_ID = 'habilidades_sociales';
export const SOCIAL_SKILLS_LABEL = 'Habilidades sociales';

/** @deprecated usar SOCIAL_SKILLS_ID */
export const SIN_CATEGORIA_ID = SOCIAL_SKILLS_ID;

/** Valores de `skill.categoria` que van al bucket de habilidades sociales. */
const SOCIAL_CATEGORY_ALIASES = new Set([
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
 * Sinónimos legacy para emparejar textos viejos del catálogo con categorías de BD.
 * Se aplican solo si hay una categoría en `catalogCategories` que coincida.
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
    'sirvienta',
    'limpiadora',
    'limpiador',
  ],
  plomeria: [
    'plomeria',
    'plomería',
    'plomero',
    'fontaneria',
    'fontanería',
    'sanitario',
    'tuberia',
    'destape',
    'destapes',
  ],
  electricidad: [
    'electricidad',
    'electricista',
    'electrico',
    'instalacion electrica',
    'cableado',
    'electrodomesticos',
  ],
  jardineria: ['jardineria', 'jardinería', 'jardin', 'jardinero', 'poda', 'paisajismo'],
  carpinteria: ['carpinteria', 'carpintería', 'ebanisteria', 'madera', 'muebles'],
  construccion: ['construccion', 'construcción', 'albanil', 'albañil', 'obra', 'obras'],
  pintura: ['pintura', 'pintor', 'decorador'],
  mecanica: ['mecanica', 'mecánica', 'mecanico', 'automotriz', 'taller'],
  catering: ['cocina', 'catering', 'chef', 'cocinero', 'repostero', 'comida'],
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

const isSocialCategoryValue = (categoria) => {
  if (categoria == null || !String(categoria).trim()) return true;
  return SOCIAL_CATEGORY_ALIASES.has(normalize(categoria));
};

const registerAlias = (aliasMap, text, categoryId) => {
  const key = normalize(text);
  if (key.length >= 3) aliasMap.set(key, categoryId);
};

const findEntryForSlug = (slug, entries, aliases = []) => {
  const slugKey = normalize(slug.replace(/_/g, ' '));
  const direct = entries.find((e) => e.key === slugKey || e.key === normalize(slug));
  if (direct) return direct;

  for (const entry of entries) {
    if (entry.key.includes(slugKey) || slugKey.includes(entry.key)) return entry;
    for (const alias of aliases) {
      const a = normalize(alias);
      if (a.length < 3) continue;
      if (entry.key.includes(a) || a.includes(entry.key)) return entry;
    }
  }
  return null;
};

/** Índice de categorías de servicio desde la API (`categorias_servicio`). */
export const buildCategoryRegistry = (catalogCategories = []) => {
  const entries = (catalogCategories || [])
    .filter((c) => c && c.activo !== false && c.nombre)
    .map((c) => ({
      id: `db:${c.id}`,
      dbId: String(c.id),
      nombre: String(c.nombre).trim(),
      key: normalize(c.nombre),
    }));

  const aliasMap = new Map();

  for (const entry of entries) {
    registerAlias(aliasMap, entry.nombre, entry.id);
    registerAlias(aliasMap, entry.key, entry.id);
  }

  for (const [slug, aliases] of Object.entries(LEGACY_SLUG_ALIASES)) {
    const entry = findEntryForSlug(slug, entries, aliases);
    if (!entry) continue;
    registerAlias(aliasMap, slug, entry.id);
    for (const alias of aliases) registerAlias(aliasMap, alias, entry.id);
  }

  return { entries, aliasMap };
};

const resolveFromRegistry = (text, registry) => {
  if (!registry?.entries?.length) return null;

  const key = normalize(text);
  if (!key) return null;
  if (SOCIAL_CATEGORY_ALIASES.has(key)) return SOCIAL_SKILLS_ID;

  if (registry.aliasMap.has(key)) return registry.aliasMap.get(key);

  let bestId = null;
  let bestLen = 0;

  for (const entry of registry.entries) {
    const matches = key === entry.key || key.includes(entry.key) || entry.key.includes(key);
    if (matches && entry.key.length > bestLen) {
      bestLen = entry.key.length;
      bestId = entry.id;
    }
  }

  return bestId;
};

/** Resuelve categoría usando `categoria`, el nombre de la habilidad y el catálogo de BD. */
export const resolveSkillCategoryFromSkill = (skill, catalogCategories = []) => {
  const registry = buildCategoryRegistry(catalogCategories);
  const categoria = skill?.categoria;
  const nombre = skill?.nombre;

  if (!isSocialCategoryValue(categoria)) {
    const fromField = resolveFromRegistry(categoria, registry);
    if (fromField && fromField !== SOCIAL_SKILLS_ID) return fromField;
  }

  const fromName = resolveFromRegistry(nombre, registry);
  if (fromName && fromName !== SOCIAL_SKILLS_ID) return fromName;

  if (isSocialCategoryValue(categoria)) return SOCIAL_SKILLS_ID;

  const key = normalize(categoria);
  return key ? `custom:${key}` : SOCIAL_SKILLS_ID;
};

export const getSkillCategoryLabel = (categoryId, catalogCategories = [], sampleSkill = null) => {
  if (categoryId === SOCIAL_SKILLS_ID) return SOCIAL_SKILLS_LABEL;

  if (categoryId?.startsWith('db:')) {
    const dbId = categoryId.slice(3);
    const fromCatalog = (catalogCategories || []).find((c) => String(c.id) === dbId);
    if (fromCatalog?.nombre) return fromCatalog.nombre.trim();
  }

  if (categoryId?.startsWith('custom:')) {
    const fromSkill = sampleSkill?.categoria?.trim();
    if (fromSkill) return fromSkill;
    return categoryId
      .slice('custom:'.length)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }

  return SOCIAL_SKILLS_LABEL;
};

/** Agrupa habilidades por categoría (orden alfabético dentro de cada grupo). */
export const groupSkillsByCategory = (skills = [], catalogCategories = []) => {
  const groups = new Map();
  for (const skill of skills) {
    const catId = resolveSkillCategoryFromSkill(skill, catalogCategories);
    if (!groups.has(catId)) groups.set(catId, []);
    groups.get(catId).push(skill);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }
  return groups;
};

/**
 * Píldoras para onboarding: todas las categorías activas de la BD (aunque estén vacías)
 * + grupos custom de skills sin match + habilidades sociales al final.
 */
export const getCategoriesWithSkills = (skills = [], catalogCategories = []) => {
  const registry = buildCategoryRegistry(catalogCategories);
  const groups = groupSkillsByCategory(skills, catalogCategories);
  const result = [];

  for (const entry of registry.entries) {
    const list = groups.get(entry.id) ?? [];
    result.push({
      id: entry.id,
      label: entry.nombre,
      count: list.length,
      dbId: entry.dbId,
    });
  }

  const customIds = [...groups.keys()]
    .filter((id) => id.startsWith('custom:'))
    .sort((a, b) =>
      getSkillCategoryLabel(a, catalogCategories, groups.get(a)[0]).localeCompare(
        getSkillCategoryLabel(b, catalogCategories, groups.get(b)[0]),
        'es',
      ),
    );

  for (const id of customIds) {
    const list = groups.get(id) ?? [];
    result.push({
      id,
      label: getSkillCategoryLabel(id, catalogCategories, list[0]),
      count: list.length,
    });
  }

  if (groups.has(SOCIAL_SKILLS_ID)) {
    const list = groups.get(SOCIAL_SKILLS_ID) ?? [];
    if (list.length > 0) {
      result.push({
        id: SOCIAL_SKILLS_ID,
        label: SOCIAL_SKILLS_LABEL,
        count: list.length,
      });
    }
  }

  if (result.length > 0) return result;

  // Sin catálogo de BD: solo lo que salga de los skills
  return [...groups.keys()].map((id) => ({
    id,
    label: getSkillCategoryLabel(id, catalogCategories, groups.get(id)[0]),
    count: groups.get(id).length,
  }));
};

/** @deprecated usar resolveSkillCategoryFromSkill */
export const resolveSkillCategoryId = (categoria, catalogCategories = []) =>
  resolveSkillCategoryFromSkill({ categoria }, catalogCategories);
