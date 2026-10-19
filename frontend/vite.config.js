import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://127.0.0.1:8000',
      '/usuarios': 'http://127.0.0.1:8000',
      '/proyectos': 'http://127.0.0.1:8000',
      '/permisos': 'http://127.0.0.1:8000',
      '/historial': 'http://127.0.0.1:8000',
      '/reportes': 'http://127.0.0.1:8000',
      '/salud': 'http://127.0.0.1:8000',
    },
  },
})
