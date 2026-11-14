import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { EASE } from '../lib/colors'
import { useFinePointer, useReducedMotionPref } from '../hooks/useMedia'

/**
 * Курсор-«капля»: точка + кольцо на пружине. Режимы:
 *  idle  — кольцо тянется по направлению движения (squash & stretch);
 *  snap  — над небольшой кнопкой/ссылкой кольцо обнимает её контур и слегка тянется за рукой;
 *  hover — над крупным интерактивным блоком кольцо просто раскрывается;
 *  label — над [data-cursor="подпись"] курсор сжимается в точку, а рядом выплывает плашка
 *          с иконкой (не перекрывает сам объект);
 *  text  — над текстом превращается в каретку под размер шрифта.
 * Всё покадровое — прямые записи в style, React отвечает только за содержимое плашки.
 */

type Mode = 'idle' | 'snap' | 'hover' | 'label' | 'text'

const INTERACTIVE = '[data-cursor], a, button, [role="button"], [role="tab"], summary'
const TEXT = 'p, h1, h2, h3, h4, blockquote, li, figcaption'
const SNAP_MAX_W = 360
const SNAP_MAX_H = 110
const PILL_GAP = 20

const icon = (d: string) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d={d} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ICONS: Record<string, ReactNode> = {
  открыть: icon('M6 1.5 V10.5 M1.5 6 H10.5'),
  закрыть: icon('M2.5 2.5 L9.5 9.5 M9.5 2.5 L2.5 9.5'),
  написать: icon('M2.5 9.5 L9.5 2.5 M9.5 2.5 H4.5 M9.5 2.5 V7.5'),
  тяни: icon('M1 6 H11 M1 6 L3.5 3.5 M1 6 L3.5 8.5 M11 6 L8.5 3.5 M11 6 L8.5 8.5'),
  налить: icon('M6 1.5 C6 1.5 2.6 5.4 2.6 7.6 A3.4 3.4 0 0 0 9.4 7.6 C9.4 5.4 6 1.5 6 1.5 Z'),
  записаться: icon('M6 10.2 C2.6 7.9 1.2 6.1 1.2 4.3 A2.4 2.4 0 0 1 6 3.5 A2.4 2.4 0 0 1 10.8 4.3 C10.8 6.1 9.4 7.9 6 10.2 Z'),
  выпить: icon('M1.8 4 H10.2 L9.2 9.4 A1.6 1.6 0 0 1 7.6 10.8 H4.4 A1.6 1.6 0 0 1 2.8 9.4 Z M4.5 1.5 V2.4 M7.5 1.5 V2.4'),
}
const ARROW = icon('M1.5 6 H10.5 M7 2.5 L10.5 6 L7 9.5')

