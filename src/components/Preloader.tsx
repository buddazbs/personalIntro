import { AnimatePresence, animate, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { TEAS } from '../lib/day'
import { useReducedMotionPref } from '../hooks/useMedia'

const SEEN_KEY = 'intro-brewed'

/**
 * Единственная «самостоятельная» анимация сайта: ночь → заваривается сэнтя → рассвет.
 * Показывается один раз за сессию; при reduced motion — не показывается вовсе.
 */
export function Preloader({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotionPref()
  const [skip] = useState(() => reduced || sessionStorage.getItem(SEEN_KEY) === '1')
  const [visible, setVisible] = useState(!skip)
  const [level, setLevel] = useState(0)
  const numRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (skip) {
      onDone()
      return
    }
    let cancelled = false
    const ctrl = animate(0, 100, {
      duration: 1.5,
      ease: [0.45, 0, 0.2, 1],
      onUpdate: (v) => {
        if (numRef.current) numRef.current.textContent = String(Math.round(v))
        setLevel(v / 100)
      },
    })
    Promise.all([ctrl.finished, document.fonts.ready]).then(() => {
      if (cancelled) return
      sessionStorage.setItem(SEEN_KEY, '1')
      setVisible(false)
      onDone()
    })
    return () => {
      cancelled = true
      ctrl.stop()
    }
  }, [skip, onDone])

  // уровень настоя в чаше: y от 70 (пусто) до 36 (полно)
  const teaY = 70 - level * 34
  const night = TEAS.dianhong

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[100] grid place-items-center"
          style={{ background: night.bg, color: night.fg }}
          initial={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
          role="status"
        >
          <motion.div className="flex flex-col items-center gap-7" exit={{ y: -40, opacity: 0 }} transition={{ duration: 0.6 }}>
            <svg width="132" height="100" viewBox="0 0 120 92" aria-hidden>
              <defs>
                <clipPath id="pl-bowl">
                  <path d="M14 30 C 18 70, 38 88, 60 88 C 82 88, 102 70, 106 30 Z" />
                </clipPath>
              </defs>
              <g clipPath="url(#pl-bowl)">
                <rect x="0" y={teaY} width="120" height="100" fill={TEAS.sencha.bg} />
                <motion.path
                  d={`M-30 ${teaY} q 15 -3 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 v 5 h -180 z`}
                  fill="#F2F3D8"
                  animate={{ x: [0, 30] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                />
              </g>
              <path d="M14 30 C 18 70, 38 88, 60 88 C 82 88, 102 70, 106 30" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" fill="none" />
              <ellipse cx="60" cy="30" rx="46" ry="5" stroke="currentColor" strokeOpacity="0.35" fill="none" />
            </svg>
            <p className="text-small italic">
              Заваривается сэнтя… <span ref={numRef} className="tabular-nums">0</span>%
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
