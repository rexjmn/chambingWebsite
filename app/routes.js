import { index, route } from '@react-router/dev/routes';

export default [
  // ── Rutas públicas con SSR ────────────────────────────────────────────────
  index('routes/home.jsx'),
  route('/sitemap.xml', 'routes/sitemap.xml.jsx'),
  route('/service', 'routes/service.jsx'),
  route('/profile/:userId', 'routes/profile.$userId.jsx'),
  route('/terminos', 'routes/terminos.jsx'),

  // ── Misión Chambing (público + protegido) ────────────────────────────────
  route('/misiones', 'routes/misiones.jsx'),
  route('/misiones/crear', 'routes/misiones.crear.jsx'),
  route('/misiones/:misionId', 'routes/misiones.$misionId.jsx'),

  // ── Rutas de auth (CSR) ───────────────────────────────────────────────────
  route('/login', 'routes/login.jsx'),
  route('/register', 'routes/register.jsx'),
  route('/verificar-email', 'routes/verificar-email.jsx'),

  // ── Rutas protegidas (CSR) ────────────────────────────────────────────────
  route('/onboarding', 'routes/onboarding.jsx'),
  route('/dashboard', 'routes/dashboard.jsx'),
  route('/edit-profile', 'routes/edit-profile.jsx'),
  route('/perfil', 'routes/perfil.jsx'),
  route('/availability', 'routes/availability.jsx'),
  route('/contracts/create', 'routes/contracts.create.jsx'),
  route('/contracts/:contractId', 'routes/contracts.$contractId.jsx'),
  route('/admin', 'routes/admin.jsx'),
  route('/ofertas/responder', 'routes/ofertas.responder.jsx'),
  route('/auth/google-callback', 'routes/auth.google-callback.jsx'),
];
