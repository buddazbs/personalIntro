import { useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { useEffect, useState } from 'react'

/** Три чая — три времени дня. Цвет страницы = цвет настоя. */
export const TEAS = {
  sencha: { time: 'утро', tea: 'сэнтя', bg: '#E4E5C0', fg: '#29231A', accent: '#3E5B2B' },
  gaba: { time: 'день', tea: 'габа', bg: '#DFA65A', fg: '#29231A', accent: '#5A3410' },
  dianhong: { time: 'вечер', tea: 'дянь хун', bg: '#2E120C', fg: '#F0DDBF', accent: '#E6B06A' },
} as const satisfies Record<string, { time: string; tea: string; bg: string; fg: string; accent: string }>

export type TeaId = keyof typeof TEAS

type Stops = { at: number[]; bg: string[]; fg: string[]; accent: string[]; toGaba: number; toDian: number }

const INITIAL: Stops = {
  at: [0, 1],
  bg: [TEAS.sencha.bg, TEAS.sencha.bg],
  fg: [TEAS.sencha.fg, TEAS.sencha.fg],
  accent: [TEAS.sencha.accent, TEAS.sencha.accent],
  toGaba: Infinity,
  toDian: Infinity,
}

/**
 * Переходы между чаями привязаны к реальным позициям разделов:
 * сэнтя → габа — пока читается «философия», габа → дянь хун — между «характером» и «связью».
 * Цвет текста переключается скачком там, где фон проходит середину, — плавный переход дал бы нулевой контраст.
 */
function measure(): Stops {
  const top = (id: string) => {
    const el = document.getElementById(id)
    return el ? el.getBoundingClientRect().top + window.scrollY : 0
  }
  const vh = window.innerHeight
  const s = TEAS.sencha
  const g = TEAS.gaba
  const d = TEAS.dianhong

  const toGabaStart = top('philosophy') - vh * 0.2
  const toGabaEnd = top('interests') - vh * 0.35
  const toDianStart = top('contact') - vh * 1.05
  const toDianEnd = top('contact') - vh * 0.35
  const flip = (toDianStart + toDianEnd) / 2

  return {
    at: [0, toGabaStart, toGabaEnd, toDianStart, flip, flip + 1, toDianEnd],
    bg: [s.bg, s.bg, g.bg, g.bg, '#86532B', '#86532B', d.bg],
    fg: [s.fg, s.fg, g.fg, g.fg, g.fg, d.fg, d.fg],
    accent: [s.accent, s.accent, g.accent, g.accent, g.accent, d.accent, d.accent],
    toGaba: (toGabaStart + toGabaEnd) / 2,
    toDian: flip,
  }
}

export function useDayPalette(): TeaId {
  const [stops, setStops] = useState<Stops>(INITIAL)
  const { scrollY } = useScroll()

  useEffect(() => {
    const update = () => setStops(measure())
    update()
    // высота разделов меняется после загрузки шрифтов и картинок
    const ro = new ResizeObserver(update)
    ro.observe(document.body)
    return () => ro.disconnect()
  }, [])

  const bg = useTransform(scrollY, stops.at, stops.bg)
  const fg = useTransform(scrollY, stops.at, stops.fg)
  const accent = useTransform(scrollY, stops.at, stops.accent)

  const root = document.documentElement.style
  useMotionValueEvent(bg, 'change', (v) => root.setProperty('--bg', v))
  useMotionValueEvent(fg, 'change', (v) => root.setProperty('--fg', v))
  useMotionValueEvent(accent, 'change', (v) => root.setProperty('--accent', v))

  // применяем сразу после перемера, не дожидаясь прокрутки
  useEffect(() => {
    root.setProperty('--bg', bg.get())
    root.setProperty('--fg', fg.get())
    root.setProperty('--accent', accent.get())
  }, [stops, bg, fg, accent, root])

  // какой чай «заварен» — меняется в середине тех же переходов, что и цвет
  const teaAt = (y: number): TeaId => (y >= stops.toDian ? 'dianhong' : y >= stops.toGaba ? 'gaba' : 'sencha')
  const [tea, setTea] = useState<TeaId>('sencha')
  useMotionValueEvent(scrollY, 'change', (y) => setTea(teaAt(y)))
  useEffect(() => setTea(teaAt(scrollY.get())), [stops])

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', TEAS[tea].bg)
  }, [tea])

  return tea
}
