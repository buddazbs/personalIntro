import { useAnimationFrame, useInView, useScroll, useSpring, useVelocity } from 'motion/react'
import { useRef } from 'react'
import { useReducedMotionPref } from '../hooks/useMedia'

/** Поверхность чая между разделами: три волны, которые волнуются от скорости прокрутки */
export function TeaSurface({ className = '' }: { className?: string }) {
  const paths = useRef<(SVGPathElement | null)[]>([])
  const svg = useRef<SVGSVGElement>(null)
  const inView = useInView(svg, { margin: '100px 0px' })
  const reduced = useReducedMotionPref()
  const { scrollY } = useScroll()
  const velocity = useSpring(useVelocity(scrollY), { stiffness: 80, damping: 20 })

  const W = 1440
  const H = 120
  const build = (t: number, amp: number, freq: number, phase: number) => {
    let d = `M0 ${H / 2}`
    for (let x = 0; x <= W; x += 24) {
      const y = H / 2 + Math.sin(x * freq + t + phase) * amp * Math.sin((x / W) * Math.PI)
      d += ` L${x} ${y.toFixed(1)}`
    }
    return d
  }

  useAnimationFrame((time) => {
    // вне экрана не пересчитываем пути (но первый кадр рисуем всегда)
    const drawn = !!paths.current[0]?.getAttribute('d')
    if (drawn && (reduced || !inView)) return
    const v = Math.min(1, Math.abs(velocity.get()) / 2500)
    const t = time / 900
    const amp = 6 + v * 34
    paths.current.forEach((p, i) => p?.setAttribute('d', build(t * (1 + i * 0.3), amp * (1 - i * 0.25), 0.006 + i * 0.002, i * 1.7)))
  })

  return (
    <svg ref={svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden className={`block h-20 w-full md:h-28 ${className}`}>
      <defs>
        <linearGradient id="ts-grad" x1="0" x2="1">
          <stop offset="0" stopColor="#A8C686" stopOpacity="0" />
          <stop offset="0.5" stopColor="#A8C686" stopOpacity="0.8" />
          <stop offset="1" stopColor="#EBCB82" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          ref={(el) => {
            paths.current[i] = el
          }}
          fill="none"
          stroke="url(#ts-grad)"
          strokeWidth={i === 0 ? 1.5 : 1}
          strokeOpacity={1 - i * 0.3}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}
