/**
 * Анкета «записаться на свидание»: варианты ответов, проверка и текст сообщения в Telegram.
 * Общая для сайта и Worker'а — сервер не доверяет клиенту и проверяет всё заново.
 */
import { humanDate, isSlotAvailable, TZ_LABEL } from './schedule'

export const CUISINES = ['итальянская', 'японская', 'грузинская', 'паназиатская', 'средиземноморская', 'русская'] as const

export const FORMATS = [
  { id: 'dinner', title: 'Ужин', hint: 'ресторан, свечи, долгий разговор' },
  { id: 'walk', title: 'Прогулка', hint: 'город, набережная, вечерний воздух' },
  { id: 'tea', title: 'Чайная', hint: 'пуэр, тишина и никуда не спешить' },
  { id: 'culture', title: 'Выставка или театр', hint: 'а потом — обсудить за ужином' },
  { id: 'surprise', title: 'Удиви меня', hint: 'доверяю тебе выбор' },
] as const
export type FormatId = (typeof FORMATS)[number]['id']

export const LIMITS = { name: 40, cuisine: 40, cuisines: 10, avoid: 200, note: 500 } as const
/** Ник Telegram: 4–32 символа, латиница, цифры и «_», начинается с буквы */
export const NICK_RE = /^@?([a-zA-Z][a-zA-Z0-9_]{3,31})$/

export type DateRequest = {
  name: string
  cuisines: string[]
  avoid: string
  format: FormatId | ''
  date: string
  time: string
  nick: string
  note: string
}

export const emptyRequest = (): DateRequest => ({ name: '', cuisines: [], avoid: '', format: '', date: '', time: '', nick: '', note: '' })

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
    date: clean(o.date, 10),
    time: clean(o.time, 5),
    nick: normalizeNick(clean(o.nick, 40)) ?? clean(o.nick, 40),
    note: clean(o.note, LIMITS.note),
  }
  const errors: Errors = {}
  if (!data.cuisines.length) errors.cuisines = 'Выбери хотя бы одну кухню или впиши свою'
  if (!data.format) errors.format = 'Выбери формат'
  if (!data.date) errors.date = 'Выбери день'
  else if (!data.time) errors.time = 'Выбери время'
  else if (!isSlotAvailable(data.date, data.time, now)) errors.time = 'Это время уже недоступно — выбери другое'
  if (!normalizeNick(data.nick)) errors.nick = 'Нужен ник в Telegram: латиница, цифры и «_», от 4 символов'
  return { data, errors }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Текст сообщения (Telegram, parse_mode=HTML) */
export function formatMessage(r: DateRequest) {
  const nick = normalizeNick(r.nick) ?? r.nick
  const format = FORMATS.find((f) => f.id === r.format)?.title ?? '—'
  const lines = [
    '🍵 <b>Запись на свидание</b>',
    '',
    `<b>От:</b> <a href="https://t.me/${esc(nick.slice(1))}">${esc(nick)}</a>${r.name ? ` · ${esc(r.name)}` : ''}`,
    `<b>Когда:</b> ${esc(humanDate(r.date))}, ${esc(r.time)} (${TZ_LABEL})`,
    `<b>Формат:</b> ${esc(format)}`,
    `<b>Кухня:</b> ${esc(r.cuisines.join(', '))}`,
  ]
  if (r.avoid) lines.push(`<b>Не ест:</b> ${esc(r.avoid)}`)
  if (r.note) lines.push('', `<i>«${esc(r.note)}»</i>`)
  return lines.join('\n')
}
