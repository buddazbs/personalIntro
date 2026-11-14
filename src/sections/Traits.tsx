import { motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { quotes, traits, type Trait } from '../content'
import { accentColor, C } from '../lib/colors'
import { Reveal, SectionHeading } from '../components/Reveal'
import { Spotlight } from '../components/Spotlight'
import { Counter } from '../components/Counter'
import { Ghost } from '../components/Ghost'
import { TraitGlyph } from '../components/Art'
import { useFinePointer, useMedia } from '../hooks/useMedia'

/** Лицо карты: 3D-наклон за курсором и блик */
function TraitFace({ trait }: { trait: Trait }) {
  const fine = useFinePointer()
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const srx = useSpring(rx, { stiffness: 180, damping: 18 })
  const sry = useSpring(ry, { stiffness: 180, damping: 18 })
  const color = accentColor[trait.accent]
  const glare = useMotionTemplate`radial-gradient(22rem circle at ${gx}% ${gy}%, ${color}2e, transparent 55%)`

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!fine) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ry.set((px - 0.5) * 14)
    rx.set(-(py - 0.5) * 14)
    gx.set(px * 100)
    gy.set(py * 100)
  }
  const reset = () => {
    rx.set(0)
    ry.set(0)
  }

  return (
    <div className="h-full [perspective:1000px]" onPointerMove={onMove} onPointerLeave={reset}>
      <motion.div style={{ rotateX: srx, rotateY: sry }} className="group glass relative h-full overflow-hidden rounded-[1.75rem] bg-ink-2/80 p-6 [transform-style:preserve-3d] xl:p-7">
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: glare }} />
        <span aria-hidden className="absolute top-7 bottom-7 left-0 w-[2px] origin-top scale-y-0 rounded-full transition-transform duration-700 group-hover:scale-y-100" style={{ background: color }} />
        <div className="relative flex h-full flex-col [transform:translateZ(30px)]">
          <div className="mb-5 flex items-start justify-between">
            <TraitGlyph kind={trait.glyph} color={color} />
            <span className="kicker text-[0.6rem] text-mute tabular-nums">{trait.num}</span>
          </div>
          <h3 className="font-serif text-[1.75rem] leading-[1.05] font-light tracking-[-0.015em]">{trait.title}</h3>
          <p className="mt-2.5 text-[0.9rem] leading-relaxed text-cream-2">{trait.body}</p>
        </div>
      </motion.div>
    </div>
  )
}

/** Рубашка карты */
function CardBack({ i }: { i: number }) {
  return (
    <div className="absolute inset-0 grid place-items-center overflow-hidden rounded-[1.75rem] border border-matcha/30 bg-gradient-to-br from-matcha-dark to-ink [backface-visibility:hidden] [transform:rotateY(180deg)]">
      <div aria-hidden className="absolute inset-3 rounded-[1.25rem] border border-matcha/20" />
      <div aria-hidden className="absolute inset-0 opacity-30" style={{ backgroundImage: `repeating-linear-gradient(45deg, ${C.matcha}22 0 1px, transparent 1px 14px)` }} />
      <span className="relative font-serif text-6xl text-matcha/80">茶</span>
      <span className="kicker absolute bottom-6 text-[0.55rem] text-mute">{String(i + 1).padStart(2, '0')} / 06</span>
    </div>
  )
}

const TILT = [-9, 6, -3, 11, -6, 4]

/** Карта сдаётся из колоды: летит из центра на своё место и переворачивается лицом */
function DealtCard({ trait, i, progress, offset }: { trait: Trait; i: number; progress: MotionValue<number>; offset: { x: number; y: number } }) {
  const start = 0.08 + i * 0.07
  const end = start + 0.32
  const p = useTransform(progress, [start, end], [0, 1], { clamp: true })
  const x = useTransform(p, [0, 1], [offset.x, 0])
  const y = useTransform(p, [0, 1], [offset.y + i * -4, 0])
  const rotate = useTransform(p, [0, 1], [TILT[i] ?? 0, 0])
  const rotateY = useTransform(p, [0, 0.55, 1], [180, 180, 0])
  const scale = useTransform(p, [0, 0.5, 1], [0.9, 1.08, 1])
  const z = useTransform(p, [0, 0.5, 1], [0, 120, 0])

  return (
    <motion.div className="relative h-full [transform-style:preserve-3d]" style={{ x, y, rotate, rotateY, scale, z, zIndex: 10 - i }}>
      <div className="h-full [backface-visibility:hidden]">
        <TraitFace trait={trait} />
      </div>
      <CardBack i={i} />
    </motion.div>
  )
}

