# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server (port 5173, proxies /api → localhost:3000)
npm run build        # Production build → dist/
npm run build:clean  # rm -rf dist && build
npm run lint         # ESLint — zero warnings tolerance
npm run test         # Vitest
npm run test:ui      # Vitest with browser UI dashboard
npm run test:coverage
```

## Architecture

### Routing — `src/App.jsx`
All pages are `React.lazy()`-loaded and wrapped in `<Suspense>`. Route structure:
- Public: `/`, `/login`, `/register`, `/service`, `/profile/:userId`
- Protected via `<ProtectedRoute>`: `/dashboard`, `/onboarding`, `/contracts/:id`, `/edit-profile`, etc.
- Role-gated (admin/super_admin): `/admin`
- `ScrollToTop` hook resets scroll on every route change.

### Auth — `src/context/AuthContext.jsx`
`useReducer`-based context. Key actions: `LOGIN_SUCCESS`, `LOGOUT`, `UPDATE_USER`, `REFRESH_USER_SUCCESS`, `INIT_FROM_STORAGE`.

- JWT is stored as an **httpOnly cookie** (set by the server); `localStorage` holds only the user object for instant hydration on reload.
- On mount, `initializeAuth()` reads `localStorage.user`, restores state immediately, then calls `refreshUser()` in background to verify the session is still valid.
- On 401, the axios interceptor triggers logout automatically.
- First-login flag: `localStorage.setItem('chambing_needs_onboarding', 'true')` is set when `user.foto_perfil === null` after login; `LoginForm` reads it and redirects to `/onboarding`.

### API layer — `src/services/api.js`
Single Axios instance. Base URL: `VITE_API_URL` env var → `http://localhost:3000/api` (dev) → `https://chambingapi.onrender.com/api` (prod). All requests use `withCredentials: true` (httpOnly cookies). 30 s timeout.

All API calls go through service files in `src/services/` — never call axios directly from components. Services export plain objects with methods (e.g. `profileService.updateProfile(data)`).

### State management
- **Context API + useReducer** for auth (`AuthContext`), app-level state (`AppContext`), and admin (`AdminContext`).
- No Redux or Zustand.
- `useApi(fn, deps)` hook handles loading/error/data lifecycle for ad-hoc fetches.

### Styling
- **SCSS** with shared variables in `src/styles/variables.scss` (`@use './variables' as *`).
- **MUI v7** (Material UI) for interactive components (Button, TextField, Chip, DatePicker, etc.).
- Custom MUI theme in `src/theme/`.
- No Tailwind. Component-specific SCSS files live in `src/styles/`.

### i18n
- `i18next` + `react-i18next`. Supported: `es` (default), `en`, `fr`.
- Translation JSON files in `src/locales/{lang}/translation.json`.
- Use `useTranslations()` hook (wraps `useTranslation`); exposes `t()`, `common`, `nav`, `services` shortcut objects.
- Language stored in localStorage at key `chambing-language`.

### Forms
- `react-hook-form` + `yup` + `@hookform/resolvers/yup`. Always validate with a `yup.object().shape()` schema passed to `yupResolver`.

### Onboarding wizard — `src/pages/Onboarding.jsx`
3-step wizard for workers, 2-step for clients (`tipo_usuario === 'trabajador'`).
- Step 1: Profile photo (`ProfilePhotoModal`) + cover photo (`CoverPhotoModal`)
- Step 2: Bio, phone, title, location
- Step 3 (workers only): Tarifas with live net-earnings calculator (10% platform + 3.5% gateway + 13% IVA El Salvador)
- On finish: calls `profileService.updateProfile()` then `serviceService.createTarifas()`, clears the `chambing_needs_onboarding` flag, navigates to `/dashboard`.

### Reviews
All review components (`ReviewForm`, `ReviewModal`) and `reviewService` are complete. Wired into `ContractDetails.jsx`:
- Worker in `activo` contract → "Marcar como completado" → calls `contractService.completarContrato()`
- Employer in `completado` contract → "Cerrar contrato y dejar reseña" → calls `contractService.cerrarContrato()` → opens `ReviewModal`

### Utilities
- `src/utils/logger.js` — environment-aware logging; sanitizes sensitive fields. Use `logger.auth()`, `logger.api()`, `logger.error()`, etc. instead of `console.*`.
- `src/utils/security.js` — `sanitizeInput()`, `isValidEmail()`.

## Key env vars

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Overrides the default API base URL |

No `.env` file is committed. Create `.env.local` for local overrides.
