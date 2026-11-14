import { motion, useMotionValue, useSpring, useTransform, type PanInfo } from 'motion/react'
import { useCallback, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { EASE } from '../lib/colors'
import { useFinePointer } from '../hooks/useMedia'

const photos = Object.entries(import.meta.glob<string>('../assets/avatars/*.jpg', { eager: true, import: 'default' }))
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, src]) => src)

// положение карточки в стопке по её глубине
const POSE = [
  { rotate: 0, scale: 1, y: 0, x: 0 },
  { rotate: -7, scale: 0.94, y: 10, x: -34 },
  { rotate: 8, scale: 0.9, y: 22, x: 36 },
  { rotate: -3, scale: 0.86, y: 40, x: 4 },
] as const

function Card({ src, depth, total, index, onSwipe }: { src: string; depth: number; total: number; index: number; onSwipe: (dir: 1 | -1) => void }) {
  const x = useMotionValue(0)
  const rotateDrag = useTransform(x, [-220, 220], [-14, 14])
  const isTop = depth === 0
  const pose = POSE[Math.min(depth, POSE.length - 1)] ?? POSE[0]

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 600) onSwipe(info.offset.x < 0 ? 1 : -1)
  }

  return (
    // внешний слой — поза в стопке, внутренний — перетаскивание
    <motion.div className="absolute inset-0" style={{ zIndex: total - depth }} initial={false} animate={pose} transition={{ duration: 0.8, ease: EASE }} aria-hidden={!isTop}>
      <motion.div
        className="absolute inset-0 touch-pan-y overflow-hidden rounded-[2rem] border border-line bg-ink-3 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)] select-none"
        style={{ x, rotate: rotateDrag }}
        animate={{ filter: `brightness(${1 - depth * 0.14})` }}
        transition={{ duration: 0.8, ease: EASE }}
        drag={isTop ? 'x' : false}
        dragSnapToOrigin
        dragElastic={0.85}
        onDragEnd={onDragEnd}
        whileDrag={{ scale: 1.03 }}
        data-cursor={isTop ? 'тяни' : undefined}
      >
        <img
          src={src}
          alt={isTop ? `Иван, фото ${index + 1} из ${total}` : ''}
          width={1080}
          height={1350}
          draggable={false}
          loading={index === 0 ? 'eager' : 'lazy'}
          fetchPriority={index === 0 ? 'high' : 'auto'}
          decoding="async"
          className="pointer-events-none h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
      </motion.div>
    </motion.div>
  )
}

const arrow = (d: string) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function PhotoStack() {
  const [order, setOrder] = useState(() => photos.map((_, i) => i))
  const fine = useFinePointer()
  const next = useCallback(() => setOrder(([first, ...rest]) => (first === undefined ? rest : [...rest, first])), [])
  const prev = useCallback(() => setOrder((o) => [...o.slice(-1), ...o.slice(0, -1)]), [])

  // 3D-наклон всей стопки за курсором
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 120, damping: 18 })
  const sry = useSpring(ry, { stiffness: 120, damping: 18 })
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!fine) return
    const r = e.currentTarget.getBoundingClientRect()
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 16)
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 16)
  }
  const onLeave = () => {
    rx.set(0)
    ry.set(0)
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') next()
    if (e.key === 'ArrowLeft') prev()
  }

  const current = order[0]
  if (current === undefined) return null

  return (
    <div className="relative w-full rounded-[2rem]" role="region" aria-roledescription="карусель" aria-label="Фотографии" tabIndex={0} onKeyDown={onKey}>
      <div className="[perspective:1200px]" onPointerMove={onMove} onPointerLeave={onLeave}>
        <motion.div className="relative aspect-[4/5] w-full [transform-style:preserve-3d]" style={{ rotateX: srx, rotateY: sry }}>
          {order.map((photo, depth) => (
            <Card key={photo} src={photos[photo] ?? ''} index={photo} depth={depth} total={photos.length} onSwipe={(d) => (d === 1 ? next() : prev())} />
          ))}
        </motion.div>
      </div>

      {photos.length > 1 && (
        <div className="relative z-10 mt-10 flex items-center justify-between">
          <button type="button" onClick={prev} aria-label="Предыдущее фото" className="glass grid h-11 w-11 place-items-center rounded-full text-cream transition-colors hover:bg-cream/10">
            {arrow('M10 4 L6 8 L10 12')}
          </button>
          <div className="flex items-center gap-2" role="tablist" aria-label="Выбор фото">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === current}
                aria-label={`Фото ${i + 1}`}
                onClick={() => setOrder((o) => [...o.slice(o.indexOf(i)), ...o.slice(0, o.indexOf(i))])}
                className="grid h-6 place-items-center"
              >
                <motion.span
                  className="block h-1.5 rounded-full"
                  animate={{ width: i === current ? 28 : 6, backgroundColor: i === current ? '#A8C686' : 'rgba(243,235,221,0.25)' }}
                  transition={{ duration: 0.5, ease: EASE }}
                />
              </button>
            ))}
          </div>
          <button type="button" onClick={next} aria-label="Следующее фото" className="glass grid h-11 w-11 place-items-center rounded-full text-cream transition-colors hover:bg-cream/10">
            {arrow('M6 4 L10 8 L6 12')}
          </button>
        </div>
      )}
    </div>
  )
}
