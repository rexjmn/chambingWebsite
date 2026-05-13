/**
 * Normaliza la URL de retorno post-login (OAuth, ProtectedRoute, etc.).
 * Solo rutas internas (mismo host) como "/profile/uuid" — nunca "https://..." en sessionStorage,
 * para evitar redirects rotos tipo /auth/google-callback/https:/...
 */
export function sanitizeInternalReturnUrl(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (s.startsWith('/login') || s.startsWith('/register')) return null;
  if (s.startsWith('/auth/google-callback')) return null;

  try {
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s);
      if (typeof window !== 'undefined' && u.origin === window.location.origin) {
        const path = `${u.pathname}${u.search || ''}`;
        return path.startsWith('/') ? path : `/${path}`;
      }
      return null;
    }
    if (s.startsWith('//')) {
      const u = new URL(`https:${s}`);
      if (typeof window !== 'undefined' && u.host === window.location.host) {
        const path = `${u.pathname}${u.search || ''}`;
        return path.startsWith('/') ? path : `/${path}`;
      }
      return null;
    }
    if (s.startsWith('/')) {
      return s.split('#')[0];
    }
  } catch {
    return null;
  }
  return null;
}
