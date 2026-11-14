/** Печать-ханко: киноварный квадрат с «И». Такими печатями подписывают свитки и чайную посуду. */
export function Seal({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className={className}>
      <rect x="2" y="2" width="44" height="44" rx="5" fill="var(--seal)" />
      <rect x="6" y="6" width="36" height="36" rx="2.5" fill="none" stroke="var(--paper)" strokeWidth="1.4" opacity="0.9" />
      <path d="M16 14 V34 M16 34 L32 14 M32 14 V34" stroke="var(--paper)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}
