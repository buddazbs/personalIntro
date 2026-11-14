import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { EASE } from '../lib/colors'
import { SplitHeading } from '../components/Reveal'
import { Calendar } from './Calendar'
import { Cups } from './Cups'
import { CUISINES, emptyRequest, FORMATS, formatLabel, formatMessage, LIMITS, normalizeNick, validate, type DateRequest, type Errors, type Field } from './schema'
import { humanDate, slotsFor, TZ_LABEL } from './schedule'

/**
 * Анкета «записаться на свидание»: пять шагов + проверка. Черновик живёт в sessionStorage,
 * отправка — POST на Worker (VITE_DATE_ENDPOINT), который пересылает всё в Telegram.
 */

const ENDPOINT = import.meta.env.VITE_DATE_ENDPOINT
const DRAFT_KEY = 'date-draft'
const DIRECT = 'https://t.me/buddhazbs'

type Draft = { req: DateRequest; step: number; startedAt: number }
type Status = { kind: 'idle' | 'sending' | 'done' } | { kind: 'error'; message: string }

const STEPS = [
  { kicker: 'приглашение', title: 'давай встретимся', fields: [] },
  { kicker: 'вкусы', title: 'что тебе по вкусу', fields: ['cuisines'] },
  { kicker: 'настроение', title: 'каким будет вечер', fields: ['format', 'formatOwn'] },
  { kicker: 'время', title: 'когда тебе удобно', fields: ['date', 'time'] },
  { kicker: 'контакт', title: 'как тебя найти', fields: ['nick'] },
  { kicker: 'почти всё', title: 'всё верно', fields: [] },
] as const satisfies readonly { kicker: string; title: string; fields: readonly Field[] }[]

function loadDraft(): Draft {
  try {
    const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? 'null') as Draft | null
    if (d?.req && typeof d.step === 'number') return { ...d, req: { ...emptyRequest(), ...d.req } }
  } catch {
    /* повреждённый черновик — начинаем заново */
  }
  return { req: emptyRequest(), step: 0, startedAt: Date.now() }
}

// ── мелкие элементы ──

const inputCls =
  'w-full rounded-2xl border border-line bg-cream/[0.03] px-5 py-4 text-lg text-cream placeholder:text-cream/30 transition-colors duration-300 focus:border-clay/70 focus:bg-cream/[0.05] focus-visible:outline-none'

