import { MotionConfig } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { quotes } from './content'
import { LenisProvider, useLenis } from './lib/lenis'
import { useDayPalette } from './lib/day'
import { Preloader } from './components/Preloader'
import { Nav, PrivacyNote } from './components/Chrome'
import { Interlude } from './components/Section'
import { Hero } from './sections/Hero'
import { About, Philosophy } from './sections/About'
import { Interests } from './sections/Interests'
import { Traits } from './sections/Traits'
import { Contact, Footer } from './sections/Contact'

function Page() {
  const [ready, setReady] = useState(false)
  const lenis = useLenis()
  const tea = useDayPalette()

  // пока заваривается — страница не листается
  useEffect(() => {
    if (ready) lenis?.start()
    else lenis?.stop()
  }, [ready, lenis])

  const onDone = useCallback(() => setReady(true), [])
  const [q0, q1, q2, q3] = quotes

  return (
    <div id="top" className="relative overflow-x-clip">
      <a href="#main" className="skip-link">
        Перейти к содержимому
      </a>
      <Preloader onDone={onDone} />
      <Nav ready={ready} tea={tea} />

      <main id="main">
        <Hero ready={ready} />
        {q0 && <Interlude>{q0}</Interlude>}
        <About />
        {q1 && <Interlude>{q1}</Interlude>}
        <Philosophy />
        <Interests />
        {q2 && <Interlude>{q2}</Interlude>}
        <Traits />
        {q3 && <Interlude>{q3}</Interlude>}
        <Contact />
      </main>

      <Footer />
      <PrivacyNote ready={ready} />
      <div className="paper" aria-hidden />
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
