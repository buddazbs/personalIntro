import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { interests, type InterestId } from '../content'
import { EASE } from '../lib/motion'
import { InterestArt } from '../components/Art'
import { SectionHead } from '../components/Section'

/** Список интересов как чайная карта: строка раскрывается, справа — иллюстрация открытой строки */
export function Interests() {
  const [open, setOpen] = useState<InterestId | null>('tea')
  const shown = open ?? 'tea'

  return (
    <section id="interests" aria-labelledby="interests-title" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-8 md:py-24">
      <SectionHead id="interests-title" steep="После обеда. Габа" title="Чем заполнено время" />

      <div className="mt-14 grid grid-cols-1 gap-10 md:mt-20 md:grid-cols-12 md:gap-8">
        <ul className="border-b border-rule md:col-span-7">
          {interests.map((item) => {
            const isOpen = open === item.id
            const panelId = `interest-${item.id}`
            return (
              <li key={item.id} className="border-t border-rule">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : item.id)}
                    className="group flex w-full items-baseline justify-between gap-6 py-6 text-left"
                  >
                    <span className="min-w-0">
                      <span
                        className="block text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.1] tracking-[-0.02em] transition-[font-variation-settings] duration-500 group-hover:[font-variation-settings:'wght'_560]"
                        style={{ fontVariationSettings: `'wght' ${isOpen ? 560 : 340}` }}
                      >
                        {item.title}
                      </span>
                      {!isOpen && <span className="mt-2 block text-muted">{item.teaser}</span>}
                    </span>
                    <span aria-hidden className="relative h-4 w-4 shrink-0 self-center">
                      <span className="absolute top-1/2 left-0 h-px w-4 bg-current" />
                      <span className={`absolute top-0 left-1/2 h-4 w-px bg-current transition-transform duration-500 ${isOpen ? 'scale-y-0' : ''}`} />
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-label={item.title}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.6, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <div className="pb-8">
                        <InterestArt id={item.id} className="mb-6 w-full max-w-[22rem] md:hidden" />
                        <p className="max-w-[36rem]">{item.back}</p>
                        <p className="mt-4 text-small text-muted italic">{item.tags.join(', ')}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>

        <div className="hidden md:col-span-5 md:block">
          <div className="sticky top-32">
            {/* key пересоздаёт рисунок — линии прорисовываются заново для выбранного интереса */}
            <InterestArt key={shown} id={shown} className="w-full" />
          </div>
        </div>
      </div>
    </section>
  )
}
