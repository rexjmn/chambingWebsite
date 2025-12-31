import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary'

// Componente que lanza error intencionalmente
const ThrowError = () => {
  throw new Error('Test error')
}

// Componente normal
const NormalComponent = () => <div>Normal component</div>

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Normal component')).toBeInTheDocument()
  })

  it('should catch errors and display fallback UI', () => {
    // Suprimir console.error para este test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Algo salió mal/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Intentar de nuevo/i })).toBeInTheDocument()

    spy.mockRestore()
  })

  it('should display custom title and message', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary
        title="Error personalizado"
        message="Mensaje personalizado de error"
      >
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Error personalizado')).toBeInTheDocument()
    expect(screen.getByText('Mensaje personalizado de error')).toBeInTheDocument()

    spy.mockRestore()
  })

  it('should show error details in development mode', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const originalEnv = process.env.NODE_ENV

    // Simular development mode
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Detalles del error/i)).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
    spy.mockRestore()
  })

  it('should have "Volver al inicio" button', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByRole('button', { name: /Volver al inicio/i })).toBeInTheDocument()

    spy.mockRestore()
  })
})
