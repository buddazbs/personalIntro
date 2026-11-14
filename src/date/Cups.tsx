import { motion } from 'motion/react'
import { C, EASE } from '../lib/colors'

/**
 * Две пиалы, которые с каждым шагом анкеты становятся ближе.
 * После отправки — касаются краями (тихий «чок»), пар от обеих сплетается.
 */
export function Cups({ progress, done }: { progress: number; done: boolean }) {
  const gap = done ? 39 : 68 - progress * 24
  const bowl = (cx: number) => `M${cx - 30} 50 C ${cx - 28} 73, ${cx - 15} 82, ${cx} 82 C ${cx + 15} 82, ${cx + 28} 73, ${cx + 30} 50 Z`
  const steam = (cx: number, k: number) => `M${cx + k * 4} 40 C ${cx - 6 + k * 4} 30, ${cx + 8 + k * 4} 22, ${cx + k * 4} 10`

  const one = (side: -1 | 1, tea: string) => (
    // сдвиг и наклон — на разных слоях: наклон вокруг дна пиалы, иначе пиалы «уезжают» по высоте
    <motion.g initial={false} animate={{ x: side * gap }} transition={{ duration: done ? 0.9 : 1.2, ease: EASE, delay: done ? 0.15 : 0 }}>
    <motion.g
      initial={false}
      animate={{ rotate: done ? -side * 9 : 0 }}
      transition={{ duration: 0.9, ease: EASE, delay: done ? 0.15 : 0 }}
      style={{ transformBox: 'view-box', originX: '120px', originY: '82px' }}
    >
      <defs>
        <clipPath id={`cup-${side}`}>
          <path d={bowl(120)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#cup-${side})`}>
        <rect x="80" y="57" width="80" height="40" fill={tea} opacity="0.85" />
      </g>
      <path d={bowl(120)} fill="none" stroke={C.cream} strokeOpacity="0.55" strokeWidth="1.3" />
      <ellipse cx="120" cy="50" rx="30" ry="3.5" fill="none" stroke={C.cream} strokeOpacity="0.3" strokeWidth="1" />
      {[0, 1].map((i) => (
        <motion.path
          key={i}
          d={steam(120, i === 0 ? -1 : 1)}
          stroke={C.cream}
          strokeOpacity="0.4"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          animate={{ pathLength: [0, 1, 1], opacity: [0, 0.8, 0], y: [4, 0, -8], x: done ? -side * 6 : 0 }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.8 + (side > 0 ? 0.4 : 0), ease: 'easeOut' }}
        />
      ))}
    </motion.g>
    </motion.g>
  )

  return (
    <svg viewBox="0 0 240 92" className="h-auto w-[13rem] overflow-visible" aria-hidden>
      {one(-1, C.matcha)}
      {one(1, C.clay)}
      {/* искорка в момент касания */}
      <motion.g initial={false} animate={done ? { opacity: [0, 1, 0.7], scale: [0.4, 1.15, 1] } : { opacity: 0, scale: 0.4 }} transition={{ duration: 0.9, delay: 0.75, ease: EASE }} style={{ originX: '120px', originY: '38px' }}>
        {[0, 45, 90, 135].map((a) => (
          <line key={a} x1="120" y1="31" x2="120" y2="45" stroke={C.butter} strokeWidth="1" strokeLinecap="round" transform={`rotate(${a} 120 38)`} />
        ))}
      </motion.g>
    </svg>
  )
}
