/**
 * Анкета «записаться на свидание»: варианты ответов, проверка и тексты для Telegram.
 * Общая для сайта и Worker'а — сервер не доверяет клиенту и проверяет всё заново.
 */
import { humanDate, isSlotAvailable, mskNow, TZ_LABEL } from './schedule'

export const CUISINES = ['итальянская', 'японская', 'грузинская', 'паназиатская', 'средиземноморская', 'русская'] as const

export const FORMATS = [
  { id: 'dinner', title: 'Ужин', hint: 'ресторан, свечи, долгий разговор' },
  { id: 'walk', title: 'Прогулка', hint: 'город, набережная, вечерний воздух' },
  { id: 'tea', title: 'Чайная', hint: 'пуэр, тишина и никуда не спешить' },
  { id: 'culture', title: 'Выставка или театр', hint: 'а потом — обсудить за ужином' },
  { id: 'own', title: 'Предложить свой вариант', hint: 'расскажи, каким ты видишь этот вечер' },
] as const
export type FormatId = (typeof FORMATS)[number]['id']

export const LIMITS = { name: 40, cuisine: 40, cuisines: 10, avoid: 200, formatOwn: 120, note: 500 } as const
/** Ник Telegram: 4–32 символа, латиница, цифры и «_», начинается с буквы */
export const NICK_RE = /^@?([a-zA-Z][a-zA-Z0-9_]{3,31})$/

export type DateRequest = {
  name: string
  cuisines: string[]
  avoid: string
  format: FormatId | ''
  /** Текст своего варианта, когда format === 'own' */
  formatOwn: string
  date: string
  time: string
  nick: string
  note: string
}

export const emptyRequest = (): DateRequest => ({ name: '', cuisines: [], avoid: '', format: '', formatOwn: '', date: '', time: '', nick: '', note: '' })

export type Field = keyof DateRequest
export type Errors = Partial<Record<Field, string>>

const clean = (v: unknown, max: number) =>
  typeof v === 'string'
    ? v
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim()
        .slice(0, max)
    : ''

export const normalizeNick = (v: string) => {
  const m = NICK_RE.exec(v.trim())
  return m ? `@${m[1]}` : null
}

/** Приводит произвольный JSON к анкете и проверяет каждое поле */
export function validate(input: unknown, now = Date.now()): { data: DateRequest; errors: Errors } {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const cuisines = Array.isArray(o.cuisines)
    ? [...new Set(o.cuisines.map((c) => clean(c, LIMITS.cuisine).toLowerCase()).filter(Boolean))].slice(0, LIMITS.cuisines)
    : []
  const format = FORMATS.some((f) => f.id === o.format) ? (o.format as FormatId) : ''
  const data: DateRequest = {
    name: clean(o.name, LIMITS.name),
    cuisines,
    avoid: clean(o.avoid, LIMITS.avoid),
    format,
    formatOwn: format === 'own' ? clean(o.formatOwn, LIMITS.formatOwn) : '',
    date: clean(o.date, 10),
    time: clean(o.time, 5),
    nick: normalizeNick(clean(o.nick, 40)) ?? clean(o.nick, 40),
    note: clean(o.note, LIMITS.note),
  }
  const errors: Errors = {}
  if (!data.cuisines.length) errors.cuisines = 'Выбери хотя бы одну кухню или впиши свою'
  if (!data.format) errors.format = 'Выбери формат'
  else if (data.format === 'own' && !data.formatOwn) errors.formatOwn = 'Опиши свой вариант — хотя бы пару слов'
  if (!data.date) errors.date = 'Выбери день'
  else if (!data.time) errors.time = 'Выбери время'
  else if (!isSlotAvailable(data.date, data.time, now)) errors.time = 'Это время уже недоступно — выбери другое'
  if (!normalizeNick(data.nick)) errors.nick = 'Нужен ник в Telegram: латиница, цифры и «_», от 4 символов'
  return { data, errors }
}

/** Как формат звучит в итогах: свой вариант — её словами */
export const formatLabel = (r: DateRequest) => (r.format === 'own' ? r.formatOwn || 'свой вариант' : (FORMATS.find((f) => f.id === r.format)?.title ?? '—'))

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Обычное текстовое сообщение (parse_mode=HTML) — запасной вариант, если виджет не отправился */
export function formatMessage(r: DateRequest) {
  const nick = normalizeNick(r.nick) ?? r.nick
  const lines = [
    '🍵 <b>Запись на свидание</b>',
    '',
    `<b>От:</b> <a href="https://t.me/${esc(nick.slice(1))}">${esc(nick)}</a>${r.name ? ` · ${esc(r.name)}` : ''}`,
    `<b>Когда:</b> ${esc(humanDate(r.date))}, ${esc(r.time)} (${TZ_LABEL})`,
    `<b>Формат:</b> ${r.format === 'own' ? 'свой вариант — ' : ''}${esc(formatLabel(r))}`,
    `<b>Кухня:</b> ${esc(r.cuisines.join(', '))}`,
  ]
  if (r.avoid) lines.push(`<b>Не ест:</b> ${esc(r.avoid)}`)
  if (r.note) lines.push('', `<i>«${esc(r.note)}»</i>`)
  return lines.join('\n')
}

/** Номер «заказа»: 4 цифры от времени отправки — для шутки, не уникален */
export const orderNumber = (now = Date.now()) => String(Math.floor(now / 1000) % 10000).padStart(4, '0')

/** Короткая подпись под виджетом — её же видно в уведомлении */
export const widgetCaption = (r: DateRequest, no: string) => `🍵 Заказ №${no} от ${normalizeNick(r.nick) ?? r.nick} — ${humanDate(r.date)}, ${r.time}`

const bytes = (s: string) => new TextEncoder().encode(s).length

/**
 * Данные для виджета-«чека» (chat_data, ≤1024 байт UTF-8).
 * Ключи короткие, длинные поля при нехватке места обрезаются с многоточием.
 */
export function widgetData(r: DateRequest, no: string, now = Date.now()) {
  const { date, minutes } = mskNow(now)
  const at = `${date.slice(8, 10)}.${date.slice(5, 7)} · ${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  const d: Record<string, string> = {
    no,
    at,
    k: (normalizeNick(r.nick) ?? r.nick).slice(1),
    n: r.name,
    w: `${humanDate(r.date)} · ${r.time}`,
    f: formatLabel(r),
    o: r.format === 'own' ? '1' : '',
    c: r.cuisines.join(', '),
    a: r.avoid,
    m: r.note,
  }
  for (const key of ['m', 'a', 'c', 'f'] as const) {
    while (bytes(JSON.stringify(d)) > 1024 && d[key]!.length > 1) d[key] = `${d[key]!.slice(0, Math.max(1, d[key]!.length - 20))}…`
  }
  return JSON.stringify(d)
}
