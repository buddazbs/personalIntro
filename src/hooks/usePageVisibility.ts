import { useEffect } from 'react'

/** data-paused на <html>, пока вкладка скрыта: CSS-анимации и canvas засыпают */
export function usePageVisibility() {
  useEffect(() => {
    const update = () => document.documentElement.toggleAttribute('data-paused', document.hidden)
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
}
