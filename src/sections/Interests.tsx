import { AnimatePresence, motion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { interests, type Interest, type InterestId } from '../content'
import { accentColor, EASE } from '../lib/colors'
import { interestArt } from '../components/Art'
import { SectionHeading } from '../components/Reveal'
import { trackSpotlight } from '../components/Spotlight'
import { useDesktop } from '../hooks/useMedia'
import { useLenis } from '../lib/lenis'

function Card({ item, index, onOpen }: { item: Interest; index: number; onOpen: () => void }) {
  const Art = interestArt[item.id]
  const color = accentColor[item.accent]
  const wide = item.id === 'tea'
  return (
    <motion.button
      type="button"
      layoutId={`card-${item.id}`}
      onClick={onOpen}
      onPointerMove={trackSpotlight}
      data-cursor="открыть"
      aria-label={`${item.title} — подробнее`}
      className={`spotlight group glass relative flex h-full shrink-0 flex-col overflow-hidden text-left ${wide ? 'w-[min(88vw,38rem)]' : 'w-[min(82vw,26rem)]'}`}
      style={{ borderRadius: 32 }}
    >
      <div aria-hidden className="absolute inset-0 opacity-60 transition-opacity duration-700 group-hover:opacity-100" style={{ background: `radial-gradient(120% 80% at 50% 0%, ${color}26, transparent 60%)` }} />
      <motion.div layoutId={`art-${item.id}`} className="relative min-h-0 flex-1 transition-transform duration-700 ease-out group-hover:scale-[1.06]" aria-hidden>
        <Art />
      </motion.div>
      <div className="relative z-[2] p-6 sm:p-7">
        <div className="mb-3 flex items-center justify-between text-mute">
          <span className="kicker text-[0.6rem]">
            {String(index + 1).padStart(2, '0')} · {item.id}
          </span>
          <span className="relative grid h-9 w-9 place-items-center rounded-full border border-line transition-all duration-500 group-hover:rotate-90 group-hover:border-transparent group-hover:text-ink">
            <span className="absolute inset-0 scale-0 rounded-full transition-transform duration-500 group-hover:scale-100" style={{ background: color }} />
            <svg width="12" height="12" viewBox="0 0 12 12" className="relative" aria-hidden>
              <path d="M6 1 V11 M1 6 H11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
        </div>
        <motion.h3 layoutId={`title-${item.id}`} className="font-serif text-[clamp(1.9rem,3vw,2.6rem)] leading-[1.02] font-light tracking-[-0.015em]">
          {item.title}
        </motion.h3>
        <p className="mt-3 line-clamp-3 text-[0.92rem] leading-relaxed text-cream-2">{item.teaser}</p>
      </div>
    </motion.button>
  )
}

/** Coverflow: карточка поворачивается в 3D и уменьшается, когда уходит от центра экрана */
function Flow({ x, children }: { x: MotionValue<number>; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [geo, setGeo] = useState({ left: 0, width: 1, vw: 1 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setGeo({ left: el.offsetLeft, width: el.offsetWidth, vw: window.innerWidth })
    measure()
    // ширина карточек меняется после загрузки шрифтов — следим за лентой целиком
    const ro = new ResizeObserver(measure)
    if (el.parentElement) ro.observe(el.parentElement)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])
  const d = useTransform(x, (v) => (geo.left + geo.width / 2 + v - geo.vw / 2) / geo.vw)
  const rotateY = useTransform(d, [-0.8, 0, 0.8], [28, 0, -28])
  const scale = useTransform(d, [-0.9, 0, 0.9], [0.84, 1, 0.84])
  const z = useTransform(d, [-0.9, 0, 0.9], [-160, 0, -160])
  const opacity = useTransform(d, [-1.1, -0.6, 0, 0.6, 1.1], [0.3, 0.75, 1, 0.75, 0.3])
  return (
    <motion.div ref={ref} className="h-full shrink-0 [transform-style:preserve-3d]" style={{ rotateY, scale, z, opacity }}>
      {children}
    </motion.div>
  )
}

function Detail({ item, onClose }: { item: Interest; onClose: () => void }) {
  const Art = interestArt[item.id]
  const color = accentColor[item.accent]
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby={`dlg-${item.id}`}>
      <motion.div className="absolute inset-0 bg-ink/75 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} data-cursor="закрыть" />
      <motion.div
        layoutId={`card-${item.id}`}
        className="relative flex max-h-[92svh] w-full max-w-3xl flex-col overflow-hidden border border-line bg-ink-2"
        style={{ borderRadius: 32 }}
        transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      >
        <div aria-hidden className="absolute inset-0" style={{ background: `radial-gradient(120% 70% at 50% 0%, ${color}2e, transparent 60%)` }} />
        <motion.div layoutId={`art-${item.id}`} className="relative h-48 shrink-0 sm:h-64" aria-hidden>
          <Art />
        </motion.div>
        <div className="relative overflow-y-auto overscroll-contain p-7 sm:p-10" data-lenis-prevent>
          <motion.h3 id={`dlg-${item.id}`} layoutId={`title-${item.id}`} className="font-serif text-[clamp(2.25rem,5vw,3.5rem)] leading-none font-light tracking-[-0.02em]">
            {item.title}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { delay: 0.2, duration: 0.8, ease: EASE } }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="mt-6 font-serif text-[clamp(1.25rem,2.2vw,1.6rem)] leading-[1.4] font-light text-cream/90 italic"
          >
            {item.back}
          </motion.p>
          <motion.ul className="mt-8 flex flex-wrap gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.35 } }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
            {item.tags.map((t, i) => (
              <motion.li
                key={t}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1, transition: { delay: 0.4 + i * 0.06, type: 'spring', stiffness: 300, damping: 18 } }}
                className="rounded-full border px-3 py-1 text-xs"
                style={{ borderColor: `${color}55`, color }}
              >
                {t}
              </motion.li>
            ))}
          </motion.ul>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-4 right-4 z-10 grid h-11 w-11 place-items-center rounded-full border border-line bg-ink/60 text-cream backdrop-blur transition-transform duration-500 hover:rotate-90"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path d="M1 1 L11 11 M11 1 L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </motion.div>
    </div>
  )
}

