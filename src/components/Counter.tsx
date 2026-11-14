import { animate, useInView } from 'motion/react'
import { useEffect, useRef } from 'react'
import { useReducedMotionPref } from '../hooks/useMedia'

export function Counter({ value, pad = 0, className = '' }: { value: number; pad?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const reduced = useReducedMotionPref()
  useEffect(() => {
    const el = ref.current
    if (!el || !inView) return
    const fmt = (n: number) => String(Math.round(n)).padStart(pad, '0')
    if (reduced) {
      el.textContent = fmt(value)
      return
    }
    const ctrl = animate(0, value, { duration: 2, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => (el.textContent = fmt(v)) })
    return () => ctrl.stop()
  }, [inView, value, pad, reduced])
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {String(0).padStart(pad, '0')}
    </span>
  )
}
