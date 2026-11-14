import { motion, useInView, type Variants } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { EASE } from '../lib/colors'
import { useReducedMotionPref } from '../hooks/useMedia'

/** Появление блока при прокрутке: подъём + снятие размытия */
export function Reveal({ children, delay = 0, y = 40, className = '' }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 1.1, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

const charVariants: Variants = {
  hidden: { y: '115%', rotateX: -80, opacity: 0, filter: 'blur(8px)' },
  show: (i: number) => ({
    y: '0%',
    rotateX: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 1.1, delay: i * 0.025, ease: EASE },
  }),
}

/**
 * Заголовок собирается по буквам: каждая выезжает из-под маски, разворачиваясь в 3D.
 * Последнее слово — курсив с текучим градиентом.
 */
export function SplitHeading({ text, as: Tag = 'h2', className = '', accentLast = true }: { text: string; as?: 'h1' | 'h2' | 'h3' | 'p'; className?: string; accentLast?: boolean }) {
  const words = text.split(' ')
  const MotionTag = motion[Tag]
  let n = 0
  return (
    <MotionTag className={`[perspective:600px] ${className}`} initial="hidden" whileInView="show" viewport={{ once: true, margin: '0px 0px -10% 0px' }}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((w, wi) => {
          const last = accentLast && wi === words.length - 1
          return (
            <span key={`${w}-${wi}`} className={`inline-block whitespace-nowrap ${last ? 'italic pr-[0.08em]' : ''}`}>
              {[...w].map((ch, ci) => (
                <span key={ci} className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom">
                  <motion.span custom={n++} variants={charVariants} className={`inline-block origin-bottom ${last ? 'text-flow' : ''}`}>
                    {ch}
                  </motion.span>
                </span>
              ))}
              {wi < words.length - 1 && <span className="inline-block w-[0.26em]" />}
            </span>
          )
        })}
      </span>
    </MotionTag>
  )
}

const GLYPHS = 'абвгдеёжзийклмнопрстуфхцчшщэюя茶01—·'

/** Текст «расшифровывается»: буквы перебираются, пока не встанут на место */
export function Scramble({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const reduced = useReducedMotionPref()
  const [out, setOut] = useState(text)

  useEffect(() => {
    if (!inView || reduced) return
    const chars = [...text]
    const total = 26
    let frame = 0
    let id = 0
    const start = window.setTimeout(() => {
      id = window.setInterval(() => {
        frame++
        setOut(
          chars
            .map((c, i) => (c === ' ' || i < (frame / total) * chars.length ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
            .join(''),
        )
        if (frame >= total) window.clearInterval(id)
      }, 32)
    }, delay * 1000)
    return () => {
      window.clearTimeout(start)
      window.clearInterval(id)
    }
  }, [inView, reduced, text, delay])

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{out}</span>
    </span>
  )
}

/** Заголовок секции: линия + расшифровывающаяся подпись + буквенная сборка */
export function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 text-mute">
        <motion.span
          className="h-px w-12 origin-left bg-clay"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: EASE }}
        />
        <Scramble text={kicker} className="kicker" delay={0.15} />
      </div>
      <SplitHeading text={title} className="font-serif text-[clamp(2.75rem,7vw,6.5rem)] leading-[0.95] font-light tracking-[-0.02em] text-cream" />
    </div>
  )
}