export function Interests() {
  const desktop = useDesktop()
  const lenis = useLenis()
  const [open, setOpen] = useState<InterestId | null>(null)
  const lastFocus = useRef<HTMLElement | null>(null)
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [distance, setDistance] = useState(0)

  // насколько сдвинуть ленту, чтобы последняя карточка встала по центру
  useLayoutEffect(() => {
    const el = track.current
    if (!el || !desktop) return
    const measure = () => setDistance(Math.max(0, el.scrollWidth - window.innerWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [desktop])

  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const xRaw = useTransform(scrollYProgress, [0, 1], [0, -distance])
  const x = useSpring(xRaw, { stiffness: 140, damping: 30, mass: 0.4 })

  const openCard = (id: InterestId) => {
    lastFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setOpen(id)
  }
  const close = useCallback(() => {
    setOpen(null)
    requestAnimationFrame(() => lastFocus.current?.focus({ preventScroll: true }))
  }, [])

  useEffect(() => {
    if (open) lenis?.stop()
    else lenis?.start()
    document.documentElement.style.overflow = open ? 'hidden' : ''
  }, [open, lenis])

  const active = interests.find((i) => i.id === open)
  const card = (item: Interest, i: number) => <Card key={item.id} item={item} index={i} onOpen={() => openCard(item.id)} />

  return (
    <>
      {desktop ? (
        <section id="interests" ref={section} className="relative" style={{ height: `calc(100vh + ${distance}px)` }}>
          <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
            <div className="mx-auto w-full max-w-7xl px-8">
              <SectionHeading kicker="02 — интересы" title="чем заполнено время" />
            </div>
            <motion.div
              ref={track}
              style={{ x }}
              className="mt-12 flex h-[min(54vh,32rem)] w-max gap-6 [perspective:1400px] pr-[calc(50vw-13rem)] pl-[max(2rem,calc((100vw-80rem)/2+2rem))]"
            >
              {interests.map((item, i) => (
                <Flow key={item.id} x={x}>
                  {card(item, i)}
                </Flow>
              ))}
            </motion.div>
            <div className="mx-auto mt-10 flex w-full max-w-7xl items-center gap-4 px-8 text-mute">
              <span className="kicker text-[0.6rem]">листай</span>
              <div className="h-px flex-1 bg-line">
                <motion.div className="h-px origin-left bg-matcha" style={{ scaleX: scrollYProgress }} />
              </div>
              <span className="kicker text-[0.6rem]">{String(interests.length).padStart(2, '0')}</span>
            </div>
          </div>
        </section>
      ) : (
        <section id="interests" className="relative scroll-mt-24 py-24">
          <div className="px-5 sm:px-8">
            <SectionHeading kicker="02 — интересы" title="чем заполнено время" />
          </div>
          <div className="no-scrollbar mt-12 flex h-[30rem] snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:px-8 [&>*]:snap-center">{interests.map(card)}</div>
        </section>
      )}
      <AnimatePresence>{active && <Detail key={active.id} item={active} onClose={close} />}</AnimatePresence>
    </>
  )
}
