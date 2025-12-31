import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import { authService } from '../services/authService'
import api from '../services/api'

// Mock de authService
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    refresh_token: vi.fn(),
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
  },
}))

// Mock de api
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('AuthContext', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Initialization', () => {
    it('should initialize with unauthenticated state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.loading).toBe(false)
    })

    it('should restore user from localStorage on init', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        nombre: 'Test User',
      }

      localStorage.setItem('user', JSON.stringify(mockUser))

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.isAuthenticated).toBe(true)
      })
    })
  })

  describe('Login', () => {
    it('should login successfully', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockResponse = {
        user: {
          id: '123',
          email: 'test@example.com',
          nombre: 'Test',
          tipo_usuario: 'cliente',
        },
        message: 'Login exitoso',
      }

      authService.login.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await act(async () => {
        await result.current.login(mockCredentials)
      })

      expect(authService.login).toHaveBeenCalledWith(mockCredentials)
      expect(result.current.user).toEqual(mockResponse.user)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it('should handle login failure', async () => {
      const mockCredentials = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      }

      const mockError = new Error('Credenciales inválidas')
      authService.login.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await act(async () => {
        try {
          await result.current.login(mockCredentials)
        } catch (error) {
          // Error esperado
        }
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.error).toBe(mockError.message)
    })
  })

  describe('Logout', () => {
    it('should logout successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
      }

      localStorage.setItem('user', JSON.stringify(mockUser))
      authService.logout.mockResolvedValueOnce()

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      // Esperar a que se restaure el usuario
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(authService.logout).toHaveBeenCalled()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })
  })

  describe('refreshUser', () => {
    it('should refresh user data successfully', async () => {
      const mockUserData = {
        data: {
          id: '123',
          email: 'updated@example.com',
          nombre: 'Updated Name',
        },
      }

      api.get.mockResolvedValueOnce({ data: mockUserData })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await act(async () => {
        await result.current.refreshUser()
      })

      expect(api.get).toHaveBeenCalledWith('/users/me')
      expect(result.current.user).toEqual(mockUserData.data)
    })

    it('should handle refresh failure and logout', async () => {
      const mockError = {
        response: { status: 401 },
        message: 'Unauthorized',
      }

      api.get.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      // Primero establecer estado autenticado
      localStorage.setItem('user', JSON.stringify({ id: '123' }))

      await act(async () => {
        try {
          await result.current.refreshUser()
        } catch (error) {
          // Error esperado
        }
      })

      // Debería hacer logout en caso de 401
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false)
      })
    })
  })

  describe('Error Handling', () => {
    it('should clear error state', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      // Simular un error
      authService.login.mockRejectedValueOnce(new Error('Test error'))

      await act(async () => {
        try {
          await result.current.login({ email: 'test', password: 'test' })
        } catch (error) {
          // Expected
        }
      })

      expect(result.current.error).toBe('Test error')

      // Limpiar error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })
})
