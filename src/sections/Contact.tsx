import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef, useState, type PointerEvent } from 'react'
import { privacyChips, quotes, socials } from '../content'
import { accentColor, C, EASE } from '../lib/colors'
import { Reveal, SectionHeading } from '../components/Reveal'
import { Magnetic } from '../components/Magnetic'
import { Signature } from '../components/Signature'
import { Ghost } from '../components/Ghost'
import { useScrollTo } from '../lib/lenis'
import { openDate } from '../lib/route'

const icons = {
  tg: (
    <svg width="30" height="30" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path d="M3 13.5 L25 4 L21 24 L14 18 L11 22 L11 17 L20 8 L9 16 L3 14 Z" fill="currentColor" />
    </svg>
  ),
  ig: (
    <svg width="30" height="30" viewBox="0 0 28 28" fill="none" aria-hidden>
      <rect x="3" y="3" width="22" height="22" rx="6" stroke="currentColor" strokeWidth="2" />
      <circle cx="14" cy="14" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="21" cy="7" r="1.5" fill="currentColor" />
    </svg>
  ),
}

type Social = (typeof socials)[number]

/** Карточка соцсети: цвет «разливается» из точки, где курсор вошёл в карточку */
function SocialCard({ s }: { s: Social }) {
  const color = accentColor[s.accent]
  const [origin, setOrigin] = useState({ x: '50%', y: '50%' })
  const [hover, setHover] = useState(false)
  const enter = (e: PointerEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setOrigin({ x: `${e.clientX - r.left}px`, y: `${e.clientY - r.top}px` })
    setHover(true)
  }
  return (
    <Magnetic strength={0.12} className="h-full">
      <a
        href={s.href}
        target="_blank"
        rel="noopener noreferrer"
        onPointerEnter={enter}
        onPointerLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        data-cursor="написать"
        className="glass relative flex h-full min-h-[16rem] flex-col justify-between overflow-hidden rounded-[2rem] p-7 sm:p-9"
      >
        <motion.span
          aria-hidden
          className="absolute h-[60rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: origin.x, top: origin.y, background: color }}
          initial={false}
          animate={{ scale: hover ? 1 : 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        />
        <div className="relative flex items-start justify-between transition-colors duration-500" style={{ color: hover ? C.ink : color }}>
          {icons[s.id]}
          <motion.span
            className="grid h-12 w-12 place-items-center rounded-full border"
            animate={{ rotate: hover ? 45 : 0, borderColor: hover ? 'rgba(14,20,16,0.3)' : 'rgba(243,235,221,0.15)' }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <svg width="14" height="14" viewBox="0 0 11 11" aria-hidden>
              <path d="M1 10 L10 1 M10 1 H4 M10 1 V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </motion.span>
        </div>
        <div className="relative transition-colors duration-500" style={{ color: hover ? C.ink : C.cream }}>
          <div className={`kicker text-[0.6rem] ${hover ? '' : 'text-mute'}`} translate="no">
            {s.label}
            <span className="sr-only">, откроется в новой вкладке</span>
          </div>
          <div className="mt-2 font-serif text-[clamp(2rem,4vw,3.25rem)] leading-none font-light tracking-[-0.02em]" translate="no">
            {s.handle}
          </div>
        </div>
      </a>
    </Magnetic>
  )
}

/**
 * Приглашение на свидание: широкая карточка под соцсетями. Тёплое свечение следует за курсором,
 * пиалы сближаются при наведении; по клику анкета раскрывается кругом из точки нажатия.
 */
function DateCard() {
  const [hover, setHover] = useState(false)
  const [glow, setGlow] = useState({ x: '70%', y: '50%' })
  const track = (e: PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setGlow({ x: `${e.clientX - r.left}px`, y: `${e.clientY - r.top}px` })
  }
  return (
    <Magnetic strength={0.06}>
      <button
        type="button"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          // клик с клавиатуры приходит с нулевыми координатами — раскрываем из центра карточки
          openDate(e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : { x: r.left + r.width / 2, y: r.top + r.height / 2 })
        }}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        onPointerMove={track}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        data-cursor="записаться"
        aria-haspopup="dialog"
        className="group relative grid w-full grid-cols-1 items-center gap-8 overflow-hidden rounded-[2rem] border border-clay/25 bg-gradient-to-br from-plum/[0.12] via-ink-2 to-clay/[0.1] p-7 text-left sm:p-9 md:grid-cols-[1fr_auto] md:gap-12"
      >
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(28rem circle at ${glow.x} ${glow.y}, rgba(227,155,120,0.18), transparent 60%)` }}
          initial={false}
          animate={{ opacity: hover ? 1 : 0.35 }}
          transition={{ duration: 0.6 }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-clay" />
            <span className="kicker text-[0.6rem] text-clay">приглашение</span>
          </div>
          <div className="mt-5 font-serif text-[clamp(2.3rem,5vw,4rem)] leading-[0.98] font-light tracking-[-0.02em]">
            Записаться <span className="text-gradient pr-[0.05em] italic">на свидание</span>
          </div>
          <p className="mt-4 max-w-xl text-[0.98rem] leading-relaxed text-cream-2">Пять коротких вопросов: вкусы, настроение, удобное время — и как тебя найти. Остальное — моя забота.</p>
        </div>
        <div className="relative flex items-center gap-6 md:flex-col md:items-end">
          <svg width="132" height="56" viewBox="0 0 132 56" fill="none" aria-hidden className="overflow-visible">
            {[-1, 1].map((side) => (
              <motion.g key={side} initial={false} animate={{ x: hover ? side * 2 : side * 14, rotate: hover ? -side * 7 : 0 }} transition={{ duration: 0.9, ease: EASE }} style={{ originX: '66px', originY: '50px' }}>
                <path d="M44 22 C 45 38, 54 46, 66 46 C 78 46, 87 38, 88 22 Z" fill={side < 0 ? C.matcha : C.clay} fillOpacity="0.18" stroke={C.cream} strokeOpacity="0.55" strokeWidth="1.2" />
                <ellipse cx="66" cy="22" rx="22" ry="2.6" stroke={C.cream} strokeOpacity="0.3" />
              </motion.g>
            ))}
          </svg>
          <span className="grid h-14 w-14 place-items-center rounded-full border border-clay/40 text-clay transition-all duration-500 group-hover:border-transparent group-hover:bg-clay group-hover:text-ink">
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M1.5 6 H10.5 M7 2.5 L10.5 6 L7 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </button>
    </Magnetic>
  )
}

export function Contact() {
  return (
    <section id="contact" className="relative isolate mx-auto max-w-7xl scroll-mt-24 px-5 pt-24 pb-16 sm:px-8 md:pt-32 md:pb-20">
      <Ghost text={quotes[3]} className="top-1/3" dir={-1} outline />
      <SectionHeading kicker="04 — связь" title="напиши, если откликнулось" />
      <Reveal delay={0.1}>
        <p className="mt-10 max-w-2xl text-[1.05rem] leading-relaxed text-cream-2">
          Без сценария и без давления. Расскажи о себе хоть одно настоящее предложение — я отвечу тем же. Никаких «привет, как дела» в три часа ночи.
        </p>
      </Reveal>
      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2">
        {socials.map((s, i) => (
          <Reveal key={s.id} delay={0.12 + i * 0.08} className="h-full">
            <SocialCard s={s} />
          </Reveal>
        ))}
        <Reveal delay={0.3} className="md:col-span-2">
          <DateCard />
        </Reveal>
      </div>
    </section>
  )
}

function RisingChar({ ch, i, total, progress }: { ch: string; i: number; total: number; progress: MotionValue<number> }) {
  const start = (i / total) * 0.5
  const y = useTransform(progress, [start, start + 0.5], ['100%', '0%'])
  const rotate = useTransform(progress, [start, start + 0.5], [12, 0])
  return (
    <span className="inline-block overflow-hidden align-bottom">
      <motion.span className="inline-block" style={{ y, rotate }}>
        {ch === ' ' ? ' ' : ch}
      </motion.span>
    </span>
  )
}

export function Footer() {
  const ref = useRef<HTMLDivElement>(null)
  const scrollTo = useScrollTo()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const chars = [...'Иван · 茶']

  return (
    <footer className="relative mt-10 overflow-hidden border-t border-line">
      <div className="mx-auto max-w-7xl px-5 pt-16 pb-10 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="flex items-end gap-5">
            <Signature size={58} />
            <div>
              <div className="font-serif text-4xl leading-none italic">до связи</div>
              <div className="kicker mt-2 text-[0.6rem] text-mute">иван · 2026 · собран вручную</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-mute">
            <span>заварено на матче</span>
            <span className="text-line">·</span>
            <span>сверстано с уважением</span>
            <span className="text-line">·</span>
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault()
                scrollTo('top')
              }}
              className="text-cream-2 underline-offset-4 hover:underline"
            >
              наверх ↑
            </a>
          </div>
        </div>

        <div className="glass mt-12 grid grid-cols-1 gap-4 rounded-3xl p-6 md:grid-cols-[auto_1fr] md:gap-8 md:p-8">
          <div className="flex items-center gap-3 md:flex-col md:items-start">
            <svg width="30" height="30" viewBox="0 0 28 28" fill="none" aria-hidden>
              <path d="M14 3 L24 7 V14 C24 19.5 19.5 23.5 14 25 C8.5 23.5 4 19.5 4 14 V7 Z" stroke={C.matchaDeep} strokeWidth="1.5" />
              <path d="M9 14 L13 18 L19 11" stroke={C.matcha} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <div className="kicker text-[0.6rem] text-mute">приватность</div>
          </div>
          <div>
            <p className="font-serif text-xl leading-snug italic">Этот сайт не использует cookie и не следит за посетителями.</p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-cream-2">
              В соответствии с Федеральным законом №&nbsp;152-ФЗ «О персональных данных» уведомляем: на сайте не устанавливаются куки-файлы, не используются системы аналитики,
              рекламные пиксели и счётчики посещений. Все ресурсы (шрифты, изображения, скрипты) загружаются с этого же домена — сторонние сервисы не подключаются.
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-cream-2">
              Единственное исключение — анкета «Записаться на свидание». Если вы сами заполните и отправите её, указанные в ней данные (имя, ник в Telegram, предпочтения, дата
              и время) один раз передаются Ивану в Telegram через сервер-посредник Cloudflare. На сайте и на сервере анкета не сохраняется; черновик хранится только в
              вашей вкладке браузера до её закрытия. Отправляя анкету, вы соглашаетесь на такую передачу.
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-cream-2">
              Если вы напишете по контактам выше — переписка ведётся в выбранной вами платформе на её условиях; этот сайт в ней не участвует.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {privacyChips.map((c) => (
                <li key={c} className="rounded-full border border-line px-3 py-1 text-[0.7rem] text-mute">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div ref={ref} aria-hidden className="pointer-events-none flex justify-center overflow-hidden pb-4 select-none">
        <div className="font-serif text-[clamp(5rem,19vw,19rem)] leading-[0.85] font-light tracking-[-0.04em] whitespace-nowrap text-transparent [-webkit-text-stroke:1px_rgba(168,198,134,0.45)]">
          {chars.map((ch, i) => (
            <RisingChar key={i} ch={ch} i={i} total={chars.length} progress={scrollYProgress} />
          ))}
        </div>
      </div>
    </footer>
  )
}
