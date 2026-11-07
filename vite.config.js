import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    // La web se sirve desde la raíz del dominio en Hostinger (public_html)
    base: '/',
    server: {
      // En `npm run dev` las llamadas a /api van a la API PHP local (`npm run api`).
      // Para usar otra, pon VITE_API_PROXY=https://... en .env.local
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    test: {
      include: ['src/**/*.test.js'],
    },
  }
})
