import { useEffect, useRef } from 'react'
import { useReducedMotionPref } from '../hooks/useMedia'

/**
 * Чаинки медленно падают, кружатся и разлетаются от курсора.
 * Canvas 2D, засыпает в скрытой вкладке; при reduced motion не рисуется.
 */

type Leaf = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; size: number; hue: number; phase: number; depth: number }

const COLORS = ['168,198,134', '95,138,78', '235,203,130', '120,160,96']

function spawn(w: number, h: number, anywhere: boolean): Leaf {
  const depth = 0.35 + Math.random() * 0.65
  return {
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : -20,
    vx: 0,
    vy: 0,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.02,
    size: (5 + Math.random() * 9) * depth,
    hue: Math.floor(Math.random() * COLORS.length),
    phase: Math.random() * Math.PI * 2,
    depth,
  }
}

function drawLeaf(ctx: CanvasRenderingContext2D, l: Leaf) {
  ctx.save()
  ctx.translate(l.x, l.y)
  ctx.rotate(l.rot)
  // «переворот» листа в полёте: сжимаем по одной оси
  ctx.scale(1, Math.abs(Math.sin(l.phase)) * 0.7 + 0.3)
  ctx.beginPath()
  ctx.moveTo(-l.size, 0)
  ctx.quadraticCurveTo(0, -l.size * 0.62, l.size, 0)
  ctx.quadraticCurveTo(0, l.size * 0.62, -l.size, 0)
  ctx.fillStyle = `rgba(${COLORS[l.hue]},${0.18 + l.depth * 0.45})`
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(-l.size * 0.9, 0)
  ctx.lineTo(l.size * 0.9, 0)
  ctx.strokeStyle = `rgba(14,20,16,${0.25 * l.depth})`
  ctx.lineWidth = 0.6
  ctx.stroke()
  ctx.restore()
}

export function LeafField({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotionPref()

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || reduced) return

    let w = 0
    let h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const count = w < 768 ? 18 : 42
    const leaves = Array.from({ length: count }, () => spawn(w, h, true))
    // vx, vy — сглаженная скорость курсора (px за кадр): листья подхватывает «след» от руки
    const mouse = { x: -9999, y: -9999, px: -9999, py: -9999, vx: 0, vy: 0 }
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      mouse.x = e.clientX - r.left
      mouse.y = e.clientY - r.top
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    const R = 170
    let raf = 0
    let last = performance.now()
    let lastScroll = window.scrollY
    let scrollV = 0
    const tick = (now: number) => {
      const dt = Math.min(2, (now - last) / 16.67)
      last = now

      if (mouse.px > -9000) {
        const k = 1 - Math.exp(-0.35 * dt)
        mouse.vx += ((mouse.x - mouse.px) / dt - mouse.vx) * k
        mouse.vy += ((mouse.y - mouse.py) / dt - mouse.vy) * k
      }
      mouse.px = mouse.x
      mouse.py = mouse.y
      // прокрутка: холст закреплён, поэтому листья смещаем сами — дальние меньше, ближние больше (параллакс)
      const sy = window.scrollY
      const ds = sy - lastScroll
      lastScroll = sy
      scrollV += (ds / dt - scrollV) * 0.2

      ctx.clearRect(0, 0, w, h)
      for (let i = 0; i < leaves.length; i++) {
        const l = leaves[i]!
        l.phase += (0.02 + Math.min(0.08, Math.abs(scrollV) * 0.002)) * dt
        // падение + покачивание
        const sway = Math.sin(now / 1400 + l.phase * 2) * 0.35
        l.vy += (0.35 * l.depth - l.vy) * 0.02 * dt
        l.vx += (sway * l.depth - l.vx) * 0.03 * dt
        // курсор: лёгкое отталкивание + увлечение потоком воздуха за рукой
        const dx = l.x - mouse.x
        const dy = l.y - mouse.y
        const d2 = dx * dx + dy * dy
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 1
          const fall = (1 - d / R) ** 2
          l.vx += ((dx / d) * 0.5 + mouse.vx * 0.09 * l.depth) * fall * dt
          l.vy += ((dy / d) * 0.5 + mouse.vy * 0.09 * l.depth) * fall * dt
          // закрутка зависит от того, с какой стороны прошёл поток — без случайных рывков
          l.vr += ((dx * mouse.vy - dy * mouse.vx) / d) * 0.0012 * fall * dt
        }
        l.vr = Math.max(-0.15, Math.min(0.15, l.vr * 0.985))
        l.x += l.vx * dt
        l.y += l.vy * dt - ds * l.depth * 0.45
        l.rot += (l.vr + l.vx * 0.01) * dt
        if (l.y < -60) l.y += h + 100
        else if (l.y > h + 40 || l.x < -40 || l.x > w + 40) leaves[i] = spawn(w, h, false)
        drawLeaf(ctx, l)
      }
      raf = document.hidden ? 0 : requestAnimationFrame(tick)
    }
    const onVis = () => {
      if (!document.hidden && !raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [reduced])

  return <canvas ref={ref} aria-hidden className={`pointer-events-none block h-full w-full ${className}`} />
}
