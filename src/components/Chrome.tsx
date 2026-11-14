import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from 'motion/react'
import { useEffect, useState, type MouseEvent } from 'react'
import { nav } from '../content'
import { EASE } from '../lib/colors'
import { useScrollTo } from '../lib/lenis'
import { Signature } from './Signature'
import { Magnetic } from './Magnetic'

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  return <motion.div aria-hidden className="fixed top-0 right-0 left-0 z-[70] h-[2px] origin-left bg-gradient-to-r from-matcha-deep via-matcha to-butter" style={{ scaleX }} />
}

const ids = nav.map((n) => n.target)

function useActiveSection() {
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])
  return active
}

export function Nav({ ready }: { ready: boolean }) {
  const scrollTo = useScrollTo()
  const active = useActiveSection()
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // прячем шапку при прокрутке вниз, показываем при прокрутке вверх
  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setScrolled(y > 40)
    setHidden((h) => (y > 400 && y > prev + 2 ? true : y < prev - 2 ? false : h))
  })

  const go = (e: MouseEvent, target: string) => {
    e.preventDefault()
    scrollTo(target)
  }

  return (
    <motion.header
      className={`fixed top-0 right-0 left-0 z-50 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 transition-[background-color] duration-500 sm:px-6 ${scrolled ? 'bg-gradient-to-b from-ink/90 via-ink/60 to-transparent md:bg-none' : ''}`}
      initial={{ y: -100, opacity: 0 }}
      animate={ready ? { y: hidden ? -130 : 0, opacity: 1 } : {}}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <a href="#top" onClick={(e) => go(e, 'top')} className="flex items-center gap-3 rounded-full" aria-label="Иван, наверх">
          <Signature size={38} draw={ready} delay={0.3} />
          <span className="hidden leading-none sm:block">
            <span className="block font-serif text-xl text-cream">Иван</span>
            <span className="kicker mt-1 block text-[0.6rem] text-mute">digital profile</span>
          </span>
        </a>

        <nav aria-label="Разделы" className={`glass hidden items-center gap-1 rounded-full p-1.5 transition-shadow duration-500 md:flex ${scrolled ? 'shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]' : ''}`}>
          {nav.map(({ label, target }) => (
            <a
              key={target}
              href={`#${target}`}
              onClick={(e) => go(e, target)}
              className={`relative rounded-full px-4 py-2 text-sm transition-colors duration-300 ${active === target ? 'text-ink' : 'text-cream-2 hover:text-cream'}`}
            >
              {active === target && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-matcha" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
              <span className="relative">{label}</span>
            </a>
          ))}
        </nav>

        <Magnetic>
          <a href="#contact" onClick={(e) => go(e, 'contact')} className="glass flex items-center gap-2.5 rounded-full px-4 py-2.5 text-xs text-cream-2 transition-colors hover:text-cream">
            <span className="pulse-dot block h-1.5 w-1.5 rounded-full bg-matcha" />
            на связи
          </a>
        </Magnetic>
      </div>

      <nav aria-label="Разделы" className="no-scrollbar mx-auto mt-3 flex max-w-7xl gap-2 overflow-x-auto md:hidden">
        {nav.map(({ label, target }) => (
          <a
            key={target}
            href={`#${target}`}
            onClick={(e) => go(e, target)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs backdrop-blur-md transition-colors ${active === target ? 'border-matcha bg-matcha text-ink' : 'border-line bg-ink/50 text-cream-2'}`}
          >
            {label}
          </a>
        ))}
      </nav>
    </motion.header>
  )
}

export function PrivacyPill({ ready }: { ready: boolean }) {
  const [open, setOpen] = useState(true)
  return (
    <AnimatePresence>
      {ready && open && (
        <motion.div
          role="status"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { delay: 2.6, duration: 0.9, ease: EASE } }}
          exit={{ y: 80, opacity: 0, transition: { duration: 0.4 } }}
          className="glass fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink/70 px-4 py-2.5 sm:rounded-full md:right-auto md:left-6 md:mx-0"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-matcha/15 text-matcha">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M7 1 L12 3 V7 C12 10 9.8 12 7 12.8 C4.2 12 2 10 2 7 V3 Z" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </span>
          <span className="text-[0.78rem] leading-snug text-cream-2">Сайт не использует cookie и не собирает данные.</span>
          <button type="button" onClick={() => setOpen(false)} aria-label="Скрыть уведомление" className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-full text-mute transition-colors hover:bg-cream/10 hover:text-cream">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <path d="M1 1 L9 9 M9 1 L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
