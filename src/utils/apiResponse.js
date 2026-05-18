/**
 * Nest controllers often return HTTP 200 with { status: 'error', message }.
 * Call after axios resolves to surface failures like real request errors.
 */
export function throwIfApiError(payload, fallbackMessage = 'Error en la solicitud') {
  if (payload?.status === 'error') {
    const message =
      (typeof payload.message === 'string' && payload.message.trim()) ||
      fallbackMessage;
    const err = new Error(message);
    err.response = { data: { message } };
    throw err;
  }
  return payload;
}
