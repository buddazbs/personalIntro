import { motion } from 'motion/react'
import type { ReactElement } from 'react'
import type { Glyph, InterestId } from '../content'

/*
  Иллюстрации тушью: линия цвета текста, один акцент.
  Прорисовываются, когда интерес выбирают, — анимация отвечает на действие.
*/

const ink = { stroke: 'currentColor', strokeWidth: 1.6, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const draw = (delay = 0) =>
  ({
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { pathLength: { duration: 1.3, delay, ease: [0.65, 0, 0.35, 1] }, opacity: { duration: 0.2, delay } },
  }) as const

function Tea() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.path key={i} d={`M${170 + i * 30} 120 C ${164 + i * 30} 96, ${184 + i * 30} 84, ${174 + i * 30} 60 S ${166 + i * 30} 30, ${180 + i * 30} 12`} {...ink} strokeWidth={1.2} {...draw(0.8 + i * 0.15)} />
      ))}
      <motion.path d="M90 140 C 100 210, 145 236, 200 238 C 255 236, 300 210, 310 140" {...ink} {...draw()} />
      <motion.ellipse cx="200" cy="140" rx="110" ry="12" {...ink} {...draw(0.3)} />
      <motion.ellipse cx="200" cy="141" rx="96" ry="8" fill="#8E9C3E" initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} transition={{ delay: 0.9, duration: 0.6 }} />
      <motion.path d="M160 238 L 162 250 L 238 250 L 240 238" {...ink} {...draw(0.5)} />
    </>
  )
}

function Books() {
  const spines = [
    { x: 92, h: 120 },
    { x: 118, h: 150 },
    { x: 144, h: 106 },
    { x: 170, h: 166 },
    { x: 196, h: 132 },
    { x: 222, h: 152 },
  ]
  return (
    <>
      {spines.map((b, i) => (
        <motion.rect key={b.x} x={b.x} y={232 - b.h} width="22" height={b.h} rx="1.5" {...ink} {...draw(i * 0.08)} />
      ))}
      <motion.rect x="256" y="104" width="24" height="132" rx="1.5" transform="rotate(14 256 236)" fill="var(--accent)" fillOpacity={0.18} stroke="currentColor" strokeWidth={1.6} {...draw(0.6)} />
      <motion.path d="M60 236 H 340" {...ink} {...draw(0.1)} />
    </>
  )
}

function Travel() {
  const pts = [
    { x: 86, y: 150, label: 'Киото' },
    { x: 200, y: 108, label: 'Порто' },
    { x: 314, y: 140, label: 'Тбилиси' },
  ]
  return (
    <>
      <motion.path d="M30 196 C 60 160, 70 150, 86 150 S 150 98, 200 108 S 290 152, 314 140 S 360 104, 380 94" {...ink} strokeDasharray="2 7" {...draw()} />
      {pts.map((p, i) => (
        <motion.g key={p.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.35, duration: 0.5 }}>
          <circle cx={p.x} cy={p.y} r="5" fill="var(--accent)" />
          <text x={p.x} y={p.y - 16} textAnchor="middle" fontSize="15" fontStyle="italic" fill="currentColor">
            {p.label}
          </text>
        </motion.g>
      ))}
    </>
  )
}

function Photo() {
  return (
    <>
      {['M110 60 h-26 v26', 'M290 60 h26 v26', 'M110 220 h-26 v-26', 'M290 220 h26 v-26'].map((d, i) => (
        <motion.path key={d} d={d} {...ink} {...draw(i * 0.1)} />
      ))}
      <motion.circle cx="200" cy="140" r="52" {...ink} {...draw(0.3)} />
      <motion.circle cx="200" cy="140" r="20" fill="var(--accent)" fillOpacity={0.25} stroke="currentColor" strokeWidth={1.6} {...draw(0.6)} />
      <motion.path d="M178 112 Q 196 102, 214 108" {...ink} strokeWidth={1.2} {...draw(0.9)} />
    </>
  )
}

function Music() {
  const n = 15
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const h = 16 + Math.sin(((i + 0.5) / n) * Math.PI) * 120
        return <motion.path key={i} d={`M${102 + i * 14} ${140 - h / 2} V ${140 + h / 2}`} {...ink} strokeWidth={i === 7 ? 3 : 1.6} stroke={i === 7 ? 'var(--accent)' : 'currentColor'} {...draw(i * 0.04)} />
      })}
    </>
  )
}

function Tech() {
  return (
    <>
      <motion.circle cx="118" cy="140" r="46" {...ink} {...draw()} />
      <motion.rect x="164" y="98" width="84" height="84" {...ink} {...draw(0.2)} />
      <motion.path d="M286 182 L 322 98 L 358 182 Z" fill="var(--accent)" fillOpacity={0.2} stroke="currentColor" strokeWidth={1.6} {...draw(0.4)} />
      <motion.path d="M60 230 H 360" {...ink} strokeOpacity={0.4} {...draw(0.6)} />
    </>
  )
}

const ART = { tea: Tea, books: Books, travel: Travel, photo: Photo, music: Music, tech: Tech } satisfies Record<InterestId, () => ReactElement>

export function InterestArt({ id, className = '' }: { id: InterestId; className?: string }) {
  const Art = ART[id]
  return (
    <svg viewBox="0 0 400 270" className={className} aria-hidden>
      <Art />
    </svg>
  )
}

export function TraitGlyph({ kind }: { kind: Glyph }) {
  const s = { ...ink, strokeWidth: 1.4 }
  const svg = (children: ReactElement) => (
    <svg width="40" height="40" viewBox="0 0 44 44" aria-hidden className="shrink-0">
      {children}
    </svg>
  )
  switch (kind) {
    case 'eye':
      return svg(
        <>
          <path d="M4 22 Q 22 6, 40 22 Q 22 38, 4 22 Z" {...s} />
          <circle cx="22" cy="22" r="5" fill="var(--accent)" />
        </>,
      )
    case 'wave':
      return svg(
        <>
          <path d="M4 20 Q 11 12, 18 20 T 32 20 T 44 20" {...s} />
          <path d="M4 28 Q 11 20, 18 28 T 32 28 T 44 28" {...s} stroke="var(--accent)" />
        </>,
      )
    case 'spiral':
      return svg(<path d="M22 22 m-2 0 a 2 2 0 1 1 4 0 a 5 5 0 1 1 -10 0 a 9 9 0 1 1 18 0 a 14 14 0 1 1 -28 0" {...s} />)
    case 'smirk':
      return svg(
        <>
          <circle cx="22" cy="22" r="17" {...s} />
          <path d="M14 26 Q 22 32, 30 24" {...s} stroke="var(--accent)" strokeWidth={1.8} />
          <circle cx="16" cy="18" r="1.3" fill="currentColor" />
          <circle cx="28" cy="18" r="1.3" fill="currentColor" />
        </>,
      )
    case 'pillar':
      return svg(
        <>
          <path d="M22 6 V38 M8 38 H36 M14 10 H30" {...s} />
          <circle cx="22" cy="22" r="3" fill="var(--accent)" />
        </>,
      )
    case 'diamond':
      return svg(
        <>
          <path d="M22 5 L39 22 L22 39 L5 22 Z" {...s} />
          <path d="M22 13 L31 22 L22 31 L13 22 Z" fill="var(--accent)" fillOpacity={0.3} />
        </>,
      )
    default: {
      const unreachable: never = kind
      throw new Error(`Неизвестный глиф: ${String(unreachable)}`)
    }
  }
}
