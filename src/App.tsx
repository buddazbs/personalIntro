import { MotionConfig } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { LenisProvider, useLenis } from './lib/lenis'
import { usePageVisibility } from './hooks/usePageVisibility'
import { Preloader } from './components/Preloader'
import { Cursor } from './components/Cursor'
import { LeafField } from './components/LeafField'
import { TeaSurface } from './components/TeaSurface'
import { Nav, PrivacyPill, ScrollProgress } from './components/Chrome'
import { Hero } from './sections/Hero'
import { About, Manifesto } from './sections/About'
import { Interests } from './sections/Interests'
import { Traits } from './sections/Traits'
import { Contact, Footer } from './sections/Contact'

function Page() {
  const [ready, setReady] = useState(false)
  const lenis = useLenis()
  usePageVisibility()

  // пока заваривается — страница не листается
  useEffect(() => {
    if (ready) lenis?.start()
    else lenis?.stop()
  }, [ready, lenis])

  const onDone = useCallback(() => setReady(true), [])

  return (
    <div id="top" className="relative overflow-x-clip">
      <a href="#main" className="skip-link">
        Перейти к содержимому
      </a>
      <Preloader onDone={onDone} />
      <Cursor />
      <ScrollProgress />
      <Nav ready={ready} />

      <main id="main">
        <Hero ready={ready} />

        {/* контент наезжает на закреплённый первый экран, как новая карточка */}
        <div className="relative z-10 -mt-12 rounded-t-[2.5rem] md:-mt-[70svh] bg-ink shadow-[0_-30px_80px_-20px_rgba(0,0,0,0.7)] md:rounded-t-[3.5rem]">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-[inherit] bg-gradient-to-r from-transparent via-matcha/50 to-transparent" />
          {/* чаинки летят на фоне всего контента */}
          <div aria-hidden className="pointer-events-none sticky top-0 -mb-[100svh] h-svh">
            <LeafField />
          </div>

          <div className="relative">
            <About />
            <TeaSurface />
            <Manifesto />
            <Interests />
            <TeaSurface />
            <Traits />
            <Contact />
            <Footer />
          </div>
        </div>
      </main>

      <PrivacyPill ready={ready} />
      <div className="grain" aria-hidden />
    </div>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LenisProvider>
        <Page />
      </LenisProvider>
    </MotionConfig>
  )
}
