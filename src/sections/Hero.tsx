import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useRef, type RefObject } from 'react'
import { NAME } from '../content'
import { EASE } from '../lib/colors'
import { InkShader } from '../components/InkShader'
import { PhotoStack } from '../components/PhotoStack'
import { Scramble } from '../components/Reveal'
import { useDesktop, useFinePointer, useReducedMotionPref } from '../hooks/useMedia'
import { useScrollTo } from '../lib/lenis'

const W_MIN = 300
const W_MAX = 700
const RADIUS = 380

/** Буквы имени «набухают» (ось wght), когда к ним подходит курсор */
function useProximityWeight(refs: RefObject<(HTMLSpanElement | null)[]>) {
  const fine = useFinePointer()
  const reduced = useReducedMotionPref()
  useEffect(() => {
    if (!fine || reduced) return
    const els = refs.current
    const cur = els.map(() => W_MIN)
    let mx = -9999
    let my = -9999
    let raf = 0
    const tick = () => {
      // сначала все чтения, потом все записи
      const targets = els.map((el) => {
        if (!el) return W_MIN
        const r = el.getBoundingClientRect()
        const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2))
        return W_MIN + (W_MAX - W_MIN) * Math.max(0, 1 - d / RADIUS) ** 1.6
      })
      let settled = true
      els.forEach((el, i) => {
        const c = cur[i] ?? W_MIN
        const target = targets[i] ?? W_MIN
        const n = c + (target - c) * 0.14
        cur[i] = n
        if (Math.abs(target - n) > 0.5) settled = false
        el?.style.setProperty('font-variation-settings', `'wght' ${n.toFixed(1)}`)
      })
      raf = settled ? 0 : requestAnimationFrame(tick)
    }
    const onMove = (e: PointerEvent) => {
      mx = e.clientX
      my = e.clientY
      if (!raf) raf = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [fine, reduced, refs])
}

/** Буква разлетается от центра и размывается при уходе со сцены */
function Letter({ ch, i, total, progress, ready, setRef }: { ch: string; i: number; total: number; progress: MotionValue<number>; ready: boolean; setRef: (el: HTMLSpanElement | null) => void }) {
  const off = i - (total - 1) / 2
  const x = useTransform(progress, [0, 1], ['0vw', `${off * 9}vw`])
  const y = useTransform(progress, [0, 1], ['0%', `${-Math.abs(off) * 22 - 10}%`])
  const rotate = useTransform(progress, [0, 1], [0, off * 14])
  const filter = useTransform(progress, [0, 0.4, 1], ['blur(0px)', 'blur(0px)', 'blur(14px)'])
  return (
    <motion.span aria-hidden className="inline-block" style={{ x, y, rotate, filter }}>
      <span className="inline-block overflow-hidden pb-[0.06em] align-bottom">
        <motion.span
          ref={setRef}
          className={`inline-block will-change-transform ${i === 1 ? 'text-flow pr-[0.04em] italic' : ''}`}
          style={{ fontVariationSettings: `'wght' ${W_MIN}` }}
          initial={{ y: '105%', rotate: 8 }}
          animate={ready ? { y: '0%', rotate: 0 } : {}}
          transition={{ duration: 1.4, delay: 0.15 + i * 0.09, ease: EASE }}
        >
          {ch}
        </motion.span>
      </span>
    </motion.span>
  )
}

/**
 * Первый экран закреплён: при прокрутке он уменьшается и скругляется, буквы разлетаются,
 * а следующий раздел наезжает сверху, как новая карточка (см. App).
 */
