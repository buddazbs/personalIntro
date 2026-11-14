import { motion } from 'motion/react'
import { C } from '../lib/colors'

/** Монограмма «И» в круге, рисуется линией */
export function Signature({ size = 40, draw = false, delay = 0 }: { size?: number; draw?: boolean; delay?: number }) {
  const t = (d: number) => ({ duration: 1.6, delay: delay + d, ease: [0.65, 0, 0.35, 1] as const })
  const init = draw ? { pathLength: 0, opacity: 0 } : false
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <motion.circle cx="32" cy="32" r="28" stroke={C.matcha} strokeWidth="1.5" initial={init} animate={{ pathLength: 1, opacity: 1 }} transition={t(0)} />
      <motion.path d="M22 22 L22 46 M22 46 L36 22 M36 22 L36 46" stroke={C.cream} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" initial={init} animate={{ pathLength: 1, opacity: 1 }} transition={t(0.3)} />
      <motion.circle cx="46" cy="46" r="2.6" fill={C.clay} initial={draw ? { scale: 0 } : false} animate={{ scale: 1 }} transition={{ ...t(1.1), type: 'spring' }} />
    </svg>
  )
}
