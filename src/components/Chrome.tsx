import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useState, type MouseEvent } from 'react'
import { nav } from '../content'
import { EASE } from '../lib/motion'
import { TEAS, type TeaId } from '../lib/day'
import { useScrollTo } from '../lib/lenis'
import { Seal } from './Seal'

export function Nav({ ready, tea }: { ready: boolean; tea: TeaId }) {
  const scrollTo = useScrollTo()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24))

  const go = (e: MouseEvent, target: string) => {
    e.preventDefault()
    scrollTo(target)
  }
  const now = TEAS[tea]

  return (
    <motion.header
      className={`fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-[background-color,box-shadow] duration-500 ${
        scrolled ? 'bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] shadow-[0_1px_0_var(--rule)] backdrop-blur-md' : ''
      }`}
      initial={{ opacity: 0 }}
      animate={ready ? { opacity: 1 } : {}}
      transition={{ duration: 1, delay: 0.9, ease: EASE }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3 sm:px-8">
        <a href="#top" onClick={(e) => go(e, 'top')} className="flex items-center gap-3" aria-label="Иван, наверх">
          <Seal size={34} />
          <span className="hidden text-[1.0625rem] sm:block">Иван</span>
        </a>

        <nav aria-label="Разделы" className="hidden items-center gap-7 md:flex">
          {nav.map(({ label, target }) => (
            <a key={target} href={`#${target}`} onClick={(e) => go(e, target)} className="link text-[0.9375rem]">
              {label}
            </a>
          ))}
        </nav>

        {/* какой чай сейчас «заварен» — объясняет, почему меняется цвет страницы */}
        <p className="steep min-w-[7.5rem] text-right">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={tea}
              className="inline-block"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
            >
              {now.time}, {now.tea}
            </motion.span>
          </AnimatePresence>
        </p>
      </div>

      <nav aria-label="Разделы" className="no-scrollbar flex gap-5 overflow-x-auto px-5 pb-2.5 sm:px-8 md:hidden">
        {nav.map(({ label, target }) => (
          <a key={target} href={`#${target}`} onClick={(e) => go(e, target)} className="link shrink-0 py-1 text-small">
            {label}
          </a>
        ))}
      </nav>
    </motion.header>
  )
}

export function PrivacyNote({ ready }: { ready: boolean }) {
  const [open, setOpen] = useState(true)
  return (
    <AnimatePresence>
      {ready && open && (
        <motion.div
          role="status"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { delay: 2.2, duration: 0.8, ease: EASE } }}
          exit={{ y: 24, opacity: 0, transition: { duration: 0.3 } }}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-4 rounded-md bg-fg py-2 pr-2 pl-4 text-small text-bg shadow-[0_10px_30px_-12px_rgb(0_0_0/0.45)]"
        >
          <span>Здесь нет cookie и аналитики.</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded px-2.5 py-1 underline decoration-[color-mix(in_oklab,var(--bg)_40%,transparent)] underline-offset-4 transition-colors hover:decoration-current"
          >
            Понятно
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
