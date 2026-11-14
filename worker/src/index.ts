/**
 * Посредник между анкетой и Telegram. Токен бота живёт только здесь (секрет Worker'а).
 *
 * POST / {анкета} → проверка → sendMessage в ваш чат.
 * Защита без сторонних скриптов на сайте: проверка Origin, поле-ловушка, минимальное время
 * заполнения, лимит запросов с IP и повторная проверка всех полей и расписания.
 */
import { formatMessage, orderNumber, validate, widgetCaption, widgetData } from '../../src/date/schema'
// HTML-виджет «чек из чайной»; wrangler импортирует .html как строку
import WIDGET_HTML from './widget.html'

interface RateLimit {
  limit(o: { key: string }): Promise<{ success: boolean }>
}

export interface Env {
  TELEGRAM_TOKEN: string
  TELEGRAM_CHAT_ID: string
  /** Через запятую: https://buddazbs.github.io,http://localhost:5173 */
  ALLOWED_ORIGINS: string
  /** "1" — не отправлять, а вернуть текст сообщения (для проверки) */
  DRY_RUN?: string
  /** "0" — слать обычным текстом, без интерактивного виджета */
  WIDGET?: string
  LIMITER?: RateLimit
}

/** Быстрее этого человек анкету не заполнит — значит, бот */
const MIN_FILL_MS = 15_000
const MAX_BODY = 8 * 1024

const json = (body: unknown, status: number, headers: HeadersInit) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, 'content-type': 'application/json; charset=utf-8' } })

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get('origin') ?? ''
    const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
    const cors: HeadersInit = allowed.includes(origin)
      ? { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400', vary: 'origin' }
      : { vary: 'origin' }

    if (req.method === 'OPTIONS') return new Response(null, { status: allowed.includes(origin) ? 204 : 403, headers: cors })
    if (req.method !== 'POST') return json({ error: 'method' }, 405, cors)
    if (!allowed.includes(origin)) return json({ error: 'origin' }, 403, cors)

    const ip = req.headers.get('cf-connecting-ip') ?? 'unknown'
    if (env.LIMITER && !(await env.LIMITER.limit({ key: ip })).success) return json({ error: 'rate' }, 429, cors)

    const raw = await req.text()
    if (raw.length > MAX_BODY) return json({ error: 'size' }, 413, cors)
    let body: Record<string, unknown>
    try {
      body = JSON.parse(raw)
    } catch {
      return json({ error: 'json' }, 400, cors)
    }

    // ловушка: невидимое поле, которое человек не заполнит; боту отвечаем «успехом», чтобы не учился
    if (typeof body.website === 'string' && body.website) return json({ ok: true }, 200, cors)
    const startedAt = Number(body.startedAt)
    if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_MS) return json({ error: 'too_fast' }, 400, cors)

    const { data, errors } = validate(body)
    if (Object.keys(errors).length) return json({ error: 'invalid', fields: errors }, 422, cors)

    const text = formatMessage(data)
    const no = orderNumber()
    const widget = { chat_id: env.TELEGRAM_CHAT_ID, html: WIDGET_HTML, chat_data: widgetData(data, no), caption: widgetCaption(data, no) }
    if (env.DRY_RUN === '1') return json({ ok: true, preview: text, widget: { chat_data: widget.chat_data, caption: widget.caption } }, 200, cors)

    // сначала интерактивный «чек» (Bot API 10.4); если клиент/API его не принял — обычным сообщением
    if (env.WIDGET !== '0') {
      const res = await tg(env, 'sendWidget', widget)
      if (res.ok) return json({ ok: true }, 200, cors)
      console.error('sendWidget', res.status, await res.text())
    }
    const res = await tg(env, 'sendMessage', { chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: 'HTML', link_preview_options: { is_disabled: true } })
    if (!res.ok) {
      console.error('sendMessage', res.status, await res.text())
      return json({ error: 'telegram' }, 502, cors)
    }
    return json({ ok: true }, 200, cors)
  },
}

const tg = (env: Env, method: string, body: unknown) =>
  fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
