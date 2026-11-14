import Lenis from 'lenis'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useReducedMotionPref } from '../hooks/useMedia'

const LenisContext = createContext<Lenis | null>(null)

export function LenisProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotionPref()
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    if (reduced) return
    const instance = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: false })
    setLenis(instance)
    let raf = 0
    const loop = (t: number) => {
      instance.raf(t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      instance.destroy()
      setLenis(null)
    }
  }, [reduced])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}

export const useLenis = () => useContext(LenisContext)

/** Плавный переход к якорю с учётом шапки */
export function useScrollTo() {
  const lenis = useLenis()
  return (target: string) => {
    const el = target === 'top' ? document.body : document.getElementById(target)
    if (!el) return
    if (lenis) lenis.scrollTo(target === 'top' ? 0 : el, { offset: -24, duration: 1.6 })
    else if (target === 'top') window.scrollTo({ top: 0 })
    else el.scrollIntoView()
  }
}
