import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from './LoginForm'
import { renderWithProviders } from '../../test/test-utils'
import { authService } from '../../services/authService'

// Mock de authService
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
  },
}))

// Mock de useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('LoginForm', () => {
  it('should render login form', () => {
    renderWithProviders(<LoginForm />)

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      // react-hook-form mostrará errores de validación para ambos campos
      const errorMessages = screen.getAllByText(/required/i)
      expect(errorMessages).toHaveLength(2) // Email and password errors
    })
  })

  it('should submit form with valid credentials', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      user: { id: '123', email: 'test@example.com' },
    }

    authService.login.mockResolvedValueOnce(mockResponse)

    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByPlaceholderText(/email/i)
    const passwordInput = screen.getByPlaceholderText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('should show error message on login failure', async () => {
    const user = userEvent.setup()
    const mockError = new Error('Credenciales inválidas')
    mockError.response = { data: { message: 'Credenciales inválidas' } }

    authService.login.mockRejectedValueOnce(mockError)

    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByPlaceholderText(/email/i)
    const passwordInput = screen.getByPlaceholderText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'wrong@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument()
    })
  })
})
