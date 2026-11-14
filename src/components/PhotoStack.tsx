import { motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import { useCallback, useState, type KeyboardEvent } from 'react'
import { EASE } from '../lib/motion'

const photos = Object.entries(import.meta.glob<string>('../assets/avatars/*.jpg', { eager: true, import: 'default' }))
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, src]) => src)

// как лежат отпечатки в стопке: верхний ровно, нижние чуть сдвинуты
const POSE = [
  { rotate: -1.5, x: 0, y: 0 },
  { rotate: 4, x: 22, y: 8 },
  { rotate: -6, x: -18, y: 14 },
  { rotate: 2, x: 8, y: 22 },
] as const

function Print({ src, index, depth, total, onSwipe }: { src: string; index: number; depth: number; total: number; onSwipe: (dir: 1 | -1) => void }) {
  const x = useMotionValue(0)
  const tilt = useTransform(x, [-200, 200], [-10, 10])
  const isTop = depth === 0
  const pose = POSE[Math.min(depth, POSE.length - 1)] ?? POSE[0]

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 500) onSwipe(info.offset.x < 0 ? 1 : -1)
  }

  return (
    <motion.div
      className="absolute inset-0"
      style={{ zIndex: total - depth }}
      initial={false}
      animate={pose}
      transition={{ duration: 0.7, ease: EASE }}
      aria-hidden={!isTop}
    >
      <motion.div
        className={`h-full touch-pan-y bg-paper p-2.5 pb-12 shadow-[0_1px_2px_rgb(41_35_26/0.18),0_24px_40px_-24px_rgb(41_35_26/0.55)] select-none sm:p-3 sm:pb-14 ${isTop ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{ x, rotate: tilt }}
        drag={isTop ? 'x' : false}
        dragSnapToOrigin
        dragElastic={0.8}
        onDragEnd={onDragEnd}
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
      </motion.div>
    </motion.div>
  )
}

export function PhotoStack() {
  const [order, setOrder] = useState(() => photos.map((_, i) => i))
  const next = useCallback(() => setOrder(([first, ...rest]) => (first === undefined ? rest : [...rest, first])), [])
  const prev = useCallback(() => setOrder((o) => [...o.slice(-1), ...o.slice(0, -1)]), [])

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') next()
    if (e.key === 'ArrowLeft') prev()
  }

  const current = order[0]
  if (current === undefined) return null

  return (
    <figure role="group" aria-roledescription="карусель" aria-label="Фотографии" tabIndex={0} onKeyDown={onKey} className="rounded-sm">
      <div className="relative aspect-[4/5] w-full">
        {order.map((photo, depth) => (
          <Print key={photo} src={photos[photo] ?? ''} index={photo} depth={depth} total={photos.length} onSwipe={(d) => (d === 1 ? next() : prev())} />
        ))}
      </div>

      {photos.length > 1 && (
        <figcaption className="mt-8 flex items-baseline justify-between text-small">
          <button type="button" onClick={prev} className="link py-2">
            Предыдущее
          </button>
          <span className="text-muted tabular-nums italic" aria-live="polite">
            {current + 1} из {photos.length}
          </span>
          <button type="button" onClick={next} className="link py-2">
            Следующее
          </button>
        </figcaption>
      )}
    </figure>
  )
}
