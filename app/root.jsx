import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider } from '../src/context/AuthContext';
import { theme } from '../src/theme/muiTheme';
import Navbar from '../src/components/common/Navbar';
import Footer from '../src/components/common/Footer';
import ErrorBoundary from '../src/components/ErrorBoundary';
import { buildMeta } from './seo';
import '../src/styles/globals.scss';

// Default meta applied to every route unless overridden by a child route's meta()
export function meta() {
  return buildMeta();
}

// Default links: favicon + web manifest + Apple touch icon
export function links() {
  return [
    { rel: 'icon', type: 'image/png', href: '/logo.png' },
    { rel: 'apple-touch-icon', href: '/logo.png' },
    { rel: 'manifest', href: '/site.webmanifest' },
  ];
}

export function Layout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return (
    <ErrorBoundary title="Error en la aplicación" message="Ha ocurrido un error inesperado. Por favor, recarga la página.">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary title="Error de autenticación" message="Hubo un problema con la autenticación. Por favor, recarga la página.">
          <AuthProvider>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />
              <Box component="main" sx={{ flexGrow: 1 }}>
                <Outlet />
              </Box>
              <Footer />
            </Box>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
