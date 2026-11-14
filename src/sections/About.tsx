import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { now, quotes, stats } from '../content'
import { EASE } from '../lib/colors'
import { Reveal, SectionHeading } from '../components/Reveal'
import { Spotlight } from '../components/Spotlight'
import { TeaBowl } from '../components/TeaBowl'
import { Counter } from '../components/Counter'
import { Ghost } from '../components/Ghost'

export function About() {
  return (
    <section id="about" className="relative isolate mx-auto max-w-7xl scroll-mt-24 px-5 pt-24 pb-16 sm:px-8 md:pt-32 md:pb-24">
      <Ghost text={quotes[0]} className="top-0" dir={-1} />
      <SectionHeading kicker="01 — обо мне" title="между ритуалом и кодом" />

      <div className="mt-16 grid grid-cols-12 gap-3 md:gap-4">
        <Reveal className="col-span-12 h-full lg:col-span-7">
          <Spotlight className="h-full">
            <div className="relative z-[2] grid h-full grid-cols-1 gap-6 p-7 sm:grid-cols-[1fr_auto] sm:items-center sm:p-10">
              <div className="flex h-full flex-col justify-between gap-8">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-matcha" />
                  <span className="kicker text-[0.6rem] text-mute">ежедневный ритуал</span>
                </span>
                <h3 className="font-serif text-[clamp(2.1rem,3.3vw,3rem)] leading-[1] font-light tracking-[-0.02em]">
                  У меня аллергия
                  <br />
                  <span className="text-flow italic">на кофе.</span>
                  <br />
                  Поэтому — чай.
                </h3>
                <p className="max-w-sm text-[0.95rem] leading-relaxed text-cream-2">
                  Сэнтя по утрам, габа после обеда, дянь хун вечером. Завариваю в исинском чайнике, считаю секунды по дыханию. Чайная церемония — способ замедлиться на
                  12&nbsp;минут до того, как мир начнётся.
                </p>
              </div>
              <TeaBowl className="mx-auto h-56 w-56 lg:h-60 lg:w-60 xl:h-64 xl:w-64" />
            </div>
          </Spotlight>
        </Reveal>

        <div className="col-span-12 grid grid-cols-2 gap-3 md:gap-4 lg:col-span-5">
          <Reveal delay={0.08} className="col-span-2 h-full">
            <Spotlight className="h-full bg-gradient-to-br from-matcha-dark/60 to-transparent">
              <div className="relative z-[2] flex h-full flex-col justify-between gap-6 p-7 sm:p-9">
                <svg width="40" height="30" viewBox="0 0 36 28" aria-hidden>
                  <path d="M0 28 V12 C0 5 5 0 12 0 L12 6 C8 7 6 9 6 12 H12 V28 Z M20 28 V12 C20 5 25 0 32 0 L32 6 C28 7 26 9 26 12 H32 V28 Z" fill="var(--color-clay)" />
                </svg>
                <p className="font-serif text-[clamp(1.5rem,2.2vw,1.9rem)] leading-[1.25] font-light italic">
                  Я не коллекционирую вещи — я коллекционирую впечатления, <span className="text-butter">которые задерживаются.</span>
                </p>
                <div className="flex items-center gap-3 text-mute">
                  <span className="h-px w-10 bg-clay" />
                  <span className="kicker text-[0.6rem]">внутренний манифест</span>
                </div>
              </div>
            </Spotlight>
          </Reveal>

          {stats.map((s, i) => (
            <Reveal key={s.label} delay={0.12 + i * 0.06} className="col-span-1 h-full">
              <Spotlight className="h-full">
                <div className="relative z-[2] flex h-full flex-col justify-between gap-6 p-6 sm:p-7">
                  <Counter value={s.value} className="font-serif text-[clamp(3.5rem,6vw,5.5rem)] leading-none font-light tracking-[-0.04em] text-cream" />
                  <div>
                    <div className="text-sm text-cream-2">{s.label}</div>
                    <div className="kicker mt-1 text-[0.58rem] text-mute">{s.sub}</div>
                  </div>
                </div>
              </Spotlight>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1} className="col-span-12">
          <Spotlight>
            <div className="relative z-[2] p-7 sm:p-9">
              <div className="mb-7 flex items-center gap-2.5">
                <span className="pulse-dot block h-2 w-2 rounded-full bg-clay" />
                <span className="kicker text-mute">сейчас</span>
              </div>
              <ul className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
                {now.map((item, i) => (
                  <motion.li
                    key={item.label}
                    className="relative border-t border-line pt-4"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.15 + i * 0.08, ease: EASE }}
                  >
                    {/* линия «наливается» слева направо */}
                    <motion.span
                      aria-hidden
                      className="absolute -top-px left-0 h-px w-full origin-left bg-matcha"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, delay: 0.3 + i * 0.12, ease: EASE }}
                    />
                    <div className="font-serif text-lg text-matcha italic">{item.label}</div>
                    <div className="mt-1.5 text-[0.95rem] leading-snug text-cream-2">{item.value}</div>
                  </motion.li>
                ))}
              </ul>
            </div>
          </Spotlight>
        </Reveal>
      </div>
    </section>
  )
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.1, 1])
  const blur = useTransform(progress, range, ['blur(8px)', 'blur(0px)'])
  const y = useTransform(progress, range, ['0.25em', '0em'])
  return (
    <motion.span style={{ opacity, filter: blur, y }} className="inline-block">
      {children}&nbsp;
    </motion.span>
  )
}

/** Философия: слова проявляются по мере прокрутки, фон медленно разгорается */
export function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const glow = useTransform(scrollYProgress, [0, 1], [0, 1])

  const lead = 'Хорошие вещи случаются медленно.'.split(' ')
  const accent = 'Очень хорошие — ещё медленнее.'.split(' ')
  const all = [...lead, ...accent]
  const step = 1 / all.length

  return (
    <section aria-label="Философия" className="relative isolate mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-28">
      <Ghost text={quotes[1]} className="bottom-0" outline />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(235,203,130,0.16),transparent_60%)] blur-2xl"
        style={{ opacity: glow, scale: glow }}
      />
      <Reveal y={16}>
        <div className="mb-10 flex items-center gap-3 text-mute">
          <span className="h-px w-12 bg-clay" />
          <span className="kicker">философия</span>
        </div>
      </Reveal>
      <p ref={ref} className="font-serif text-[clamp(2.5rem,7vw,6.25rem)] leading-[1.02] font-light tracking-[-0.025em]">
        <span className="sr-only">{all.join(' ')}</span>
        <span aria-hidden>
          {all.map((w, i) => (
            <span key={i} className={i >= lead.length ? 'text-butter italic' : ''}>
              {i === lead.length && <br className="hidden md:block" />}
              <Word progress={scrollYProgress} range={[i * step, (i + 1) * step]}>
                {w}
              </Word>
            </span>
          ))}
        </span>
      </p>
      <Reveal delay={0.1}>
        <p className="mt-12 ml-auto max-w-xl text-[1.05rem] leading-relaxed text-cream-2 md:mt-16">
          Я выбираю длинные форматы: книги, разговоры, маршруты. Спешу только тогда, когда это меняет чью-то жизнь к лучшему. В остальном —{' '}
          <span className="font-serif text-[1.2em] text-matcha italic">пусть остынет.</span>
        </p>
      </Reveal>
    </section>
  )
}
