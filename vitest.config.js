import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Entorno de testing (jsdom simula un navegador)
    environment: 'jsdom',

    // Archivos de configuración global
    setupFiles: ['./src/test/setup.js'],

    // Globals para no tener que importar describe, it, expect
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.js',
        '**/dist/**',
        '**/*.spec.js',
        '**/*.test.js',
      ],
      // Umbrales mínimos de coverage
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },

    // Mock de imports estáticos
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
