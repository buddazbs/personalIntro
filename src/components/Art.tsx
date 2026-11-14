import { motion } from 'motion/react'
import type { ReactElement } from 'react'
import type { Glyph, InterestId } from '../content'
import { C } from '../lib/colors'

/* Анимированные иллюстрации интересов и глифы черт характера */

const loop = (duration: number, delay = 0) => ({ duration, delay, repeat: Infinity, ease: 'easeInOut' as const })
const inView = { once: false, amount: 0.3 } as const

function TeaArt() {
  return (
    <svg viewBox="0 0 400 260" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <text x="380" y="250" fontSize="220" textAnchor="end" fill={C.cream} opacity="0.05" className="font-serif">
        茶
      </text>
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d={`M${170 + i * 30} 150 C ${164 + i * 30} 120, ${184 + i * 30} 108, ${174 + i * 30} 80 S ${164 + i * 30} 46, ${180 + i * 30} 18`}
          stroke={C.cream}
          strokeOpacity={0.45}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: [0, 1, 1], opacity: [0, 0.9, 0], y: [8, 0, -10] }}
          viewport={inView}
          transition={loop(3.4, i * 0.5)}
        />
      ))}
      <ellipse cx="200" cy="168" rx="110" ry="14" fill={C.matcha} opacity="0.9" />
      <path d="M90 168 C 100 240, 145 262, 200 264 C 255 262, 300 240, 310 168" fill={C.cream} fillOpacity="0.08" stroke={C.cream} strokeOpacity="0.35" />
      <motion.ellipse cx="200" cy="168" rx="40" ry="5" fill="none" stroke="#E6F0D8" strokeWidth="1.2" whileInView={{ scale: [0.4, 2.4], opacity: [0.8, 0] }} viewport={inView} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }} />
    </svg>
  )
}

function BooksArt() {
  const books = [
    { x: 70, h: 120, c: C.clay },
    { x: 96, h: 150, c: C.matchaDeep },
    { x: 122, h: 108, c: C.butter },
    { x: 148, h: 165, c: C.plum },
    { x: 174, h: 132, c: C.sky },
    { x: 200, h: 155, c: C.matcha },
    { x: 226, h: 118, c: C.cream },
  ]
  return (
    <svg viewBox="0 0 400 260" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      {books.map((b, i) => (
        <motion.g key={b.x} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ originY: 1 }} transition={{ duration: 1, delay: 0.3 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}>
          <rect x={b.x} y={230 - b.h} width="22" height={b.h} rx="2" fill={b.c} opacity="0.85" />
          <rect x={b.x + 4} y={230 - b.h + 14} width="14" height="2" fill={C.ink} opacity="0.35" />
          <rect x={b.x + 4} y={230 - b.h + 20} width="14" height="2" fill={C.ink} opacity="0.35" />
        </motion.g>
      ))}
      <motion.g style={{ originX: 0, originY: 1 }} whileInView={{ rotate: [12, 18, 12] }} viewport={inView} transition={loop(5)}>
        <rect x="262" y="96" width="24" height="134" rx="2" fill={C.clay} opacity="0.6" />
      </motion.g>
      <line x1="50" y1="231" x2="340" y2="231" stroke={C.cream} strokeOpacity="0.2" />
    </svg>
  )
}

function TravelArt() {
  const pts = [
    { x: 80, y: 150, label: 'Киото' },
    { x: 200, y: 112, label: 'Порто' },
    { x: 318, y: 138, label: 'Тбилиси' },
  ]
  return (
    <svg viewBox="0 0 400 260" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1="0" y1={30 + i * 26} x2="400" y2={30 + i * 26} stroke={C.cream} strokeOpacity="0.04" />
      ))}
      <motion.path d="M30 190 C 60 160, 70 150, 80 150 S 150 100, 200 112 S 290 150, 318 138 S 370 100, 390 90" stroke={C.sky} strokeWidth="1.6" fill="none" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2.4, ease: 'easeInOut' }} />
      {pts.map((p, i) => (
        <motion.g key={p.label} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 + i * 0.5, duration: 0.8 }}>
          <motion.circle cx={p.x} cy={p.y} r="10" fill={C.clay} opacity="0.25" animate={{ scale: [1, 1.8, 1], opacity: [0.35, 0, 0.35] }} transition={loop(2.4, i * 0.4)} />
          <circle cx={p.x} cy={p.y} r="4" fill={C.clay} />
          <text x={p.x} y={p.y - 18} textAnchor="middle" fontSize="13" fill={C.cream} opacity="0.75" className="font-sans">
            {p.label}
          </text>
        </motion.g>
      ))}
    </svg>
  )
}

function PhotoArt() {
  return (
    <svg viewBox="0 0 400 260" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      {['M90 50 h-24 v24', 'M310 50 h24 v24', 'M90 210 h-24 v-24', 'M310 210 h24 v-24'].map((d) => (
        <path key={d} d={d} stroke={C.cream} strokeOpacity="0.5" strokeWidth="1.5" fill="none" />
      ))}
      <motion.g style={{ originX: 0.5, originY: 0.5 }} whileInView={{ rotate: 360 }} viewport={inView} transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}>
        {Array.from({ length: 6 }, (_, i) => (
          <path key={i} d="M200 130 L 200 72 A 58 58 0 0 1 250 101 Z" transform={`rotate(${i * 60} 200 130)`} fill={i % 2 ? C.clay : C.butter} opacity={0.18 + (i % 3) * 0.08} stroke={C.ink} strokeOpacity="0.4" />
        ))}
      </motion.g>
      <circle cx="200" cy="130" r="58" fill="none" stroke={C.cream} strokeOpacity="0.4" />
      <motion.circle cx="200" cy="130" r="18" fill={C.ink} stroke={C.clay} strokeWidth="1.5" whileInView={{ r: [14, 24, 14] }} viewport={inView} transition={loop(4)} />
      <circle cx="300" cy="70" r="3" fill={C.clay} />
      <text x="290" y="74" textAnchor="end" fontSize="10" fill={C.clay} className="font-sans" letterSpacing="2">
        REC
      </text>
    </svg>
  )
}

