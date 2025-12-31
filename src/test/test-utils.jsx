import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../theme/muiTheme'
import { AuthProvider } from '../context/AuthContext'

/**
 * Custom render que incluye todos los providers necesarios
 * Uso: renderWithProviders(<Component />)
 */
export function renderWithProviders(
  ui,
  {
    initialEntries = ['/'],
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Render sin AuthProvider (para testear componentes de auth)
 */
export function renderWithoutAuth(ui, renderOptions = {}) {
  function Wrapper({ children }) {
    return (
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </ThemeProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Mock de usuario autenticado
 */
export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  nombre: 'Test',
  apellido: 'User',
  tipo_usuario: 'cliente',
  verificado: true,
}

/**
 * Mock de trabajador
 */
export const mockWorker = {
  id: '987e6543-e21b-34d5-a678-426614174001',
  email: 'worker@example.com',
  nombre: 'Worker',
  apellido: 'Test',
  tipo_usuario: 'trabajador',
  verificado: true,
  municipio: 'San Salvador',
  departamento: 'San Salvador',
  biografia: 'Test worker bio',
  foto_perfil: 'https://via.placeholder.com/150',
}

/**
 * Espera a que desaparezcan los loading states
 */
export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 0))

// Re-exportar todo de @testing-library/react
export * from '@testing-library/react'
