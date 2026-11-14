/**
 * Расписание свиданий. Чистые функции без DOM — их импортирует и сайт, и Worker (worker/),
 * поэтому правила проверяются одинаково на клиенте и на сервере.
 *
 * Всё считается по Москве (UTC+3, без перехода на летнее время с 2014 года).
 * Будни: с 19:00 (работаю 5/2 до 18:00). Выходные и праздники: весь день.
 */

export const TZ_LABEL = 'по Москве'
const MSK_OFFSET_MS = 3 * 60 * 60 * 1000

/** Первое время встречи в будни, минуты от полуночи */
export const WEEKDAY_FROM = 19 * 60
/** Первое время встречи в выходные и праздники */
export const DAYOFF_FROM = 10 * 60
/** Последнее время начала встречи */
export const LAST_START = 22 * 60
export const SLOT_STEP = 30
/** На сколько дней вперёд можно записаться */
export const HORIZON_DAYS = 60
/** Минимальный запас до встречи, минуты — чтобы успеть ответить и доехать */
export const LEAD_MINUTES = 3 * 60

/**
 * Государственные праздники (ст. 112 ТК РФ). Если праздник, кроме январских, выпадает на выходной,
 * следующий рабочий день становится выходным — это правило считается автоматически.
 */
const HOLIDAYS = ['01-01', '01-02', '01-03', '01-04', '01-05', '01-06', '01-07', '01-08', '02-23', '03-08', '05-01', '05-09', '06-12', '11-04']

/**
 * Переносы выходных из постановлений Правительства, которые правилом не вычислить.
 * Обновлять раз в год, когда выходит производственный календарь.
 */
export const EXTRA_DAYS_OFF = new Set<string>([
  '2026-12-31', // перенос с 4 января 2026
])
/** Рабочие субботы/воскресенья по переносам — в них действуют будничные правила */
export const EXTRA_WORKDAYS = new Set<string>([])

// ── даты в виде 'YYYY-MM-DD', арифметика в UTC, чтобы не зависеть от пояса браузера ──

const pad = (n: number) => String(n).padStart(2, '0')
export const ymd = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
export const parseYmd = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const d = new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!))
  return ymd(d) === s ? d : null
}
export const addDays = (s: string, n: number) => {
  const d = parseYmd(s)!
  d.setUTCDate(d.getUTCDate() + n)
  return ymd(d)
}
/** 0 — понедельник … 6 — воскресенье */
export const weekday = (s: string) => (parseYmd(s)!.getUTCDay() + 6) % 7

/** Текущий момент по Москве: дата и минуты от полуночи */
export function mskNow(now = Date.now()) {
  const d = new Date(now + MSK_OFFSET_MS)
  return { date: ymd(d), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() }
}

function isHoliday(s: string) {
  return HOLIDAYS.includes(s.slice(5))
}

/** Перенос: праздник (не январский) выпал на субботу/воскресенье → ближайший понедельник… */
function isTransferredHoliday(s: string) {
  if (weekday(s) >= 5) return false
  // идём назад по подряд идущим нерабочим дням и ищем «потерянные» праздники
  let lost = 0
  let cursor = addDays(s, -1)
  while (weekday(cursor) >= 5 || isHoliday(cursor)) {
    if (weekday(cursor) >= 5 && isHoliday(cursor) && cursor.slice(5, 7) !== '01') lost++
    cursor = addDays(cursor, -1)
  }
  if (!lost) return false
  // этот будний день — какой по счёту после выходных? (праздники-будни внутри серии тоже считаются)
  let index = 0
  let c = addDays(cursor, 1)
  while (c !== s) {
    if (weekday(c) < 5 && !isHoliday(c)) index++
    c = addDays(c, 1)
  }
  return index < lost
}

/** Свободен ли весь день (выходной, праздник, перенос) */
export function isDayOff(s: string) {
  if (EXTRA_WORKDAYS.has(s)) return false
  if (EXTRA_DAYS_OFF.has(s)) return true
  return weekday(s) >= 5 || isHoliday(s) || isTransferredHoliday(s)
}

export const formatTime = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
export const parseTime = (t: string) => {
  const m = /^(\d{2}):(\d{2})$/.exec(t)
  return m ? +m[1]! * 60 + +m[2]! : NaN
}

/** Доступные слоты на дату с учётом «сейчас» */
export function slotsFor(s: string, now = Date.now()): string[] {
  const { date: today, minutes } = mskNow(now)
  if (s < today || s > addDays(today, HORIZON_DAYS)) return []
  const out: string[] = []
  const from = isDayOff(s) ? DAYOFF_FROM : WEEKDAY_FROM
  // запас считаем в «минутах от начала сегодняшнего дня», чтобы он корректно переходил через полночь
  const dayShift = s === today ? 0 : s === addDays(today, 1) ? 24 * 60 : Infinity
  for (let m = from; m <= LAST_START; m += SLOT_STEP) {
    if (m + dayShift < minutes + LEAD_MINUTES) continue
    out.push(formatTime(m))
  }
  return out
}

export function isSlotAvailable(date: string, time: string, now = Date.now()) {
  return !!parseYmd(date) && slotsFor(date, now).includes(time)
}

const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const WEEKDAYS_LONG = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье']

/** «суббота, 22 ноября» */
export function humanDate(s: string) {
  const d = parseYmd(s)
  if (!d) return s
  return `${WEEKDAYS_LONG[weekday(s)]}, ${d.getUTCDate()} ${MONTHS_GEN[d.getUTCMonth()]}`
}
