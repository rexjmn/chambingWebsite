import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import WorkerCard from './WorkerCard'
import { renderWithProviders, mockWorker } from '../test/test-utils'
import { serviceService } from '../services/serviceService'

// Mock de serviceService
vi.mock('../services/serviceService', () => ({
  serviceService: {
    getTarifasByWorker: vi.fn(),
  },
}))

describe('WorkerCard', () => {
  it('should render worker information', async () => {
    serviceService.getTarifasByWorker.mockResolvedValueOnce({
      tarifa_hora: 15.00,
      moneda: 'USD',
      activo: true,
    })

    renderWithProviders(<WorkerCard worker={mockWorker} />)

    await waitFor(() => {
      expect(screen.getByText(/Worker Test/i)).toBeInTheDocument()
      expect(screen.getByText(/San Salvador/i)).toBeInTheDocument()
    })
  })

  it('should display verification badge for verified workers', async () => {
    serviceService.getTarifasByWorker.mockResolvedValueOnce(null)

    const verifiedWorker = { ...mockWorker, verificado: true }

    renderWithProviders(<WorkerCard worker={verifiedWorker} />)

    await waitFor(() => {
      expect(screen.getByTitle(/Perfil Verificado/i)).toBeInTheDocument()
    })
  })

  it('should load and display worker rates', async () => {
    const mockTarifas = {
      tarifa_hora: 25.00,
      moneda: 'USD',
      activo: true,
      negociable: true,
    }

    serviceService.getTarifasByWorker.mockResolvedValueOnce(mockTarifas)

    renderWithProviders(<WorkerCard worker={mockWorker} />)

    await waitFor(() => {
      expect(screen.getByText(/\$25\.00/)).toBeInTheDocument()
      expect(screen.getByText(/\/hora/)).toBeInTheDocument()
    })
  })

  it('should handle missing worker data gracefully', () => {
    const incompleteWorker = {
      id: '123',
      nombre: 'Test',
    }

    serviceService.getTarifasByWorker.mockResolvedValueOnce(null)

    renderWithProviders(<WorkerCard worker={incompleteWorker} />)

    expect(screen.getByText(/Test/)).toBeInTheDocument()
  })

  it('should not re-render if worker.id stays the same', async () => {
    serviceService.getTarifasByWorker.mockResolvedValue(null)

    const { rerender } = renderWithProviders(<WorkerCard worker={mockWorker} />)

    // Wait for initial render to complete
    await waitFor(() => {
      expect(serviceService.getTarifasByWorker).toHaveBeenCalled()
    })

    const initialCallCount = serviceService.getTarifasByWorker.mock.calls.length

    // Re-render with same worker (same ID)
    rerender(<WorkerCard worker={mockWorker} />)

    // Wait a bit to ensure no new calls are made
    await new Promise(resolve => setTimeout(resolve, 100))

    // Call count should remain the same due to memoization
    expect(serviceService.getTarifasByWorker).toHaveBeenCalledTimes(initialCallCount)
  })
})
