import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { EASE } from '../lib/colors'
import { addDays, HORIZON_DAYS, isDayOff, mskNow, parseYmd, slotsFor, weekday } from './schedule'

const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
const WD = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']

const monthKey = (s: string) => s.slice(0, 7)
const shiftMonth = (key: string, n: number) => {
  const [y, m] = key.split('-').map(Number) as [number, number]
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/** Календарь по Москве: недоступные дни погашены, выходные и праздники отмечены точкой «весь день» */
export function Calendar({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const today = mskNow().date
  const last = addDays(today, HORIZON_DAYS)
  const [month, setMonth] = useState(() => monthKey(value || today))
  const [dir, setDir] = useState(1)

  const days = useMemo(() => {
    const first = `${month}-01`
    const lead = weekday(first)
    const out: (string | null)[] = Array.from({ length: lead }, () => null)
    for (let d = first; monthKey(d) === month; d = addDays(d, 1)) out.push(d)
    return out
  }, [month])

  const go = (n: number) => {
    setDir(n)
    setMonth((m) => shiftMonth(m, n))
  }
  const canPrev = month > monthKey(today)
  const canNext = month < monthKey(last)
  const [y, m] = month.split('-').map(Number) as [number, number]

  return (
    <div className="glass rounded-3xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => go(-1)} disabled={!canPrev} aria-label="Предыдущий месяц" className="grid h-10 w-10 place-items-center rounded-full text-cream transition hover:bg-cream/10 disabled:opacity-20">
          ‹
        </button>
        <div className="relative h-7 flex-1 overflow-hidden text-center">
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div
              key={month}
              custom={dir}
              className="font-serif text-2xl italic"
              initial={{ y: dir * 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -dir * 24, opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              aria-live="polite"
            >
              {MONTHS[m - 1]} {y}
            </motion.div>
          </AnimatePresence>
        </div>
        <button type="button" onClick={() => go(1)} disabled={!canNext} aria-label="Следующий месяц" className="grid h-10 w-10 place-items-center rounded-full text-cream transition hover:bg-cream/10 disabled:opacity-20">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WD.map((w, i) => (
          <div key={w} className={`kicker pb-2 text-[0.55rem] ${i >= 5 ? 'text-butter/80' : 'text-mute'}`}>
            {w}
          </div>
        ))}
        {days.map((d, i) => {
          if (!d) return <div key={`e${i}`} />
          const free = slotsFor(d).length > 0
          const off = isDayOff(d)
          const selected = d === value
          const isToday = d === today
          return (
            <button
              key={d}
              type="button"
              disabled={!free}
              onClick={() => onChange(d)}
              aria-pressed={selected}
              aria-label={`${parseYmd(d)!.getUTCDate()} ${MONTHS[m - 1]}${off ? ', весь день свободен' : ', вечером с 19:00'}`}
              className={`relative grid aspect-square place-items-center rounded-2xl text-[0.95rem] tabular-nums transition-colors duration-300 ${
                selected ? 'text-ink' : free ? 'text-cream hover:bg-cream/[0.07]' : 'text-cream/20'
              } ${isToday && !selected ? 'ring-1 ring-cream/25 ring-inset' : ''}`}
            >
              {selected && <motion.span layoutId="cal-sel" className="absolute inset-0 rounded-2xl bg-clay" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span className="relative">{parseYmd(d)!.getUTCDate()}</span>
              {off && free && <span className={`absolute bottom-[18%] h-1 w-1 rounded-full ${selected ? 'bg-ink/60' : 'bg-butter'}`} />}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[0.72rem] text-mute">
        <span className="flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-butter" /> весь день свободен
        </span>
        <span>без точки — вечер, с 19:00</span>
      </div>
    </div>
  )
}
