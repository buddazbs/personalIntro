import { useSyncExternalStore } from 'react'

/**
 * Крошечный роутер на один адрес: /personalIntro/date — анкета «записаться на свидание».
 * На GitHub Pages прямой заход работает через dist/404.html (копия index.html).
 */

const BASE = import.meta.env.BASE_URL // '/personalIntro/'
export const DATE_PATH = `${BASE}date`
const EVENT = 'routechange'

/** Точка, из которой раскрывается анкета (центр нажатой карточки) */
export let dateOrigin = { x: 0.5, y: 0.5 }

const isDate = () => window.location.pathname.replace(/\/+$/, '') === DATE_PATH

const subscribe = (cb: () => void) => {
  window.addEventListener('popstate', cb)
  window.addEventListener(EVENT, cb)
  return () => {
    window.removeEventListener('popstate', cb)
    window.removeEventListener(EVENT, cb)
  }
}

export const useDateRoute = () => useSyncExternalStore(subscribe, isDate, () => false)

export function openDate(from?: { x: number; y: number }) {
  if (from) dateOrigin = { x: from.x / window.innerWidth, y: from.y / window.innerHeight }
  if (isDate()) return
  window.history.pushState({ date: true }, '', DATE_PATH)
  window.dispatchEvent(new Event(EVENT))
}

export function closeDate() {
  if (!isDate()) return
  // пришли с главной — просто шаг назад (страница останется на том же месте), иначе заменяем адрес
  if ((window.history.state as { date?: boolean } | null)?.date) window.history.back()
  else {
    window.history.replaceState(null, '', BASE)
    window.dispatchEvent(new Event(EVENT))
  }
}
