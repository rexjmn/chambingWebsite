import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authService } from './authService'
import api from './api'

// Mock de api
vi.mock('./api', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('login', () => {
    it('should login successfully and store user', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockResponse = {
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            nombre: 'Test User',
            tipo_usuario: 'cliente',
          },
          message: 'Login exitoso',
        },
      }

      api.post.mockResolvedValueOnce(mockResponse)

      const result = await authService.login(mockCredentials)

      expect(api.post).toHaveBeenCalledWith('/auth/login', mockCredentials)
      expect(result.user).toEqual(mockResponse.data.user)
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.data.user))
    })

    it('should throw error on login failure', async () => {
      const mockCredentials = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      }

      const mockError = {
        response: {
          data: { message: 'Credenciales inválidas' },
        },
      }

      api.post.mockRejectedValueOnce(mockError)

      await expect(authService.login(mockCredentials)).rejects.toThrow()
    })

    it('should not store user if response is missing user data', async () => {
      const mockResponse = {
        data: {
          message: 'Success but no user',
        },
      }

      api.post.mockResolvedValueOnce(mockResponse)

      const result = await authService.login({ email: 'test', password: 'test' })

      expect(localStorage.getItem('user')).toBeNull()
      expect(result.user).toBeUndefined()
    })
  })

  describe('logout', () => {
    it('should logout and clear localStorage', async () => {
      localStorage.setItem('user', JSON.stringify({ id: '123' }))

      // Mock window.location
      delete window.location
      window.location = { href: vi.fn() }

      api.post.mockResolvedValueOnce({})

      await authService.logout()

      expect(api.post).toHaveBeenCalledWith('/auth/logout')
      expect(localStorage.getItem('user')).toBeNull()
      expect(window.location.href).toBe('/login')
    })

    it('should clear localStorage even if API call fails', async () => {
      localStorage.setItem('user', JSON.stringify({ id: '123' }))

      delete window.location
      window.location = { href: vi.fn() }

      api.post.mockRejectedValueOnce(new Error('Network error'))

      await authService.logout()

      expect(localStorage.getItem('user')).toBeNull()
      expect(window.location.href).toBe('/login')
    })
  })

  describe('refresh_token', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        data: {
          message: 'Token refrescado',
        },
      }

      api.post.mockResolvedValueOnce(mockResponse)

      const result = await authService.refresh_token()

      expect(api.post).toHaveBeenCalledWith('/auth/refresh')
      expect(result).toEqual(mockResponse.data)
    })

    it('should logout on refresh failure', async () => {
      const logoutSpy = vi.spyOn(authService, 'logout').mockImplementation(() => {})

      api.post.mockRejectedValueOnce(new Error('Refresh failed'))

      await expect(authService.refresh_token()).rejects.toThrow()
      expect(logoutSpy).toHaveBeenCalled()
    })
  })

  describe('getCurrentUser', () => {
    it('should return user from localStorage', () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      localStorage.setItem('user', JSON.stringify(mockUser))

      const user = authService.getCurrentUser()

      expect(user).toEqual(mockUser)
    })

    it('should return null if no user in localStorage', () => {
      const user = authService.getCurrentUser()

      expect(user).toBeNull()
    })

    it('should throw error if localStorage data is invalid JSON', () => {
      localStorage.setItem('user', 'invalid json')

      expect(() => authService.getCurrentUser()).toThrow()
    })
  })

  describe('isAuthenticated', () => {
    it('should return true if user exists in localStorage', () => {
      localStorage.setItem('user', JSON.stringify({ id: '123' }))

      expect(authService.isAuthenticated()).toBe(true)
    })

    it('should return false if no user in localStorage', () => {
      expect(authService.isAuthenticated()).toBe(false)
    })
  })
})