export function Hero({ ready }: { ready: boolean }) {
  const wrap = useRef<HTMLDivElement>(null)
  const letters = useRef<(HTMLSpanElement | null)[]>([])
  const scrollTo = useScrollTo()
  useProximityWeight(letters)

  // на десктопе экран закреплён; на телефоне он выше экрана, поэтому просто уезжает
  const desktop = useDesktop()
  const { scrollYProgress: p } = useScroll({ target: wrap, offset: desktop ? ['start start', 'end end'] : ['start start', 'end start'] })
  const scale = useTransform(p, [0, 1], [1, 0.86])
  const radius = useTransform(p, [0, 1], [0, 56])
  const dim = useTransform(p, [0, 1], [1, 0.35])
  const textY = useTransform(p, [0, 1], ['0%', '-18%'])
  const fade = useTransform(p, [0, 0.6], [1, 0])
  const photoRotate = useTransform(p, [0, 1], [0, -14])
  const photoY = useTransform(p, [0, 1], ['0%', '-25%'])
  const photoScale = useTransform(p, [0, 1], [1, 0.8])

  const show = (delay: number) =>
    ({
      initial: { opacity: 0, y: 30, filter: 'blur(8px)' },
      animate: ready ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {},
      transition: { duration: 1.2, delay, ease: EASE },
    }) as const

  const chars = [...NAME]

  return (
    <div ref={wrap} className="relative md:h-[170svh]">
      <section id="hero" aria-labelledby="hero-title" className="relative min-h-svh overflow-hidden md:sticky md:top-0 md:h-svh">
        <motion.div className="absolute inset-0 origin-top overflow-hidden" style={{ scale, borderRadius: radius, opacity: dim }}>
          <InkShader />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-ink" />
        </motion.div>

        <div className="relative mx-auto grid h-full max-w-7xl grid-cols-1 content-center items-center gap-12 px-5 pt-36 pb-24 sm:px-8 md:pt-28 md:pb-10 md:grid-cols-[1.35fr_1fr] md:gap-10">
          <motion.div style={{ y: textY }}>
            <motion.div style={{ opacity: fade }}>
            <motion.div {...show(0.1)} className="mb-8 flex items-center gap-3 text-mute">
              <span className="h-px w-10 bg-clay sm:w-14" />
              {ready && <Scramble text="a personal digital profile · 2026" className="kicker" />}
            </motion.div>
            </motion.div>

            <h1 id="hero-title" className="font-serif text-[clamp(6.5rem,27vw,19rem)] leading-[0.82] tracking-[-0.04em] whitespace-nowrap text-cream">
              <span className="sr-only">{NAME}</span>
              {chars.map((ch, i) => (
                <Letter
                  key={i}
                  ch={ch}
                  i={i}
                  total={chars.length}
                  progress={p}
                  ready={ready}
                  setRef={(el) => {
                    letters.current[i] = el
                  }}
                />
              ))}
            </h1>

            <motion.div style={{ opacity: fade }}>
              <motion.p {...show(0.6)} className="mt-8 max-w-xl border-l border-line pl-5 text-[clamp(1rem,1.35vw,1.15rem)] leading-relaxed text-cream-2 md:mt-10">
                <span className="font-serif text-[1.45em] text-matcha italic">Привет.</span> Этот сайт — не анкета и не резюме. Скорее{' '}
                <span className="font-medium text-cream">тихий способ рассказать о себе</span> до того, как мы скажем друг другу первое «привет». Хочется{' '}
                <em className="font-serif text-[1.15em] text-butter">узнать тебя поближе</em> — без сценариев, без спешки, с хорошим чаем.
              </motion.p>
            </motion.div>
          </motion.div>

          <motion.div style={{ rotate: photoRotate, y: photoY, scale: photoScale }} className="relative mx-auto w-full max-w-[17rem] sm:max-w-[20rem] md:mr-0 md:max-w-[25rem]">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, rotate: -8, clipPath: 'inset(100% 0% 0% 0% round 2rem)' }}
              animate={ready ? { opacity: 1, scale: 1, rotate: 0, clipPath: 'inset(-20% -20% -20% -20% round 2rem)' } : {}}
              transition={{ duration: 1.6, delay: 0.35, ease: EASE }}
            >
              <PhotoStack />
            </motion.div>
            <span aria-hidden className="kicker absolute top-[40%] right-full mr-6 hidden -translate-y-1/2 rotate-180 text-[0.6rem] whitespace-nowrap text-mute [writing-mode:vertical-rl] md:block">
              ivan · ноябрь 2026
            </span>
          </motion.div>
        </div>

        <motion.div style={{ opacity: fade }} className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 md:block">
          <motion.button
            type="button"
            onClick={() => scrollTo('about')}
            initial={{ opacity: 0 }}
            animate={ready ? { opacity: 1 } : {}}
            transition={{ delay: 1.6, duration: 1 }}
            className="flex flex-col items-center gap-3 text-mute"
            aria-label="Листать дальше"
          >
            <span className="kicker text-[0.6rem]">листай</span>
            <span className="relative block h-12 w-px overflow-hidden bg-line">
              <motion.span className="absolute inset-x-0 top-0 h-1/2 bg-matcha" animate={{ y: ['-100%', '200%'] }} transition={{ duration: 1.8, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }} />
            </span>
          </motion.button>
        </motion.div>
      </section>
    </div>
  )
}
