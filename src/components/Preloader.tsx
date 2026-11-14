import { AnimatePresence, animate, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { C, EASE } from '../lib/colors'
import { useReducedMotionPref } from '../hooks/useMedia'

const COLS = 6

/** «Заваривается…»: чаша наполняется, затем экран уходит вверх шестью колоннами одна за другой */
export function Preloader({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotionPref()
  const [visible, setVisible] = useState(true)
  const [level, setLevel] = useState(0)
  const numRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (reduced) {
      setVisible(false)
      onDone()
      return
    }
    let cancelled = false
    const ctrl = animate(0, 100, {
      duration: 2,
      ease: [0.45, 0, 0.2, 1],
      onUpdate: (v) => {
        if (numRef.current) numRef.current.textContent = String(Math.round(v)).padStart(2, '0')
        setLevel(v / 100)
      },
    })
    Promise.all([ctrl.finished, document.fonts.ready]).then(() => {
      if (cancelled) return
      setVisible(false)
      // контент начинает появляться, пока колонны ещё уезжают
      window.setTimeout(onDone, 350)
    })
    return () => {
      cancelled = true
      ctrl.stop()
    }
  }, [reduced, onDone])

  const teaY = 70 - level * 36

  return (
    <AnimatePresence>
      {visible && (
        <motion.div key="preloader" className="fixed inset-0 z-[100]" exit={{ opacity: 1 }} transition={{ duration: 1.4 }} role="status" aria-label="Загрузка">
          <div className="absolute inset-0 flex">
            {Array.from({ length: COLS }, (_, i) => (
              <motion.div
                key={i}
                className="h-full flex-1 bg-ink"
                style={{ marginLeft: i ? -1 : 0 }}
                exit={{ y: '-100%' }}
                transition={{ duration: 0.9, delay: 0.25 + Math.abs(i - (COLS - 1) / 2) * 0.07, ease: [0.76, 0, 0.24, 1] }}
              />
            ))}
          </div>
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center gap-8"
            exit={{ y: -60, opacity: 0, filter: 'blur(8px)' }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <svg width="120" height="96" viewBox="0 0 120 96" aria-hidden>
              <defs>
                <clipPath id="pl-bowl">
                  <path d="M14 30 C 18 70, 38 88, 60 88 C 82 88, 102 70, 106 30 Z" />
                </clipPath>
                <linearGradient id="pl-tea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={C.matcha} />
                  <stop offset="1" stopColor={C.matchaDeep} />
                </linearGradient>
              </defs>
              {[0, 1, 2].map((i) => (
                <motion.path
                  key={i}
                  d={`M${46 + i * 14} 24 C ${42 + i * 14} 16, ${52 + i * 14} 12, ${46 + i * 14} 2`}
                  stroke={C.matcha}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: [0, 1, 1], opacity: [0, 0.7, 0], y: [4, 0, -6] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: 0.4 + i * 0.35, ease: 'easeOut' }}
                />
              ))}
              <g clipPath="url(#pl-bowl)">
                <rect x="0" y={teaY} width="120" height="100" fill="url(#pl-tea)" />
                <motion.path
                  d={`M-20 ${teaY} q 15 -4 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 v 6 h -180 z`}
                  fill={C.matcha}
                  animate={{ x: [0, -30] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                />
              </g>
              <path d="M14 30 C 18 70, 38 88, 60 88 C 82 88, 102 70, 106 30" stroke={C.cream} strokeOpacity="0.55" strokeWidth="1.5" fill="none" />
              <ellipse cx="60" cy="30" rx="46" ry="5" stroke={C.cream} strokeOpacity="0.3" fill="none" />
            </svg>
            <div className="flex items-baseline gap-4">
              <span className="kicker text-mute">заваривается</span>
              <span ref={numRef} className="font-serif text-5xl font-light tabular-nums text-cream">
                00
              </span>
            </div>
            <div className="h-px w-40 overflow-hidden bg-line">
              <div className="h-full origin-left bg-matcha" style={{ transform: `scaleX(${level})` }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