const RING = {
  idle: { border: 'rgba(243,235,221,0.4)', bg: 'rgba(168,198,134,0)', dot: 1 },
  hover: { border: 'rgba(168,198,134,0.9)', bg: 'rgba(168,198,134,0.06)', dot: 1 },
  snap: { border: 'rgba(168,198,134,0.55)', bg: 'rgba(168,198,134,0.08)', dot: 1 },
  label: { border: 'rgba(168,198,134,0)', bg: 'rgba(168,198,134,1)', dot: 0 },
  text: { border: 'rgba(243,235,221,0)', bg: 'rgba(243,235,221,0.85)', dot: 0 },
} as const satisfies Record<Mode, { border: string; bg: string; dot: number }>

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export function Cursor() {
  const enabled = useFinePointer() && !useReducedMotionPref()
  const rootRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    const root = rootRef.current
    const ring = ringRef.current
    const dot = dotRef.current
    const pill = pillRef.current
    if (!enabled || !root || !ring || !dot || !pill) return
    document.documentElement.classList.add('has-custom-cursor')

    const s = {
      mx: -100, my: -100, pmx: -100, pmy: -100, // мышь и её прошлое положение
      svx: 0, svy: 0, // сглаженная скорость мыши, px/с
      x: -100, y: -100, vx: 0, vy: 0, // кольцо на пружине
      w: 34, h: 34, r: 17, st: 0, press: 1,
      lx: -100, ly: -100, side: 1, below: 1, // плашка
      mode: 'idle' as Mode,
      target: null as Element | null,
      label: null as string | null,
      radius: 17,
      textH: 24,
      down: false,
      shown: false,
      resync: false,
    }

    const apply = (mode: Mode, el: Element | null, lab: string | null = null) => {
      if (mode === s.mode && el === s.target && lab === s.label) return
      s.mode = mode
      s.target = el
      if (lab !== s.label) {
        s.label = lab
        setLabel(lab)
      }
      const c = RING[mode]
      ring.style.borderColor = c.border
      ring.style.backgroundColor = c.bg
      dot.style.opacity = String(c.dot)
    }

    const sync = (t: Element | null) => {
      const el = t?.closest?.(INTERACTIVE) ?? null
      if (el) {
        const lab = el.getAttribute('data-cursor')
        if (lab) return apply('label', el, lab)
        const r = el.getBoundingClientRect()
        if (r.width <= SNAP_MAX_W && r.height <= SNAP_MAX_H) {
          s.radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 10
          return apply('snap', el)
        }
        return apply('hover', el)
      }
      const tx = t?.closest?.(TEXT)
      if (tx) {
        s.textH = clamp(parseFloat(getComputedStyle(tx).fontSize) * 1.15, 16, 46)
        return apply('text', tx)
      }
      apply('idle', null)
    }

    let raf = 0
    let last = 0
    const wake = () => {
      if (!raf) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    }

    const move = (e: PointerEvent) => {
      s.mx = e.clientX
      s.my = e.clientY
      if (!s.shown) {
        // первое появление — без «прилёта» из угла экрана
        s.shown = true
        s.x = s.pmx = s.lx = s.mx
        s.y = s.pmy = s.ly = s.my
        root.style.opacity = '1'
      }
      sync(e.target instanceof Element ? e.target : null)
      wake()
    }
    const leave = () => {
      s.shown = false
      root.style.opacity = '0'
    }
    const down = () => {
      s.down = true
      // волна от клика
      const rip = document.createElement('span')
      rip.className = 'cursor-ripple'
      rip.style.left = `${s.mx}px`
      rip.style.top = `${s.my}px`
      root.appendChild(rip)
      rip.addEventListener('animationend', () => rip.remove())
      wake()
    }
    // после клика подпись могла смениться (чаша, модалка) — перечитываем элемент под курсором
    const up = () => {
      s.down = false
      setTimeout(() => {
        s.resync = true
        wake()
      }, 60)
      wake()
    }
    // при прокрутке под неподвижным курсором оказывается другой элемент
    const scroll = () => {
      s.resync = true
      wake()
    }

    const frame = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now

      if (s.resync && s.shown) {
        s.resync = false
        sync(document.elementFromPoint(s.mx, s.my))
      }
      if (s.target && !s.target.isConnected) sync(document.elementFromPoint(s.mx, s.my))

      // скорость мыши
      const kv = 1 - Math.exp(-dt * 14)
      s.svx += ((s.mx - s.pmx) / dt - s.svx) * kv
      s.svy += ((s.my - s.pmy) / dt - s.svy) * kv
      s.pmx = s.mx
      s.pmy = s.my

      // цель кольца по режиму
      let tx = s.mx
      let ty = s.my
      let tw = 34
      let th = 34
      let tr = 17
      if (s.mode === 'hover') {
        tw = th = 58
        tr = 29
      } else if (s.mode === 'snap' && s.target) {
        const r = s.target.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const pad = 6
        tx = cx + (s.mx - cx) * 0.12
        ty = cy + (s.my - cy) * 0.12
        tw = r.width + pad * 2
        th = r.height + pad * 2
        tr = Math.min(s.radius + pad, th / 2)
      } else if (s.mode === 'label') {
        tw = th = 10
        tr = 5
      } else if (s.mode === 'text') {
        tw = 3
        th = s.textH
        tr = 1.5
      }

      // пружина положения (полунеявный Эйлер с подшагами — устойчиво при любых dt)
      const tight = s.mode === 'text' || s.mode === 'label'
      const K = tight ? 900 : 360
      const D = 2 * Math.sqrt(K) * (s.mode === 'snap' ? 0.62 : 0.85)
      const steps = Math.ceil(dt / (1 / 120))
      const h = dt / steps
      for (let i = 0; i < steps; i++) {
        s.vx += ((tx - s.x) * K - s.vx * D) * h
        s.vy += ((ty - s.y) * K - s.vy * D) * h
        s.x += s.vx * h
        s.y += s.vy * h
      }

      const ks = 1 - Math.exp(-dt * 16)
      s.w += (tw - s.w) * ks
      s.h += (th - s.h) * ks
      s.r += (tr - s.r) * ks
      s.press += ((s.down ? 0.8 : 1) - s.press) * (1 - Math.exp(-dt * 22))

      // вытягивание по скорости — только в «круглых» режимах
      const speed = Math.hypot(s.svx, s.svy)
      const free = s.mode === 'idle' || s.mode === 'hover'
      s.st += ((free ? Math.min(speed / 2600, 0.42) : 0) - s.st) * (1 - Math.exp(-dt * 18))
      const angle = free ? Math.atan2(s.svy, s.svx) : 0

      ring.style.width = `${s.w.toFixed(2)}px`
      ring.style.height = `${s.h.toFixed(2)}px`
      ring.style.borderRadius = `${s.r.toFixed(2)}px`
      ring.style.transform = `translate3d(${s.x.toFixed(2)}px,${s.y.toFixed(2)}px,0) translate(-50%,-50%) rotate(${angle.toFixed(4)}rad) scale(${((1 + s.st) * s.press).toFixed(4)},${((1 - s.st * 0.4) * s.press).toFixed(4)})`
      dot.style.transform = `translate3d(${s.mx}px,${s.my}px,0) translate(-50%,-50%) scale(${s.press.toFixed(3)})`

      // плашка: рядом с курсором, у края экрана переезжает на другую сторону; покачивается от скорости
      const pw = pill.offsetWidth
      const ph = pill.offsetHeight
      const kp = 1 - Math.exp(-dt * 10)
      s.side += ((s.mx + PILL_GAP + pw > window.innerWidth - 12 ? -1 : 1) - s.side) * kp
      s.below += ((s.my + PILL_GAP + ph > window.innerHeight - 12 ? -1 : 1) - s.below) * kp
      const ox = PILL_GAP + ((1 - s.side) / 2) * (-2 * PILL_GAP - pw)
      const oy = PILL_GAP * 0.6 + ((1 - s.below) / 2) * (-1.2 * PILL_GAP - ph)
      const kl = 1 - Math.exp(-dt * 16)
      s.lx += (s.mx + ox - s.lx) * kl
      s.ly += (s.my + oy - s.ly) * kl
      const tilt = clamp(s.svx * 0.008, -14, 14)
      pill.style.transform = `translate3d(${s.lx.toFixed(2)}px,${s.ly.toFixed(2)}px,0) rotate(${tilt.toFixed(2)}deg)`

      // засыпаем, когда всё улеглось (над кнопкой продолжаем следить: она может двигаться)
      const settled =
        s.mode !== 'snap' &&
        Math.abs(tx - s.x) + Math.abs(ty - s.y) < 0.05 &&
        Math.abs(s.vx) + Math.abs(s.vy) < 0.05 &&
        Math.abs(tw - s.w) + Math.abs(th - s.h) < 0.05 &&
        speed < 0.5 &&
        Math.abs(s.press - (s.down ? 0.8 : 1)) < 0.001 &&
        Math.abs(s.mx + ox - s.lx) + Math.abs(s.my + oy - s.ly) < 0.05
      if (!settled) raf = requestAnimationFrame(frame)
    }

    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    window.addEventListener('blur', leave)
    window.addEventListener('pointerdown', down, { passive: true })
    window.addEventListener('pointerup', up, { passive: true })
    window.addEventListener('scroll', scroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      window.removeEventListener('blur', leave)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('scroll', scroll)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none fixed inset-0 z-[150] opacity-0 transition-opacity duration-300">
      <div
        ref={ringRef}
        className="absolute top-0 left-0 h-[34px] w-[34px] rounded-full border border-cream/40 transition-[border-color,background-color] duration-300 will-change-transform"
      />
      <div ref={dotRef} className="absolute top-0 left-0 h-1.5 w-1.5 rounded-full bg-cream mix-blend-difference transition-opacity duration-200 will-change-transform" />

      <div ref={pillRef} className="absolute top-0 left-0 will-change-transform">
        <AnimatePresence>
          {label && (
            <motion.div
              key="pill"
              className="flex items-center gap-2 rounded-full bg-cream py-1.5 pr-3.5 pl-1.5 whitespace-nowrap text-ink shadow-[0_12px_30px_-10px_rgba(0,0,0,0.7)]"
              style={{ originX: 0, originY: 0 }}
              initial={{ opacity: 0, scale: 0.5, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.5, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <span className="grid h-6 w-6 place-items-center overflow-hidden rounded-full bg-ink text-matcha">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span key={label} className="grid" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ duration: 0.35, ease: EASE }}>
                    {ICONS[label] ?? ARROW}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="relative overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span key={label} className="kicker block text-[0.6rem] tracking-[0.2em]" initial={{ y: '110%' }} animate={{ y: '0%' }} exit={{ y: '-110%' }} transition={{ duration: 0.4, ease: EASE }}>
                    {label}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
