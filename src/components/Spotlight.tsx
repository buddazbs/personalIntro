import type { HTMLAttributes, PointerEvent } from 'react'

/** Ставит --mx/--my для .spotlight */
export function trackSpotlight(e: PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
}

/** Карточка с подсветкой и светящимся бордером, следующими за курсором */
export function Spotlight({ className = '', onPointerMove, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      onPointerMove={(e) => {
        trackSpotlight(e)
        onPointerMove?.(e)
      }}
      className={`spotlight glass relative overflow-hidden rounded-[1.75rem] ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
