import type { ReactNode } from 'react'

/** Заголовок раздела: подпись о времени дня и чае + сам заголовок */
export function SectionHead({ steep, title, id }: { steep: string; title: ReactNode; id: string }) {
  return (
    <header className="max-w-3xl">
      <p className="steep">{steep}</p>
      <h2 id={id} className="mt-3 text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.02] font-[350] tracking-[-0.025em]">
        {title}
      </h2>
    </header>
  )
}

/** Цитата-переход между разделами */
export function Interlude({ children }: { children: string }) {
  return (
    <p className="mx-auto max-w-2xl px-6 py-10 text-center text-lead text-muted italic md:py-14">
      {children}
    </p>
  )
}
