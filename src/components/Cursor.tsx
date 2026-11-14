import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useState } from 'react'
import { useFinePointer, useReducedMotionPref } from '../hooks/useMedia'

/** Точка + кольцо с инерцией. Над [data-cursor="текст"] кольцо раскрывается и показывает подпись. */
export function Cursor() {
  const enabled = useFinePointer() && !useReducedMotionPref()
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const rx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 })
  const ry = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 })

  const [label, setLabel] = useState<string | null>(null)
  const [hovering, setHovering] = useState(false)
  const [down, setDown] = useState(false)
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('has-custom-cursor')
    const sync = (target: Element | null) => {
      const el = target?.closest?.('[data-cursor], a, button, [role="button"]')
      setHovering(!!el)
      setLabel(el?.getAttribute('data-cursor') || null)
    }
    const move = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setHidden(false)
      sync(e.target instanceof Element ? e.target : null)
    }
    const leave = () => setHidden(true)
    const pd = () => setDown(true)
    // после клика подпись могла смениться (чаша, модалка) — перечитываем элемент под курсором
    const pu = (e: PointerEvent) => {
      setDown(false)
      setTimeout(() => sync(document.elementFromPoint(e.clientX, e.clientY)), 60)
    }
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    window.addEventListener('pointerdown', pd)
    window.addEventListener('pointerup', pu)
    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      window.removeEventListener('pointerdown', pd)
      window.removeEventListener('pointerup', pu)
    }
  }, [enabled, x, y])

  if (!enabled) return null
  const size = label ? 92 : hovering ? 54 : 34

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[150]" style={{ opacity: hidden ? 0 : 1 }}>
      <motion.div
        className="absolute top-0 left-0 grid place-items-center rounded-full border"
        style={{ x: rx, y: ry, translateX: '-50%', translateY: '-50%' }}
        animate={{
          width: size,
          height: size,
          scale: down ? 0.85 : 1,
          backgroundColor: label ? 'rgba(168,198,134,0.95)' : 'rgba(168,198,134,0)',
          borderColor: label ? 'rgba(168,198,134,0)' : hovering ? 'rgba(168,198,134,0.9)' : 'rgba(243,235,221,0.35)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      >
        <AnimatePresence>
          {label && (
            <motion.span key={label} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} className="kicker text-[0.6rem] tracking-[0.18em] text-ink">
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      <motion.div
        className="absolute top-0 left-0 h-1.5 w-1.5 rounded-full bg-cream mix-blend-difference"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
        animate={{ opacity: label ? 0 : 1 }}
      />
    </div>
  )
}
