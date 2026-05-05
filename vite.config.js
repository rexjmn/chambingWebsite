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
    // Evita FOUC por estilos en chunks async: genera un CSS único inicial.
    cssCodeSplit: false,
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
  // No incluir @mui/icons-material aquí: el barrel abre miles de archivos (EMFILE en Windows/SSR).
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
    ],
  },
  // Empaquetar MUI en el bundle SSR reduce handles de archivos vs resolver cada icono suelto.
  ssr: {
    noExternal: [
      '@mui/material',
      '@mui/system',
      '@emotion/react',
      '@emotion/styled',
    ],
  },
})