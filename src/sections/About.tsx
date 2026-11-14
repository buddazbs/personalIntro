import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { now, stats } from '../content'
import { SectionHead } from '../components/Section'
import { TeaBowl } from '../components/TeaBowl'

const plural = (n: number, one: string, few: string, many: string) => {
  const rule = new Intl.PluralRules('ru-RU').select(n)
  return rule === 'one' ? one : rule === 'few' ? few : many
}

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-8 md:py-24">
      <SectionHead id="about-title" steep="Утро. Сэнтя, первая заварка" title="Между ритуалом и кодом" />

      <div className="mt-14 grid grid-cols-1 items-center gap-12 md:mt-20 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-7">
          <h3 className="text-h3 font-[380] tracking-[-0.02em] md:text-[2.75rem] md:leading-[1.08]">
            У меня аллергия на кофе. Поэтому — чай.
          </h3>
          <p className="mt-6 max-w-[34rem]">
            Сэнтя по утрам, габа после обеда, дянь хун вечером. Завариваю в исинском чайнике, считаю секунды по дыханию. Чайная церемония — способ
            замедлиться на 12&nbsp;минут до того, как мир начнётся.
          </p>
          <p className="mt-4 max-w-[34rem] text-muted">
            Этот сайт устроен так же: листаешь — и день идёт своим чередом, от утреннего сэнтя к вечернему дянь хуну.
          </p>
        </div>
        <TeaBowl className="mx-auto w-full max-w-[18rem] md:col-span-5 md:max-w-[20rem]" />
      </div>

      <blockquote className="mt-24 md:mt-32 md:ml-[calc(100%/12*2)] md:max-w-[44rem]">
        <p className="text-[clamp(1.75rem,3.6vw,2.75rem)] leading-[1.22] font-[330] tracking-[-0.015em] italic">
          <span className="-ml-[0.45em] text-accent">«</span>Я не коллекционирую вещи — я коллекционирую впечатления, которые задерживаются.»
        </p>
      </blockquote>

      <div className="mt-24 grid grid-cols-1 gap-10 md:mt-32 md:grid-cols-12 md:gap-8">
        <h3 className="text-lead italic md:col-span-3">Сейчас</h3>
        <dl className="md:col-span-6">
          {now.map((item) => (
            <div key={item.label} className="grid grid-cols-[6.5rem_1fr] gap-4 border-t border-rule py-4 last:border-b">
              <dt className="text-muted italic">{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-small text-muted md:col-span-3">
          За последний год — <span className="text-fg tabular-nums">{stats.booksLastYear}</span>{' '}
          {plural(stats.booksLastYear, 'книга', 'книги', 'книг')}. В коллекции — <span className="text-fg tabular-nums">{stats.teaSorts}</span>{' '}
          {plural(stats.teaSorts, 'сорт', 'сорта', 'сортов')} чая.
        </p>
      </div>
    </section>
  )
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.18, 1])
  return (
    <motion.span style={{ opacity }} className="inline">
      {children}{' '}
    </motion.span>
  )
}

/**
 * Философия проявляется по словам, пока её читают, — медленно, как и обещано.
 * Здесь же утро переходит в день: сэнтя сменяется габой.
 */
export function Philosophy() {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.5'] })

  const lead = 'Хорошие вещи случаются медленно.'.split(' ')
  const tail = 'Очень хорошие — ещё медленнее.'.split(' ')
  const words = [...lead, ...tail]
  const step = 1 / words.length

  return (
    <section id="philosophy" aria-label="Философия" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-28">
      <p ref={ref} className="max-w-[16ch] text-[clamp(2.75rem,8vw,6.5rem)] leading-[1] font-[300] tracking-[-0.035em]">
        <span className="sr-only">{words.join(' ')}</span>
        <span aria-hidden>
          {words.map((w, i) => (
            <span key={i}>
              {i === lead.length && <br />}
              <Word progress={scrollYProgress} range={[i * step, (i + 1) * step]}>
                {w}
              </Word>
            </span>
          ))}
        </span>
      </p>
      <p className="mt-12 max-w-[34rem] md:mt-16 md:ml-[calc(100%/12*5)]">
        Я выбираю длинные форматы: книги, разговоры, маршруты. Спешу только тогда, когда это меняет чью-то жизнь к лучшему. В остальном — пусть остынет.
      </p>
    </section>
  )
}