function Deck() {
  const wrap = useRef<HTMLDivElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  const cells = useRef<(HTMLDivElement | null)[]>([])
  const [offsets, setOffsets] = useState(() => traits.map(() => ({ x: 0, y: 0 })))

  // смещение каждой ячейки от центра сетки — оттуда карты «сдаются»
  useLayoutEffect(() => {
    const g = grid.current
    if (!g) return
    const measure = () => {
      const cx = g.offsetWidth / 2
      const cy = g.offsetHeight / 2
      setOffsets(cells.current.map((c) => (c ? { x: cx - (c.offsetLeft + c.offsetWidth / 2), y: cy - (c.offsetTop + c.offsetHeight / 2) } : { x: 0, y: 0 })))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(g)
    return () => ro.disconnect()
  }, [])

  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start start', 'end end'] })
  const hint = useTransform(scrollYProgress, [0, 0.08, 0.6, 0.75], [1, 1, 1, 0])

  return (
    <div ref={wrap} className="relative mt-10 h-[260vh]">
      <div className="sticky top-0 flex h-screen flex-col justify-center py-20">
        <motion.p style={{ opacity: hint }} className="kicker mb-6 text-center text-[0.6rem] text-mute">
          листай — раздаю карты
        </motion.p>
        <div ref={grid} className="grid auto-rows-[minmax(13.5rem,1fr)] grid-cols-3 gap-4">
          {traits.map((t, i) => (
            <div
              key={t.num}
              ref={(el) => {
                cells.current[i] = el
              }}
            >
              <DealtCard trait={t} i={i} progress={scrollYProgress} offset={offsets[i] ?? { x: 0, y: 0 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Traits() {
  const deck = useMedia('(min-width: 1024px) and (min-height: 700px)')
  return (
    <section id="traits" className="relative isolate mx-auto max-w-7xl scroll-mt-24 px-5 pt-24 pb-10 sm:px-8 md:pt-32">
      <Ghost text={quotes[2]} className="top-0" />
      <SectionHeading kicker="03 — характер" title="как со мной рядом" />

      <div className="mt-16 grid grid-cols-12 gap-3 md:gap-4">
        <Reveal className="col-span-12 h-full md:col-span-8">
          <Spotlight className="h-full bg-gradient-to-br from-clay/10 via-transparent to-transparent">
            <div className="relative z-[2] flex h-full min-h-[15rem] flex-col justify-between gap-8 p-7 sm:p-10">
              <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden>
                <circle cx="16" cy="16" r="14" stroke="var(--color-clay)" strokeWidth="1.3" fill="none" />
                <circle cx="16" cy="16" r="3" fill="var(--color-clay)" />
              </svg>
              <p className="font-serif text-[clamp(1.5rem,2.8vw,2.4rem)] leading-[1.22] font-light italic">
                Не пытаюсь произвести впечатление. <span className="text-butter">Пытаюсь быть тем, рядом с кем дышится спокойно</span> — и при этом не скучно.
              </p>
              <div className="flex items-center gap-3 text-mute">
                <span className="h-px w-10 bg-clay" />
                <span className="kicker text-[0.6rem]">внутренний манифест</span>
              </div>
            </div>
          </Spotlight>
        </Reveal>
        <Reveal delay={0.06} className="col-span-12 h-full md:col-span-4">
          <Spotlight className="h-full bg-gradient-to-b from-matcha-dark/50 to-transparent">
            <div className="relative z-[2] flex h-full min-h-[15rem] flex-col justify-between p-7 sm:p-9">
              <Counter value={traits.length} pad={2} className="text-gradient font-serif text-[clamp(5rem,9vw,8rem)] leading-none font-light tracking-[-0.05em]" />
              <div>
                <div className="font-serif text-2xl italic">граней</div>
                <div className="mt-2 text-sm leading-relaxed text-mute">ни одна не острая, но каждая чувствуется.</div>
              </div>
            </div>
          </Spotlight>
        </Reveal>
      </div>

      {deck ? (
        <Deck />
      ) : (
        <div className="mt-4 grid grid-cols-12 gap-3 md:gap-4">
          {traits.map((t, i) => (
            <Reveal key={t.num} delay={0.05 + (i % 2) * 0.07} className="col-span-12 h-full sm:col-span-6">
              <TraitFace trait={t} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  )
}
