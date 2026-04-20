import { defineConfig } from 'vite'
import { reactRouter } from '@react-router/dev/vite'

export default defineConfig({
  plugins: [reactRouter()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {}
    }
  },
  // ✅ OPTIMIZACIONES DE PRODUCCIÓN
  build: {
    // esbuild está incluido en Vite (no requiere instalación extra)
    minify: 'esbuild',
    esbuildOptions: {
      drop: ['console', 'debugger'],
    },
    // Framework mode gestiona el code splitting automáticamente
    rollupOptions: {},
    // Aumentar límite de advertencia
    chunkSizeWarningLimit: 1000,
    // Source maps solo en dev
    sourcemap: false,
  },
  // ✅ OPTIMIZAR DEPENDENCIAS
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material'
    ]
  }
})