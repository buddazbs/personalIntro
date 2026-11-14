import { motion } from 'motion/react'
import { lazy, Suspense, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { closeDate, dateOrigin } from '../lib/route'

// код анкеты грузится, только когда её открывают
const DateFlow = lazy(() => import('./DateFlow'))

/**
 * Полноэкранный слой анкеты: раскрывается кругом из точки нажатия и сворачивается обратно.
 * Пока открыт — сайт под ним недоступен (inert) и не прокручивается.
 */
export function DateOverlay() {
  useEffect(() => {
    const root = document.getElementById('root')
    const html = document.documentElement
    const prevOverflow = html.style.overflow
    root?.setAttribute('inert', '')
    html.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeDate()
    window.addEventListener('keydown', onKey)
    return () => {
      root?.removeAttribute('inert')
      html.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const at = `${(dateOrigin.x * 100).toFixed(1)}% ${(dateOrigin.y * 100).toFixed(1)}%`

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Записаться на свидание"
      className="fixed inset-0 z-[120] bg-[#110d0f]"
      initial={{ clipPath: `circle(0% at ${at})` }}
      animate={{ clipPath: `circle(150% at ${at})`, transition: { duration: 1.1, ease: [0.7, 0, 0.2, 1] } }}
      exit={{ clipPath: `circle(0% at ${at})`, transition: { duration: 0.75, ease: [0.7, 0, 0.84, 0] } }}
    >
      <Suspense fallback={null}>
        <DateFlow onClose={closeDate} />
      </Suspense>
    </motion.div>,
    document.body,
  )
}
