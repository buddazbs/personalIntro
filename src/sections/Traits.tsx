import { traits } from '../content'
import { TraitGlyph } from '../components/Art'
import { SectionHead } from '../components/Section'

export function Traits() {
  return (
    <section id="traits" aria-labelledby="traits-title" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-8 md:py-24">
      <SectionHead id="traits-title" steep="Ближе к вечеру. Габа, третья заварка" title="Как со мной рядом" />

      <p className="mt-14 max-w-[40rem] text-[clamp(1.5rem,2.8vw,2.125rem)] leading-[1.3] font-[330] italic md:mt-20">
        Не пытаюсь произвести впечатление. Пытаюсь быть тем, рядом с кем дышится спокойно — и при этом не скучно.
      </p>
      <p className="mt-6 text-muted">Шесть граней — ни одна не острая, но каждая чувствуется.</p>

      <dl className="mt-16 grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {traits.map((t) => (
          <div key={t.title} className="flex gap-5">
            <TraitGlyph kind={t.glyph} />
            <div className="min-w-0">
              <dt className="text-[1.5rem] leading-[1.15] font-[450] tracking-[-0.01em]">{t.title}</dt>
              <dd className="mt-3 text-[1.0625rem] leading-[1.6] text-muted">{t.body}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}