function Chip({ on, onClick, children, removable }: { on: boolean; onClick: () => void; children: ReactNode; removable?: boolean }) {
  return (
    <motion.button
      type="button"
      layout
      onClick={onClick}
      aria-pressed={on}
      whileTap={{ scale: 0.94 }}
      className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-[0.95rem] transition-colors duration-300 ${
        on ? 'border-clay/70 bg-clay/15 text-cream' : 'border-line text-cream-2 hover:border-cream/30 hover:text-cream'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${on ? 'bg-clay' : 'bg-cream/20'}`} />
      {children}
      {removable && <span aria-hidden className="text-mute">×</span>}
    </motion.button>
  )
}

function FieldError({ text }: { text?: string | undefined }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.p role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-sm text-clay">
          {text}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <span className="kicker text-[0.62rem] text-cream-2">{children}</span>
      {hint && <span className="text-xs text-mute">{hint}</span>}
    </div>
  )
}

/** Фон: тёплое свечение и редкие пылинки в свете, как над свечой */
function Ambient() {
  const motes = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        left: `${(i * 61) % 100}%`,
        size: 1.5 + ((i * 7) % 3),
        t: `${16 + ((i * 5) % 12)}s`,
        d: `${-((i * 3.7) % 20)}s`,
        dx: `${((i * 13) % 9) - 4}vw`,
      })),
    [],
  )
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-[#110d0f]">
      <motion.div
        className="absolute -top-[30%] -left-[20%] h-[80vmax] w-[80vmax] rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(182,147,176,0.2), transparent)' }}
        animate={{ x: ['0%', '6%', '0%'], y: ['0%', '5%', '0%'], scale: [1, 1.06, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-[25%] -bottom-[35%] h-[85vmax] w-[85vmax] rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(227,155,120,0.16), transparent)' }}
        animate={{ x: ['0%', '-5%', '0%'], y: ['0%', '-4%', '0%'], scale: [1, 1.08, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* «свеча» — мягкое дыхание света внизу */}
      <motion.div
        className="absolute bottom-[-20%] left-1/2 h-[55vmax] w-[55vmax] -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(235,203,130,0.1), transparent)' }}
        animate={{ opacity: [0.7, 1, 0.8, 1, 0.7] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      {motes.map((m, i) => (
        <span
          key={i}
          className="mote"
          style={{ left: m.left, width: m.size, height: m.size, ['--t' as string]: m.t, ['--d' as string]: m.d, ['--dx' as string]: m.dx }}
        />
      ))}
    </div>
  )
}

// ── сама анкета ──

export default function DateFlow({ onClose }: { onClose: () => void }) {
  const [draft, setDraft] = useState(loadDraft)
  const { req, step, startedAt } = draft
  const [dir, setDir] = useState(1)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [custom, setCustom] = useState('')
  const honeypot = useRef<HTMLInputElement>(null)
  const ownRef = useRef<HTMLInputElement>(null)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status.kind !== 'done') sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }, [draft, status.kind])

  const set = <K extends Field>(k: K, v: DateRequest[K]) => {
    setDraft((d) => ({ ...d, req: { ...d.req, [k]: v } }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }
  const goto = (n: number) => {
    setDir(n > step ? 1 : -1)
    setDraft((d) => ({ ...d, step: n }))
    scroller.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const stepErrors = (n: number) => {
    const { errors: all } = validate(req)
    const only: Errors = {}
    for (const f of STEPS[n]?.fields ?? []) if (all[f]) only[f] = all[f]
    return only
  }
  const next = () => {
    const e = stepErrors(step)
    if (Object.keys(e).length) {
      setErrors(e)
      return
    }
    goto(step + 1)
  }

  const toggleCuisine = (c: string) => set('cuisines', req.cuisines.includes(c) ? req.cuisines.filter((x) => x !== c) : [...req.cuisines, c])
  const addCustom = () => {
    const v = custom.trim().toLowerCase().slice(0, LIMITS.cuisine)
    if (v && !req.cuisines.includes(v) && req.cuisines.length < LIMITS.cuisines) set('cuisines', [...req.cuisines, v])
    setCustom('')
  }
  const customCuisines = req.cuisines.filter((c) => !(CUISINES as readonly string[]).includes(c))

  const pickDate = (d: string) => {
    set('date', d)
    if (!slotsFor(d).includes(req.time)) set('time', '')
  }

  const onEnter = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      next()
    }
  }

  const send = async () => {
    const { data, errors: all } = validate(req)
    if (Object.keys(all).length) {
      setErrors(all)
      const bad = STEPS.findIndex((s) => s.fields.some((f: Field) => all[f]))
      if (bad >= 0) goto(bad)
      return
    }
    setStatus({ kind: 'sending' })
    try {
      if (!ENDPOINT) {
        if (!import.meta.env.DEV) throw new Error('not-configured')
        // локально без Worker'а: показываем сообщение в консоли и делаем вид, что отправили
        console.info('[date] без VITE_DATE_ENDPOINT, сообщение:\n' + formatMessage(data))
        await new Promise((r) => setTimeout(r, 900))
      } else {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ...data, startedAt, website: honeypot.current?.value ?? '' }),
        })
        if (res.status === 422) {
          const body = (await res.json().catch(() => ({}))) as { fields?: Errors }
          setStatus({ kind: 'idle' })
          setErrors(body.fields ?? {})
          const bad = STEPS.findIndex((s) => s.fields.some((f: Field) => body.fields?.[f]))
          if (bad >= 0) goto(bad)
          return
        }
        if (res.status === 429) throw new Error('Слишком много попыток подряд. Подожди минутку и попробуй ещё раз.')
        if (res.status === 400) throw new Error('Чуть медленнее — анкета заполнена слишком быстро. Попробуй ещё раз через пару секунд.')
        if (!res.ok) throw new Error('not-ok')
      }
      sessionStorage.removeItem(DRAFT_KEY)
      setStatus({ kind: 'done' })
      scroller.current?.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      const msg = err instanceof Error && err.message.length > 12 ? err.message : 'Не получилось отправить — похоже, связь подвела.'
      setStatus({ kind: 'error', message: msg })
    }
  }

  const done = status.kind === 'done'
  const progress = done ? 1 : step / (STEPS.length - 1)
  const current = STEPS[step] ?? STEPS[0]
  const formatTitle = req.format ? formatLabel(req) : undefined

  return (
    <div className="absolute inset-0">
      <Ambient />

      <div ref={scroller} data-lenis-prevent className="relative h-full overflow-y-auto overscroll-contain">
        {/* шапка: назад, шаги, прогресс */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-[#110d0f] from-75% to-[#110d0f]/0 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6 sm:px-8">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <button type="button" onClick={onClose} className="group flex items-center gap-3 rounded-full py-2 pr-3 text-sm text-cream-2 transition-colors hover:text-cream">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-line transition-transform duration-500 group-hover:-translate-x-1">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M10.5 6 H1.5 M5 2.5 L1.5 6 L5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              вернуться на сайт
            </button>
            {!done && (
              <span className="kicker text-[0.62rem] text-mute tabular-nums">
                <span className="text-cream">{String(step + 1).padStart(2, '0')}</span> / {String(STEPS.length).padStart(2, '0')}
              </span>
            )}
          </div>
          <div className="mx-auto mt-4 h-px max-w-2xl overflow-hidden bg-line">
            <motion.div className="h-full origin-left bg-gradient-to-r from-plum via-clay to-butter" initial={false} animate={{ scaleX: done ? 1 : (step + 1) / STEPS.length }} transition={{ duration: 0.9, ease: EASE }} />
          </div>
        </div>

        <div className="mx-auto flex min-h-[calc(100%-6rem)] max-w-2xl flex-col px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-8">
          <div className="flex justify-center pt-2 pb-8">
            <Cups progress={progress} done={done} />
          </div>

          <p className="sr-only" aria-live="polite">
            {done ? 'Анкета отправлена' : `Шаг ${step + 1} из ${STEPS.length}: ${current.title}`}
          </p>

          <AnimatePresence mode="wait" custom={dir} initial={false}>
            {done ? (
              <motion.section key="done" initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1.1, ease: EASE, delay: 0.4 }} className="flex flex-1 flex-col items-center text-center">
                <span className="kicker text-[0.62rem] text-clay">отправлено</span>
                <SplitHeading as="h2" text="до встречи" className="mt-4 font-serif text-[clamp(2.8rem,8vw,5rem)] leading-[1] font-light tracking-[-0.02em]" />
                <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-cream-2">
                  Я получил твою анкету. Напишу тебе в Telegram <span className="text-cream">{normalizeNick(req.nick)}</span> совсем скоро — договоримся о деталях.
                </p>
                <p className="mt-3 font-serif text-xl text-butter italic">{humanDate(req.date)}, {req.time}</p>
                <button type="button" onClick={onClose} className="mt-12 rounded-full border border-line px-7 py-3.5 text-sm text-cream transition-colors hover:border-cream/40 hover:bg-cream/5">
                  вернуться на сайт
                </button>
              </motion.section>
            ) : (
              <motion.section
                key={step}
                custom={dir}
                initial="enter"
                animate="center"
                exit="exit"
                variants={{
                  enter: (d: number) => ({ opacity: 0, x: d * 48, filter: 'blur(6px)' }),
                  center: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE } },
                  exit: (d: number) => ({ opacity: 0, x: -d * 48, filter: 'blur(6px)', transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } }),
                }}
                className="flex flex-1 flex-col"
              >
                <div className="mb-10 flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-mute">
                    <span className="h-px w-10 bg-clay" />
                    <span className="kicker text-[0.62rem]">{current.kicker}</span>
                  </div>
                  <SplitHeading as="h2" text={current.title} className="font-serif text-[clamp(2.6rem,7.5vw,4.6rem)] leading-[0.98] font-light tracking-[-0.02em]" />
                </div>

                {step === 0 && (
                  <div className="flex flex-col gap-10">
                    <p className="max-w-lg text-[1.08rem] leading-relaxed text-cream-2">
                      Если ты здесь — значит, что-то откликнулось. Пять коротких вопросов: вкусы, настроение, время и как тебя найти. <span className="text-cream">Остальное — моя забота.</span>
                    </p>
                    <label className="block">
                      <Label hint="необязательно">как тебя зовут</Label>
                      <input className={inputCls} value={req.name} maxLength={LIMITS.name} onChange={(e) => set('name', e.target.value)} onKeyDown={onEnter} placeholder="можно только имя" autoComplete="given-name" />
                    </label>
                  </div>
                )}

                {step === 1 && (
                  <div className="flex flex-col gap-10">
                    <div>
                      <Label hint="можно несколько">кухня</Label>
                      <motion.div layout className="flex flex-wrap gap-2">
                        {CUISINES.map((c) => (
                          <Chip key={c} on={req.cuisines.includes(c)} onClick={() => toggleCuisine(c)}>
                            {c}
                          </Chip>
                        ))}
                        <AnimatePresence>
                          {customCuisines.map((c) => (
                            <motion.span key={c} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                              <Chip on removable onClick={() => toggleCuisine(c)}>
                                {c}
                              </Chip>
                            </motion.span>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                      <div className="mt-4 flex gap-2">
                        <input
                          className={`${inputCls} py-3 text-base`}
                          value={custom}
                          maxLength={LIMITS.cuisine}
                          onChange={(e) => setCustom(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addCustom()
                            }
                          }}
                          placeholder="свой вариант — например, корейская"
                          aria-label="Свой вариант кухни"
                        />
                        <button type="button" onClick={addCustom} disabled={!custom.trim()} className="shrink-0 rounded-2xl border border-line px-5 text-sm text-cream transition hover:border-clay/60 disabled:opacity-30">
                          добавить
                        </button>
                      </div>
                      <FieldError text={errors.cuisines} />
                    </div>
                    <label className="block">
                      <Label hint="необязательно">чего точно не ешь</Label>
                      <input className={inputCls} value={req.avoid} maxLength={LIMITS.avoid} onChange={(e) => set('avoid', e.target.value)} onKeyDown={onEnter} placeholder="аллергии, нелюбимое — чтобы не промахнуться" />
                      <span className="mt-2 block text-xs text-mute">У меня, например, аллергия на кофе — так что точно не кофейня.</span>
                    </label>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <div role="radiogroup" aria-label="Формат встречи" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {FORMATS.map((f) => {
                        const on = req.format === f.id
                        return (
                          <motion.button
                            key={f.id}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => {
                              set('format', f.id)
                              // свой вариант: сразу ставим курсор в поле, когда оно раскроется
                              if (f.id === 'own') setTimeout(() => ownRef.current?.focus({ preventScroll: true }), 350)
                            }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative overflow-hidden rounded-3xl border p-5 text-left transition-colors duration-300 ${on ? 'border-clay/70' : 'border-line hover:border-cream/25'} ${f.id === 'own' ? 'border-dashed sm:col-span-2' : ''}`}
                          >
                            {on && <motion.span layoutId="format-bg" className="absolute inset-0 bg-gradient-to-br from-clay/20 via-plum/10 to-transparent" transition={{ type: 'spring', stiffness: 380, damping: 34 }} />}
                            <span className="relative flex items-center gap-2.5 font-serif text-[1.65rem] leading-tight">
                              {f.id === 'own' && <span className={`grid h-6 w-6 place-items-center rounded-full border text-base leading-none transition-transform duration-500 ${on ? 'border-clay bg-clay text-ink' : 'border-cream/30 text-cream-2'}`}>+</span>}
                              {f.title}
                            </span>
                            <span className="relative mt-1 block text-sm text-cream-2">{f.hint}</span>
                          </motion.button>
                        )
                      })}
                    </div>
                    <FieldError text={errors.format} />
                    <AnimatePresence initial={false}>
                      {req.format === 'own' && (
                        <motion.label
                          key="own"
                          className="block overflow-hidden"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.5, ease: EASE }}
                        >
                          <div className="pt-6">
                            <Label hint={`${req.formatOwn.length} / ${LIMITS.formatOwn}`}>твой вариант</Label>
                            <input
                              ref={ownRef}
                              className={errors.formatOwn ? inputCls.replace('border-line', 'border-clay/70') : inputCls}
                              value={req.formatOwn}
                              maxLength={LIMITS.formatOwn}
                              onChange={(e) => set('formatOwn', e.target.value)}
                              onKeyDown={onEnter}
                              placeholder="например, каток и горячий шоколад"
                              aria-invalid={!!errors.formatOwn}
                            />
                            <FieldError text={errors.formatOwn} />
                          </div>
                        </motion.label>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {step === 3 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex gap-4 rounded-3xl border border-butter/20 bg-butter/[0.05] p-5">
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="mt-0.5 shrink-0 text-butter" aria-hidden>
                        <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M11 6 V11 L14.5 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                      <p className="text-[0.95rem] leading-relaxed text-cream-2">
                        Я работаю 5/2 и в будни освобождаюсь к 18:00, поэтому <span className="text-cream">в будни — с 19:00</span>. В выходные и праздники{' '}
                        <span className="text-cream">— в любое время</span>. Время {TZ_LABEL}.
                      </p>
                    </div>

                    <Calendar value={req.date} onChange={pickDate} />
                    <FieldError text={errors.date} />

                    <AnimatePresence mode="wait">
                      {req.date && (
                        <motion.div key={req.date} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5, ease: EASE }}>
                          <Label hint={TZ_LABEL}>{humanDate(req.date)}</Label>
                          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                            {slotsFor(req.date).map((t) => {
                              const on = req.time === t
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => set('time', t)}
                                  aria-pressed={on}
                                  className={`relative rounded-xl border py-2.5 text-sm tabular-nums transition-colors duration-300 ${on ? 'border-transparent text-ink' : 'border-line text-cream-2 hover:border-cream/30 hover:text-cream'}`}
                                >
                                  {on && <motion.span layoutId="slot-sel" className="absolute inset-0 rounded-xl bg-clay" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                                  <span className="relative">{t}</span>
                                </button>
                              )
                            })}
                          </div>
                          <FieldError text={errors.time} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {step === 4 && (
                  <div className="flex flex-col gap-10">
                    <label className="block">
                      <Label hint="обязательно">ник в telegram</Label>
                      <div className={`flex items-center rounded-2xl border bg-cream/[0.03] transition-colors duration-300 focus-within:border-clay/70 ${errors.nick ? 'border-clay/70' : 'border-line'}`}>
                        <span className="pl-5 text-lg text-mute">@</span>
                        <input
                          className="w-full bg-transparent py-4 pr-5 pl-1 text-lg text-cream placeholder:text-cream/30 focus-visible:outline-none"
                          value={req.nick.replace(/^@/, '')}
                          maxLength={33}
                          onChange={(e) => set('nick', e.target.value.replace(/\s/g, ''))}
                          onKeyDown={onEnter}
                          placeholder="username"
                          autoComplete="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          inputMode="text"
                          aria-invalid={!!errors.nick}
                          aria-required
                        />
                      </div>
                      <FieldError text={errors.nick} />
                      <span className="mt-2 block text-xs text-mute">Напишу тебе сам — с этого ника всё и начнётся. Найти его: Telegram → Настройки → Имя пользователя.</span>
                    </label>
                    <label className="block">
                      <Label hint={`${req.note.length} / ${LIMITS.note}`}>пара слов от тебя</Label>
                      <textarea className={`${inputCls} min-h-32 resize-none text-base leading-relaxed`} value={req.note} maxLength={LIMITS.note} onChange={(e) => set('note', e.target.value)} placeholder="необязательно — но мне будет приятно" />
                    </label>
                  </div>
                )}

                {step === 5 && (
                  <div className="flex flex-col gap-8">
                    <dl className="glass divide-y divide-line rounded-3xl px-5 sm:px-7">
                      {(
                        [
                          ['имя', req.name || '—', 0],
                          ['кухня', req.cuisines.join(', ') + (req.avoid ? ` · не ест: ${req.avoid}` : ''), 1],
                          ['формат', formatTitle ?? '—', 2],
                          ['когда', req.date ? `${humanDate(req.date)}, ${req.time}` : '—', 3],
                          ['telegram', normalizeNick(req.nick) ?? req.nick, 4],
                          ...(req.note ? ([['от тебя', `«${req.note}»`, 4]] as const) : []),
                        ] as const
                      ).map(([k, v, s]) => (
                        <div key={k} className="flex items-start gap-4 py-4">
                          <dt className="kicker w-20 shrink-0 pt-1 text-[0.58rem] text-mute">{k}</dt>
                          <dd className="min-w-0 flex-1 break-words text-cream">{v}</dd>
                          <button type="button" onClick={() => goto(s)} className="shrink-0 text-xs text-mute underline decoration-line underline-offset-4 transition-colors hover:text-clay">
                            изменить
                          </button>
                        </div>
                      ))}
                    </dl>

                    {/* ловушка для ботов: людям не видна и недоступна с клавиатуры */}
                    <input ref={honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />

                    <p className="text-xs leading-relaxed text-mute">
                      Нажимая «отправить», ты соглашаешься, что ответы один раз уйдут Ивану в Telegram. На сайте они не сохраняются, черновик живёт только в этой вкладке.
                    </p>

                    <AnimatePresence>
                      {status.kind === 'error' && (
                        <motion.div role="alert" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-3xl border border-clay/40 bg-clay/[0.07] p-5 text-sm leading-relaxed text-cream-2">
                          {status.message}{' '}
                          <a
                            href={`${DIRECT}?text=${encodeURIComponent(formatMessage(validate(req).data).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cream underline decoration-clay underline-offset-4"
                          >
                            Можно отправить мне напрямую в Telegram
                          </a>
                          .
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* навигация */}
                <div className="mt-auto flex items-center justify-between gap-4 pt-12">
                  {step > 0 ? (
                    <button type="button" onClick={() => goto(step - 1)} className="rounded-full px-4 py-3 text-sm text-cream-2 transition-colors hover:text-cream">
                      ← назад
                    </button>
                  ) : (
                    <span />
                  )}
                  {step < STEPS.length - 1 ? (
                    <motion.button type="button" onClick={next} whileTap={{ scale: 0.96 }} className="group flex items-center gap-3 rounded-full bg-cream py-3.5 pr-4 pl-7 text-sm font-medium text-ink transition-shadow hover:shadow-[0_10px_40px_-10px_rgba(227,155,120,0.6)]">
                      {step === 0 ? 'начнём' : 'дальше'}
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-cream transition-transform duration-500 group-hover:translate-x-1">→</span>
                    </motion.button>
                  ) : (
                    <motion.button
                      type="button"
                      onClick={send}
                      disabled={status.kind === 'sending'}
                      whileTap={{ scale: 0.96 }}
                      className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-clay to-butter py-3.5 pr-4 pl-7 text-sm font-medium text-ink shadow-[0_12px_50px_-12px_rgba(227,155,120,0.7)] disabled:opacity-60"
                    >
                      {status.kind === 'sending' ? 'отправляю…' : status.kind === 'error' ? 'попробовать ещё раз' : 'отправить приглашение'}
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-cream">
                        {status.kind === 'sending' ? <motion.span className="block h-3 w-3 rounded-full border border-cream border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} /> : '♡'}
                      </span>
                    </motion.button>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
