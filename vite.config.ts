import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Сайт живёт на GitHub Pages по адресу /personalIntro/
export default defineConfig({
  base: '/personalIntro/',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
  },
})