function MusicArt() {
  const n = 16
  return (
    <svg viewBox="0 0 400 260" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      {Array.from({ length: n }, (_, i) => {
        const env = Math.sin(((i + 0.5) / n) * Math.PI)
        const h = 20 + env * 110
        return (
          <motion.rect
            key={i}
            x={80 + i * 15}
            width="7"
            rx="3.5"
            fill={C.plum}
            opacity={0.35 + env * 0.6}
            initial={{ height: h * 0.4, y: 130 - h * 0.2 }}
            whileInView={{ height: [h * 0.35, h, h * 0.55, h * 0.8, h * 0.35], y: [130 - h * 0.175, 130 - h / 2, 130 - h * 0.275, 130 - h * 0.4, 130 - h * 0.175] }}
            viewport={inView}
            transition={{ duration: 2.2 + (i % 4) * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * -0.15 }}
          />
        )
      })}
    </svg>
  )
}

function TechArt() {
  return (
    <svg viewBox="0 0 400 260" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      {Array.from({ length: 11 }, (_, i) => (
        <line key={i} x1={20 + i * 36} y1="20" x2={20 + i * 36} y2="240" stroke={C.cream} strokeOpacity="0.05" />
      ))}
      <motion.circle cx="110" cy="130" r="48" stroke={C.matcha} strokeWidth="1.5" fill="none" whileInView={{ scale: [1, 1.08, 1] }} viewport={inView} transition={loop(4)} />
      <motion.rect x="168" y="88" width="84" height="84" stroke={C.clay} strokeWidth="1.5" fill="none" style={{ originX: 0.5, originY: 0.5 }} whileInView={{ rotate: 90 }} viewport={inView} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} />
      <motion.path d="M290 172 L 326 92 L 362 172 Z" stroke={C.plum} strokeWidth="1.5" fill="none" style={{ originX: 0.5, originY: 0.5 }} whileInView={{ rotate: -120 }} viewport={inView} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} />
      <text x="200" y="232" textAnchor="middle" fontSize="13" fill={C.cream} opacity="0.35" className="font-sans" letterSpacing="3">
        {'</ невидимая />'}
      </text>
    </svg>
  )
}

export const interestArt = { tea: TeaArt, books: BooksArt, travel: TravelArt, photo: PhotoArt, music: MusicArt, tech: TechArt } satisfies Record<InterestId, () => ReactElement>

export function TraitGlyph({ kind, color }: { kind: Glyph; color: string }) {
  const s = { stroke: color, strokeWidth: 1.4, fill: 'none', strokeLinecap: 'round' } as const
  const draw = { initial: { pathLength: 0 }, whileInView: { pathLength: 1 }, viewport: { once: true }, transition: { duration: 1.6, ease: 'easeInOut' } } as const
  const svg = (children: ReactElement) => (
    <svg width="48" height="48" viewBox="0 0 44 44" aria-hidden>
      {children}
    </svg>
  )
  switch (kind) {
    case 'eye':
      return svg(
        <>
          <motion.path d="M4 22 Q 22 6, 40 22 Q 22 38, 4 22 Z" {...s} {...draw} />
          <motion.circle cx="22" cy="22" r="5" fill={color} animate={{ scaleY: [1, 1, 0.1, 1, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1] }} />
        </>,
      )
    case 'wave':
      return svg(
        <>
          <motion.path d="M4 22 Q 11 14, 18 22 T 32 22 T 44 22" {...s} {...draw} />
          <motion.path d="M4 30 Q 11 22, 18 30 T 32 30 T 44 30" {...s} strokeOpacity={0.5} {...draw} />
        </>,
      )
    case 'spiral':
      return svg(<motion.path d="M22 22 m-2 0 a 2 2 0 1 1 4 0 a 5 5 0 1 1 -10 0 a 9 9 0 1 1 18 0 a 14 14 0 1 1 -28 0" {...s} {...draw} />)
    case 'smirk':
      return svg(
        <>
          <motion.circle cx="22" cy="22" r="17" {...s} {...draw} />
          <motion.path d="M14 26 Q 22 32, 30 24" {...s} strokeWidth={1.6} {...draw} />
          <circle cx="16" cy="18" r="1.3" fill={color} />
          <circle cx="28" cy="18" r="1.3" fill={color} />
        </>,
      )
    case 'pillar':
      return svg(
        <>
          <motion.path d="M22 6 V38 M8 38 H36 M14 10 H30" {...s} {...draw} />
          <circle cx="22" cy="22" r="3" fill={color} />
        </>,
      )
    case 'diamond':
      return svg(
        <>
          <motion.path d="M22 5 L39 22 L22 39 L5 22 Z" {...s} {...draw} />
          <motion.path d="M22 13 L31 22 L22 31 L13 22 Z" fill={color} fillOpacity={0.2} stroke={color} strokeWidth={1.2} style={{ originX: 0.5, originY: 0.5 }} animate={{ rotate: [0, 90] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }} />
        </>,
      )
    default: {
      const unreachable: never = kind
      throw new Error(`Неизвестный глиф: ${String(unreachable)}`)
    }
  }
}
