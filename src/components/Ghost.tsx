import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'

/**
 * Огромная полупрозрачная надпись на фоне раздела.
 * При прокрутке медленно плывёт по диагонали — у каждой надписи своё направление.
 */
export function Ghost({ text, className = '', dir = 1, outline = false }: { text: string; className?: string; dir?: 1 | -1; outline?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const x = useTransform(scrollYProgress, [0, 1], [`${-8 * dir}%`, `${8 * dir}%`])
  const y = useTransform(scrollYProgress, [0, 1], ['40%', '-40%'])
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0])

  return (
    <div ref={ref} aria-hidden className={`pointer-events-none absolute inset-x-0 -z-10 overflow-hidden select-none ${className}`}>
      <motion.p
        style={{ x, y, opacity }}
        className={`font-serif text-[clamp(4.5rem,13vw,13rem)] leading-none font-light whitespace-nowrap italic ${
          outline ? 'text-transparent [-webkit-text-stroke:1px_rgba(168,198,134,0.16)]' : 'text-cream/[0.045]'
        } ${dir === 1 ? 'text-left' : 'text-right'}`}
      >
        {text}
      </motion.p>
    </div>
  )
}
