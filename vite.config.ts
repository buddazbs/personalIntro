import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * CSP в index.html разрешает сетевые запросы только к своему домену.
 * Анкете нужен ещё адрес Worker'а — добавляем ровно его origin, если он задан.
 */
function cspConnect(endpoint: string | undefined): Plugin {
  return {
    name: 'csp-connect-endpoint',
    transformIndexHtml(html) {
      if (!endpoint) return html
      const origin = new URL(endpoint).origin
      return html.replace("connect-src 'self'", `connect-src 'self' ${origin}`)
    },
  }
}

// Сайт живёт на GitHub Pages по адресу /personalIntro/
export default defineConfig(({ mode }) => {
  // loadEnv берёт и .env-файлы, и переменные окружения CI с префиксом VITE_
  const env = loadEnv(mode, '.', 'VITE_')
  return {
    base: '/personalIntro/',
    plugins: [react(), tailwindcss(), cspConnect(env.VITE_DATE_ENDPOINT || undefined)],
    build: {
      target: 'es2022',
      assetsInlineLimit: 0,
    },
  }
})
