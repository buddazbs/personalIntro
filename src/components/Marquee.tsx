import { motion, useAnimationFrame, useMotionValue, useScroll, useSpring, useTransform, useVelocity, wrap } from 'motion/react'
import { useRef } from 'react'
import { useReducedMotionPref } from '../hooks/useMedia'

/** Бесконечная лента цитат: скорость и направление — от прокрутки, на резком скролле строка наклоняется */
export function Marquee({ items, baseVelocity = -2.2, className = '' }: { items: readonly string[]; baseVelocity?: number; className?: string }) {
  const reduced = useReducedMotionPref()
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const smooth = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 })
  const factor = useTransform(smooth, [-1500, 0, 1500], [-4, 0, 4], { clamp: false })
  const skew = useTransform(smooth, [-2500, 0, 2500], [8, 0, -8])
  const x = useTransform(baseX, (v) => `${wrap(-25, -50, v)}%`)
  const dir = useRef(1)

  useAnimationFrame((_, delta) => {
    if (reduced || document.hidden) return
    const f = factor.get()
    if (f < 0) dir.current = -1
    else if (f > 0) dir.current = 1
    let move = dir.current * baseVelocity * (delta / 1000)
    move += dir.current * move * Math.abs(f)
    baseX.set(baseX.get() + move)
  })

  const row = items.map((q) => (
    <span key={q} className="flex items-center gap-[0.6em] pr-[0.6em]">
      <span className="font-serif font-light italic">{q}</span>
      <svg viewBox="0 0 24 24" className="h-[0.42em] w-[0.42em] shrink-0 text-matcha" aria-hidden>
        <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="currentColor" />
      </svg>
    </span>
  ))

  return (
    <div className={`relative overflow-hidden whitespace-nowrap select-none ${className}`} aria-hidden>
      <motion.div className="flex w-max flex-nowrap" style={{ x, skewX: skew }}>
        {row}
        {row}
        {row}
        {row}
      </motion.div>
    </div>
  )
}
