import { motion } from 'motion/react'
import { useEffect, useRef, type RefObject } from 'react'
import { NAME } from '../content'
import { EASE } from '../lib/motion'
import { PhotoStack } from '../components/PhotoStack'
import { useFinePointer, useReducedMotionPref } from '../hooks/useMedia'

const W_MIN = 220
const W_MAX = 860
const RADIUS = 420

/** Буквы имени набирают вес (ось wght), когда к ним подходит курсор */
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
      // сначала все чтения, потом все записи — без лишних пересчётов раскладки
      const targets = els.map((el) => {
        if (!el) return W_MIN
        const r = el.getBoundingClientRect()
        const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2))
        return W_MIN + (W_MAX - W_MIN) * Math.max(0, 1 - d / RADIUS) ** 1.5
      })
      let settled = true
      els.forEach((el, i) => {
        const target = targets[i] ?? W_MIN
        const n = (cur[i] ?? W_MIN) + (target - (cur[i] ?? W_MIN)) * 0.12
        cur[i] = n
        if (Math.abs(target - n) > 0.5) settled = false
        el?.style.setProperty('font-variation-settings', `'wght' ${n.toFixed(0)}`)
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

export function Hero({ ready }: { ready: boolean }) {
  const letters = useRef<(HTMLSpanElement | null)[]>([])
  useProximityWeight(letters)

  const after = (delay: number) =>
    ({
      initial: { opacity: 0, y: 16 },
      animate: ready ? { opacity: 1, y: 0 } : {},
      transition: { duration: 1.1, delay, ease: EASE },
    }) as const

  return (
    <section id="hero" aria-labelledby="hero-title" className="mx-auto grid min-h-[100svh] max-w-6xl grid-cols-1 items-center gap-14 px-5 pt-32 pb-20 sm:px-8 md:grid-cols-12 md:gap-8 md:pt-28">
      <div className="md:col-span-7">
        <h1 id="hero-title" aria-label={NAME} className="-ml-[0.06em] text-[clamp(7rem,36vw,15rem)] leading-[0.86] tracking-[-0.045em]">
          {[...NAME].map((ch, i) => (
            <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
              <motion.span
                ref={(el) => {
                  letters.current[i] = el
                }}
                className="inline-block"
                style={{ fontVariationSettings: `'wght' ${W_MIN}` }}
                initial={{ y: '102%' }}
                animate={ready ? { y: '0%' } : {}}
                transition={{ duration: 1.3, delay: 0.1 + i * 0.08, ease: EASE }}
              >
                {ch}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p {...after(0.55)} className="mt-8 max-w-[34rem] text-lead">
          <em>Привет.</em> Этот сайт — не анкета и не резюме. Скорее тихий способ рассказать о себе до того, как мы скажем друг другу первое «привет».
        </motion.p>
        <motion.p {...after(0.7)} className="mt-5 max-w-[34rem] text-muted">
          Хочется узнать тебя поближе — без сценариев, без спешки, с хорошим чаем.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, rotate: -3 }}
        animate={ready ? { opacity: 1, y: 0, rotate: 0 } : {}}
        transition={{ duration: 1.4, delay: 0.35, ease: EASE }}
        className="mx-auto w-full max-w-[19rem] md:col-span-5 md:mr-0 md:max-w-[23rem]"
      >
        <PhotoStack />
      </motion.div>
    </section>
  )
}
