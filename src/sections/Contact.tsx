import { privacyChips, socials } from '../content'
import { SectionHead } from '../components/Section'
import { Seal } from '../components/Seal'
import { useScrollTo } from '../lib/lenis'

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-20 pb-16 sm:px-8 md:pt-28">
      <SectionHead id="contact-title" steep="Вечер. Дянь хун" title="Напиши, если откликнулось" />
      <p className="mt-8 max-w-[34rem]">
        Без сценария и без давления. Расскажи о себе хоть одно настоящее предложение — я отвечу тем же. Никаких «привет, как дела» в три часа ночи.
      </p>

      <ul className="mt-16 border-b border-rule">
        {socials.map((s) => (
          <li key={s.id} className="border-t border-rule">
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-1 py-7 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
            >
              <span className="text-muted italic" translate="no">
                {s.label}
                <span className="sr-only">, откроется в новой вкладке</span>
              </span>
              <span
                translate="no"
                className="text-[clamp(2.25rem,7vw,4.5rem)] leading-none tracking-[-0.03em] text-accent transition-[font-variation-settings] duration-500 [font-variation-settings:'wght'_320] group-hover:[font-variation-settings:'wght'_620] group-focus-visible:[font-variation-settings:'wght'_620]"
              >
                {s.handle}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Footer() {
  const scrollTo = useScrollTo()
  return (
    <footer className="mx-auto max-w-6xl px-5 pt-16 pb-[max(3rem,env(safe-area-inset-bottom))] sm:px-8">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
        <div className="flex items-center gap-4 md:col-span-4 md:items-start">
          <Seal size={56} />
          <div>
            <p className="text-lead italic">До связи</p>
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault()
                scrollTo('top')
              }}
              className="link mt-1 inline-block text-small text-muted"
            >
              Обратно к утру
            </a>
          </div>
        </div>

        <div className="md:col-span-8">
          <h2 className="text-lead">Этот сайт не использует cookie и не собирает персональные данные</h2>
          <p className="mt-4 max-w-[40rem] text-small text-muted">
            В соответствии с Федеральным законом №&nbsp;152-ФЗ «О персональных данных» уведомляем: на сайте не устанавливаются куки-файлы, не используются системы
            аналитики, рекламные пиксели и счётчики посещений. Не ведётся сбор, обработка, хранение или передача персональных данных пользователей третьим лицам.
            Все ресурсы (шрифты, изображения, скрипты) загружаются с этого же домена — сторонние сервисы не подключаются.
          </p>
          <p className="mt-3 max-w-[40rem] text-small text-muted">
            Если вы напишете по контактам выше — переписка ведётся в выбранной вами платформе на её условиях; этот сайт в ней не участвует.
          </p>
          <p className="mt-4 text-small text-muted italic">{privacyChips.join(', ')}.</p>
        </div>
      </div>

      <p className="mt-16 border-t border-rule pt-6 text-small text-muted">Иван, 2026. Собрано вручную, заварено на сэнтя.</p>
    </footer>
  )
}
