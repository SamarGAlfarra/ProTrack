// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // keep your current port
    proxy: {
      '/api': 'http://127.0.0.1:8000', // Laravel
    },
  },
})
