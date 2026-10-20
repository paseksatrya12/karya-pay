import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Bundel semua dependensi saat server dev mulai. Tanpa ini, halaman yang dimuat lazy
  // (mis. pratinjau PDF yang memakai react-dom) memicu optimasi ulang di tengah sesi
  // dan browser mendapat 504 "Outdated Optimize Dep" sehingga halaman kosong.
  optimizeDeps: {
    include: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom', 'react-dom/client', 'react-router-dom'],
  },
})
