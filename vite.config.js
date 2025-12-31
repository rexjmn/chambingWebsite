import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
    // Minificación agresiva
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Elimina console.log en producción
        drop_debugger: true,
      }
    },
    // Optimizar chunks
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-core': ['@mui/material', '@mui/system'],
          'mui-icons': ['@mui/icons-material'],
        }
      }
    },
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