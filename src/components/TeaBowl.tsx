import { AnimatePresence, motion } from 'motion/react'
import { useId, useState } from 'react'
import { C, EASE } from '../lib/colors'

const WAVE_FRONT = 'M-85 178 Q -50 170, -15 178 T 55 178 T 125 178 T 195 178 T 265 178 T 335 178 T 405 178 T 475 178 L 475 260 L -85 260 Z'
const WAVE_BACK = 'M-85 174 Q -50 182, -15 174 T 55 174 T 125 174 T 195 174 T 265 174 T 335 174 T 405 174 T 475 174 L 475 230 L -85 230 Z'
const BOWL = 'M70 160 C 80 280, 130 320, 200 322 C 270 320, 320 280, 330 160 Z'

/** Интерактивная чаша: клик — наливаем чай, ещё клик — пьём */
export function TeaBowl({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  const [filled, setFilled] = useState(false)
  const [pours, setPours] = useState(0)

  return (
    <button
      type="button"
      onClick={() => {
        setFilled((f) => !f)
        setPours((p) => p + 1)
      }}
      aria-pressed={filled}
      aria-label={filled ? 'Выпить чай' : 'Налить чай'}
      data-cursor={filled ? 'выпить' : 'налить'}
      className={`group relative ${className}`}
    >
      <motion.svg viewBox="0 0 400 400" className="h-full w-full overflow-visible" aria-hidden whileHover={{ rotate: -3, y: -6 }} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
        <defs>
          <radialGradient id={`${id}-inner`} cx="50%" cy="20%" r="70%">
            <stop offset="0%" stopColor={C.matcha} />
            <stop offset="55%" stopColor={C.matchaDeep} />
            <stop offset="100%" stopColor={C.matchaDark} />
          </radialGradient>
          <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EFE4CF" />
            <stop offset="60%" stopColor="#C9AE86" />
            <stop offset="100%" stopColor="#8C7253" />
          </linearGradient>
          <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C.matcha} stopOpacity="0.45" />
            <stop offset="100%" stopColor={C.matcha} stopOpacity="0" />
          </radialGradient>
          <clipPath id={`${id}-clip`}>
            <path d={BOWL} />
          </clipPath>
        </defs>

        <motion.circle cx="200" cy="230" r="190" fill={`url(#${id}-glow)`} animate={{ opacity: filled ? 1 : 0.35, scale: filled ? 1.05 : 0.9 }} transition={{ duration: 1.6, ease: EASE }} />
        <text x="345" y="90" fontSize="72" textAnchor="middle" fill={C.cream} opacity="0.12" className="font-serif">
          茶
        </text>

        {filled &&
          [0, 1, 2, 3].map((i) => (
            <motion.path
              key={`${pours}-${i}`}
              d={`M${150 + i * 32} 140 C ${144 + i * 32} 108, ${166 + i * 32} 96, ${156 + i * 32} 64 S ${146 + i * 32} 28, ${162 + i * 32} -4`}
              stroke={C.cream}
              strokeOpacity={0.35}
              strokeWidth={2.5}
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 1], opacity: [0, 0.9, 0], y: [10, 0, -14] }}
              transition={{ duration: 3.2, delay: 1.6 + i * 0.45, repeat: Infinity, ease: 'easeOut' }}
            />
          ))}

        <AnimatePresence>
          {filled && (
            <motion.line
              key={`stream-${pours}`}
              x1="200"
              y1="40"
              x2="200"
              y2="200"
              stroke={C.matcha}
              strokeWidth="8"
              strokeLinecap="round"
              initial={{ pathLength: 0, pathOffset: 0 }}
              animate={{ pathLength: [0, 1, 1, 0], pathOffset: [0, 0, 0, 1] }}
              transition={{ duration: 1.9, times: [0, 0.25, 0.7, 1], ease: 'easeInOut' }}
            />
          )}
        </AnimatePresence>

        <path d={BOWL} fill={`url(#${id}-body)`} />
        <g clipPath={`url(#${id}-clip)`}>
          <motion.g initial={false} animate={{ y: filled ? 0 : 170 }} transition={{ duration: filled ? 1.5 : 1.1, delay: filled ? 0.35 : 0, ease: EASE }}>
            <rect x="55" y="182" width="290" height="160" fill={`url(#${id}-inner)`} />
            <motion.path d={WAVE_BACK} fill="#D9E8C8" opacity={0.3} animate={{ x: [0, 140] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} />
            <motion.path d={WAVE_FRONT} fill={C.matcha} opacity={0.9} animate={{ x: [0, -140] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
          </motion.g>
          {filled &&
            [0, 1, 2].map((i) => (
              <motion.ellipse
                key={`${pours}-r${i}`}
                cx="200"
                cy="188"
                rx="30"
                ry="6"
                fill="none"
                stroke="#E6F0D8"
                strokeWidth="1.5"
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: [0.2, 3], opacity: [0.9, 0] }}
                transition={{ duration: 1.6, delay: 0.5 + i * 0.35, ease: 'easeOut' }}
              />
            ))}
        </g>
        <path d="M95 190 C 105 250, 130 285, 160 300" stroke="#fff" strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d={BOWL} fill="none" stroke="#000" strokeOpacity="0.25" strokeWidth="1.5" />
        <ellipse cx="200" cy="160" rx="130" ry="9" fill="none" stroke="#F3EBDD" strokeOpacity="0.5" strokeWidth="2" />
        <ellipse cx="200" cy="338" rx="105" ry="8" fill="#000" opacity="0.35" />
      </motion.svg>

      <span className="kicker absolute top-[92%] left-1/2 -translate-x-1/2 rounded-full border border-line bg-ink/60 px-3 py-1.5 text-[0.6rem] whitespace-nowrap text-cream-2 backdrop-blur transition-colors group-hover:border-matcha/50 group-hover:text-matcha" aria-hidden>
        {filled ? 'ещё раз?' : 'налить чай'}
      </span>
    </button>
  )
}
