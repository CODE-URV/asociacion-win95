import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Si estás desplegando en Vercel, la base será '/', de lo contrario (Pages), será '/asociacion-win95/'
  base: process.env.VERCEL ? '/' : '/asociacion-win95/',
})
