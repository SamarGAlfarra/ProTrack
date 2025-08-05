// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // بورت الواجهة
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // بورت لارافيل
        changeOrigin: true,
      },
    },
  },
})
