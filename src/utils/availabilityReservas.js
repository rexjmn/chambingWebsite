/**
 * Normaliza la respuesta del módulo de disponibilidad (array plano o envuelto en { data }).
 */
export function normalizeAvailabilityReservasPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
}

function toLocalDateOnly(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Consulta reservas y hace fallback a fechas YYYY-MM-DD si el backend rechaza ISO con hora.
 */
export async function fetchAvailabilityReservas(apiClient, workerId, startDate, endDate) {
  const endpoint = `/availability/reservas/${workerId}`;
  const isoParams = {
    fecha_inicio: new Date(startDate).toISOString(),
    fecha_fin: new Date(endDate).toISOString(),
  };

  try {
    const response = await apiClient.get(endpoint, { params: isoParams });
    return response.data;
  } catch (error) {
    if (error?.response?.status !== 400) throw error;

    const localDateParams = {
      fecha_inicio: toLocalDateOnly(startDate),
      fecha_fin: toLocalDateOnly(endDate),
    };
    const response = await apiClient.get(endpoint, { params: localDateParams });
    return response.data;
  }
}

const ESTADOS_CONTRATO_EN_AGENDA = new Set(['confirmado', 'en_camino', 'activo']);

function workerIdOnContract(c) {
  if (c?.trabajador?.id != null) return String(c.trabajador.id);
  if (c?.trabajador_id != null) return String(c.trabajador_id);
  return null;
}

function parseDateSafe(value) {
  if (value == null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeCantidad(cantidadRaw) {
  const n = Number(cantidadRaw);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return n;
}

function deriveContractEnd(start, contract) {
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) return null;

  const modalidad = String(contract?.modalidad || '').toLowerCase();
  const cantidad = normalizeCantidad(contract?.cantidad);
  const end = new Date(start);

  switch (modalidad) {
    case 'hora':
      end.setHours(end.getHours() + cantidad);
      return end;
    case 'dia':
      end.setDate(end.getDate() + cantidad);
      return end;
    case 'semana':
      end.setDate(end.getDate() + (cantidad * 7));
      return end;
    case 'mes':
      end.setMonth(end.getMonth() + cantidad);
      return end;
    default:
      return null;
  }
}

/**
 * Construye filas tipo "reserva" a partir de contratos del trabajador con fechas programadas,
 * para cuando el backend aún no sincroniza la tabla de reservas de disponibilidad.
 *
 * @param {object[]} contracts Lista de contratos (p. ej. mis-contratos con rol trabajador).
 * @param {string|number} workerId
 * @param {Date} rangeStart Inicio del rango visible (inclusive).
 * @param {Date} rangeEnd Fin del rango visible (inclusive).
 */
export function contractsToReservasFromWorkerContracts(contracts, workerId, rangeStart, rangeEnd) {
  if (!Array.isArray(contracts) || workerId == null) return [];

  const wid = String(workerId);
  const min = rangeStart instanceof Date ? rangeStart.getTime() : 0;
  const max = rangeEnd instanceof Date ? rangeEnd.getTime() : Number.POSITIVE_INFINITY;

  const out = [];

  for (const c of contracts) {
    if (!c || workerIdOnContract(c) !== wid) continue;
    if (!ESTADOS_CONTRATO_EN_AGENDA.has(c.estado)) continue;

    const startRaw = c.fecha_inicio_programada || c.fecha_inicio;
    if (!startRaw) continue;

    const start = parseDateSafe(startRaw);
    if (!start) continue;

    let end = parseDateSafe(c.fecha_fin_programada || c.fecha_fin);
    if (!end || end < start) {
      const derivedEnd = deriveContractEnd(start, c);
      if (derivedEnd && derivedEnd > start) {
        end = derivedEnd;
      } else {
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
      }
    }

    const startMs = start.getTime();
    const endMs = end.getTime();
    if (endMs < min || startMs > max) continue;

    out.push({
      id: `contract-${c.id}`,
      fecha_inicio: start.toISOString(),
      fecha_fin: end.toISOString(),
      tipo_reserva: 'contrato',
      estado: c.estado,
      modalidad_contrato: c.modalidad || null,
      contrato: {
        id: c.id,
        codigo_contrato: c.codigo_contrato,
      },
    });
  }

  return out.sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));
}

function contractIdFromReserva(r) {
  if (r?.contrato?.id != null) return String(r.contrato.id);
  if (typeof r?.id === 'string' && r.id.startsWith('contract-')) return r.id.replace(/^contract-/, '');
  return null;
}

/**
 * Une reservas del API con las derivadas de contratos, evitando duplicar el mismo contrato.
 */
export function mergeAvailabilityReservas(apiList, derivedList) {
  const api = Array.isArray(apiList) ? apiList : [];
  const derived = Array.isArray(derivedList) ? derivedList : [];

  const seenContractIds = new Set();
  for (const r of api) {
    const cid = contractIdFromReserva(r);
    if (cid) seenContractIds.add(cid);
  }

  const merged = [...api];
  for (const d of derived) {
    const cid = contractIdFromReserva(d);
    if (cid && seenContractIds.has(cid)) continue;
    if (cid) seenContractIds.add(cid);
    merged.push(d);
  }

  return merged.sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));
}
