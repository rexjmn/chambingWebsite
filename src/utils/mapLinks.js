/**
 * Enlaces a apps de mapas (Google Maps, Waze) para dirección y/o coordenadas del contrato.
 */

function finitePair(lat, lng) {
  const la = typeof lat === 'string' ? parseFloat(lat) : lat;
  const ln = typeof lng === 'string' ? parseFloat(lng) : lng;
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return null;
  return { lat: la, lng: ln };
}

/**
 * @param {{ lat?: unknown, lng?: unknown } | null | undefined} coordenadas
 * @returns {{ lat: number, lng: number } | null}
 */
export function parseCoordenadas(coordenadas) {
  if (!coordenadas || typeof coordenadas !== 'object') return null;
  return finitePair(coordenadas.lat, coordenadas.lng);
}

/**
 * @param {{ lat?: number, lng?: number, address?: string | null }} opts
 * @returns {{ google: string | null, waze: string | null }}
 */
export function buildMapsUrls({ lat, lng, address } = {}) {
  const coords = finitePair(lat, lng);
  const q = typeof address === 'string' ? address.trim() : '';
  const hasQuery = q.length >= 3;

  if (coords) {
    const { lat: la, lng: ln } = coords;
    return {
      google: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${la},${ln}`)}`,
      waze: `https://waze.com/ul?ll=${la},${ln}&navigate=yes`,
    };
  }

  if (!hasQuery) {
    return { google: null, waze: null };
  }

  return {
    google: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
    waze: `https://waze.com/ul?q=${encodeURIComponent(q)}`,
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} detalles
 * @param {string} [addressFallback]
 */
export function mapsUrlsFromDetalles(detalles, addressFallback = '') {
  const coords = parseCoordenadas(detalles?.coordenadas);
  const address =
    (typeof detalles?.direccion === 'string' && detalles.direccion.trim()) ||
    (typeof addressFallback === 'string' && addressFallback.trim()) ||
    '';
  return buildMapsUrls({
    lat: coords?.lat,
    lng: coords?.lng,
    address,
  });
}
