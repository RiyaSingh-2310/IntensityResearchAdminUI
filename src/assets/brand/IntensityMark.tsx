import { useId } from 'react'
import { cn } from '@/lib/utils'

/** Intensity Research mark: rising signal bars on a blue → cyan → violet tile. */
export function IntensityMark({ className, title }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, '')
  const tile = `ir-tile-${id}`
  const sheen = `ir-sheen-${id}`
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn('size-9', className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={tile} x1="4" y1="2" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2f6bff" />
          <stop offset="0.55" stopColor="#1fb6e0" />
          <stop offset="1" stopColor="#7c5cff" />
        </linearGradient>
        <linearGradient id={sheen} x1="20" y1="0" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${tile})`} />
      <rect width="40" height="22" rx="11" fill={`url(#${sheen})`} />
      <rect x="8.5" y="22" width="4.2" height="9" rx="2.1" fill="#ffffff" fillOpacity="0.55" />
      <rect x="15.1" y="17.5" width="4.2" height="13.5" rx="2.1" fill="#ffffff" fillOpacity="0.72" />
      <rect x="21.7" y="13" width="4.2" height="18" rx="2.1" fill="#ffffff" fillOpacity="0.88" />
      <rect x="28.3" y="8.5" width="4.2" height="22.5" rx="2.1" fill="#ffffff" />
    </svg>
  )
}
