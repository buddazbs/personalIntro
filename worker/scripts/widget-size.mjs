// Проверка лимитов Telegram для виджета: ≤32768 байт HTML и ≤4096 байт после zlib уровня 9.
// Запуск: npm run widget:size (из папки worker)
import { readFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const html = readFileSync(new URL('../src/widget.html', import.meta.url))
const packed = deflateSync(html, { level: 9 }).length
console.log(`widget.html: ${html.length} / 32768 байт, сжатый ${packed} / 4096 байт`)
if (html.length > 32768 || packed > 4096) {
  console.error('Виджет не влезает в лимиты Telegram')
  process.exit(1)
}
