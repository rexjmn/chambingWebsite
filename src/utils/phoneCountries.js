/**
 * Países admitidos para registro / teléfono (LATAM, EE.UU., Canadá, España, Francia).
 * nsnMin/nsnMax = longitud del número nacional (sin prefijo internacional).
 */

export const PHONE_COUNTRIES = [
  { iso: 'AR', name: 'Argentina', dial: '54', nsnMin: 10, nsnMax: 11 },
  { iso: 'BZ', name: 'Belice', dial: '501', nsnMin: 7, nsnMax: 7 },
  { iso: 'BO', name: 'Bolivia', dial: '591', nsnMin: 8, nsnMax: 8 },
  { iso: 'BR', name: 'Brasil', dial: '55', nsnMin: 10, nsnMax: 11 },
  { iso: 'CA', name: 'Canadá', dial: '1', nsnMin: 10, nsnMax: 10 },
  { iso: 'CL', name: 'Chile', dial: '56', nsnMin: 9, nsnMax: 9 },
  { iso: 'CO', name: 'Colombia', dial: '57', nsnMin: 10, nsnMax: 10 },
  { iso: 'CR', name: 'Costa Rica', dial: '506', nsnMin: 8, nsnMax: 8 },
  { iso: 'CU', name: 'Cuba', dial: '53', nsnMin: 8, nsnMax: 8 },
  { iso: 'DO', name: 'Rep. Dominicana', dial: '1', nsnMin: 10, nsnMax: 10 },
  { iso: 'EC', name: 'Ecuador', dial: '593', nsnMin: 9, nsnMax: 9 },
  { iso: 'ES', name: 'España', dial: '34', nsnMin: 9, nsnMax: 9 },
  { iso: 'SV', name: 'El Salvador', dial: '503', nsnMin: 8, nsnMax: 8 },
  { iso: 'US', name: 'Estados Unidos', dial: '1', nsnMin: 10, nsnMax: 10 },
  { iso: 'FR', name: 'Francia', dial: '33', nsnMin: 9, nsnMax: 9 },
  { iso: 'GT', name: 'Guatemala', dial: '502', nsnMin: 8, nsnMax: 8 },
  { iso: 'HN', name: 'Honduras', dial: '504', nsnMin: 8, nsnMax: 8 },
  { iso: 'MX', name: 'México', dial: '52', nsnMin: 10, nsnMax: 10 },
  { iso: 'NI', name: 'Nicaragua', dial: '505', nsnMin: 8, nsnMax: 8 },
  { iso: 'PA', name: 'Panamá', dial: '507', nsnMin: 8, nsnMax: 8 },
  { iso: 'PY', name: 'Paraguay', dial: '595', nsnMin: 9, nsnMax: 9 },
  { iso: 'PE', name: 'Perú', dial: '51', nsnMin: 9, nsnMax: 9 },
  { iso: 'PR', name: 'Puerto Rico', dial: '1', nsnMin: 10, nsnMax: 10 },
  { iso: 'UY', name: 'Uruguay', dial: '598', nsnMin: 8, nsnMax: 9 },
  { iso: 'VE', name: 'Venezuela', dial: '58', nsnMin: 10, nsnMax: 10 },
];

const byIso = Object.fromEntries(PHONE_COUNTRIES.map((c) => [c.iso, c]));

/** +1 compartido: priorizar US al interpretar números guardados sin metadata */
const NANP_SPLIT_ORDER = { US: 0, CA: 1, PR: 2, DO: 3 };

/** Ordenar por dial descendente; mismo dial → orden estable (NANP → US primero) */
export const PHONE_COUNTRIES_BY_DIAL_DESC = [...PHONE_COUNTRIES].sort((a, b) => {
  if (b.dial.length !== a.dial.length) return b.dial.length - a.dial.length;
  if (a.dial === '1' && b.dial === '1') {
    return (NANP_SPLIT_ORDER[a.iso] ?? 9) - (NANP_SPLIT_ORDER[b.iso] ?? 9);
  }
  return a.iso.localeCompare(b.iso);
});

export const PHONE_ISO_SET = new Set(PHONE_COUNTRIES.map((c) => c.iso));

export function getCountryByIso(iso) {
  return byIso[iso] || byIso.SV;
}

/**
 * Intenta deducir país y parte nacional desde dígitos guardados (código + nacional o solo SV legacy).
 */
export function splitInternationalTelefono(stored) {
  if (!stored) return { iso: 'SV', national: '' };
  const d = String(stored).replace(/\D/g, '');
  if (!d) return { iso: 'SV', national: '' };

  for (const c of PHONE_COUNTRIES_BY_DIAL_DESC) {
    if (!d.startsWith(c.dial)) continue;
    const national = d.slice(c.dial.length);
    if (national.length >= c.nsnMin && national.length <= c.nsnMax) {
      return { iso: c.iso, national };
    }
  }

  if (d.length === 8) return { iso: 'SV', national: d };

  return { iso: 'SV', national: d };
}

export function buildInternationalTelefonoDigits(iso, nationalDigits) {
  const c = getCountryByIso(iso);
  const n = String(nationalDigits || '').replace(/\D/g, '');
  return `${c.dial}${n}`;
}

/**
 * Geolocalización ligera (sin API key). Fallback: El Salvador.
 */
export async function fetchDefaultPhoneCountryIso() {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 4000);
  try {
    const r = await fetch('https://ipwho.is/', { signal: ctrl.signal });
    if (!r.ok) return 'SV';
    const j = await r.json();
    if (j.success === false) return 'SV';
    const code = String(j.country_code || '').toUpperCase();
    if (PHONE_ISO_SET.has(code)) return code;
    return 'SV';
  } catch {
    return 'SV';
  } finally {
    clearTimeout(timeout);
  }
}
