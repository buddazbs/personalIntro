import { AnimatePresence, motion } from 'motion/react'
import { useId, useState } from 'react'
import { EASE } from '../lib/motion'

const BOWL = 'M70 160 C 80 280, 130 320, 200 322 C 270 320, 320 280, 330 160 Z'
const WAVE = 'M-85 178 Q -50 172, -15 178 T 55 178 T 125 178 T 195 178 T 265 178 T 335 178 T 405 178 T 475 178 L 475 260 L -85 260 Z'
// потёки глазури тенмоку по краю чаши
const DRIP =
  'M72 166 C 72 160, 328 160, 328 166 L 327 174 C 316 176, 312 186, 306 176 C 270 178, 240 176, 214 178 C 206 186, 200 186, 196 178 C 160 178, 120 176, 96 176 C 90 184, 84 184, 80 175 Z'

/** Чаша: нажал — налили сэнтя, нажал ещё раз — выпили. */
export function TeaBowl({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  const [filled, setFilled] = useState(false)
  const [pours, setPours] = useState(0)

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <button
        type="button"
        onClick={() => {
          setFilled((f) => !f)
          setPours((p) => p + 1)
        }}
        aria-pressed={filled}
        className="group w-full rounded-full"
      >
        <span className="sr-only">{filled ? 'Выпить чай' : 'Налить чай'}</span>
        <motion.svg
          viewBox="0 0 400 360"
          className="h-auto w-full overflow-visible"
          aria-hidden
          whileHover={{ rotate: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        >
          <defs>
            <linearGradient id={`${id}-glaze`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F7F2E3" />
              <stop offset="70%" stopColor="#E3D6BA" />
              <stop offset="100%" stopColor="#C4AF8A" />
            </linearGradient>
            <linearGradient id={`${id}-tea`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B7BF5E" />
              <stop offset="100%" stopColor="#6E7F2E" />
            </linearGradient>
            <clipPath id={`${id}-clip`}>
              <path d={BOWL} />
            </clipPath>
          </defs>

          {/* пар */}
          {filled &&
            [0, 1, 2].map((i) => (
              <motion.path
                key={`${pours}-${i}`}
                d={`M${165 + i * 35} 140 C ${159 + i * 35} 108, ${181 + i * 35} 96, ${171 + i * 35} 64 S ${161 + i * 35} 28, ${177 + i * 35} -4`}
                stroke="var(--fg)"
                strokeOpacity={0.4}
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.9, 0], y: [8, 0, -12] }}
                transition={{ duration: 3.4, delay: 1.5 + i * 0.5, repeat: 2, ease: 'easeOut' }}
              />
            ))}

          {/* струя */}
          <AnimatePresence>
            {filled && (
              <motion.line
                key={`stream-${pours}`}
                x1="200"
                y1="30"
                x2="200"
                y2="196"
                stroke="#8E9C3E"
                strokeWidth="7"
                strokeLinecap="round"
                initial={{ pathLength: 0, pathOffset: 0 }}
                animate={{ pathLength: [0, 1, 1, 0], pathOffset: [0, 0, 0, 1] }}
                transition={{ duration: 1.8, times: [0, 0.25, 0.7, 1], ease: 'easeInOut' }}
              />
            )}
          </AnimatePresence>

          <path d={BOWL} fill={`url(#${id}-glaze)`} />

          <g clipPath={`url(#${id}-clip)`}>
            <motion.g initial={false} animate={{ y: filled ? 0 : 170 }} transition={{ duration: filled ? 1.4 : 1, delay: filled ? 0.35 : 0, ease: EASE }}>
              <rect x="55" y="182" width="290" height="160" fill={`url(#${id}-tea)`} />
              <motion.path d={WAVE} fill="#C9CF7A" animate={{ x: [0, -140] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }} />
            </motion.g>
            <path d={DRIP} fill="#7A5A3A" opacity="0.75" />
          </g>

          <path d="M98 200 C 108 252, 132 284, 160 300" stroke="#fff" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d={BOWL} fill="none" stroke="var(--fg)" strokeOpacity="0.55" strokeWidth="1.5" />
          <ellipse cx="200" cy="160" rx="130" ry="8" fill="none" stroke="var(--fg)" strokeOpacity="0.45" strokeWidth="1.5" />
          <path d="M150 322 L 152 336 L 248 336 L 250 322" fill="#C4AF8A" stroke="var(--fg)" strokeOpacity="0.45" strokeWidth="1.5" />
        </motion.svg>
      </button>
      <span className="mt-4 text-small text-muted italic" aria-hidden>
        {filled ? 'Нажми ещё раз, чтобы выпить' : 'Нажми на чашу, чтобы налить чай'}
      </span>
    </div>
  )
}
