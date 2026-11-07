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
      // En `npm run dev` no hay PHP: las llamadas a /api se reenvían a un servidor
      // que sí lo tenga (por defecto, la API antigua de Vercel).
      // Para usar la de Hostinger, pon VITE_API_PROXY=https://tudominio.com en .env.local
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY || 'https://asociacion-win95.vercel.app',
          changeOrigin: true,
        },
      },
    },
  }
})
