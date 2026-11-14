import type { Accent } from '../content'

export const C = {
  ink: '#0E1410',
  ink2: '#141C17',
  ink3: '#1B251F',
  cream: '#F3EBDD',
  matcha: '#A8C686',
  matchaDeep: '#5F8A4E',
  matchaDark: '#24391E',
  clay: '#E39B78',
  butter: '#EBCB82',
  plum: '#B693B0',
  sky: '#8FB9BB',
} as const

export const accentColor = {
  matcha: C.matcha,
  clay: C.clay,
  plum: C.plum,
  butter: C.butter,
  sky: C.sky,
  cream: C.cream,
} as const satisfies Record<Accent, string>

/** Плавная кривая «expo out» — основа всех анимаций сайта */
export const EASE = [0.16, 1, 0.3, 1] as const
