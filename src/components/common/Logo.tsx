import { Link } from 'react-router-dom'
import { IntensityMark } from '@/assets/brand/IntensityMark'
import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'

interface LogoProps {
  to?: string
  /** Render for the always-dark sidebar surface. */
  inverted?: boolean
  compact?: boolean
  size?: 'md' | 'lg'
  className?: string
}

export function Logo({
  to = '/admin/dashboard',
  inverted = false,
  compact = false,
  size = 'md',
  className,
}: LogoProps) {
  return (
    <Link
      to={to}
      className={cn('flex items-center gap-3 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50', className)}
      aria-label={BRAND.appName}
    >
      <IntensityMark className={cn('shrink-0 drop-shadow-[0_6px_18px_rgba(47,107,255,0.35)]', size === 'lg' ? 'size-11' : 'size-9')} />
      {!compact ? (
        <span className="min-w-0 leading-none">
          <span
            className={cn(
              'font-display block font-extrabold tracking-[0.08em] uppercase',
              size === 'lg' ? 'text-[1.2rem]' : 'text-[1.02rem]',
              inverted ? 'text-white' : 'text-foreground',
            )}
          >
            Intensity
          </span>
          <span
            className={cn(
              'mt-1.5 flex items-center gap-2 text-[10px] font-semibold tracking-[0.32em] uppercase',
              inverted ? 'text-sidebar-foreground/70' : 'text-muted-foreground',
            )}
          >
            Research
            <span
              className={cn(
                'rounded-sm px-1.5 py-0.5 text-[9px] tracking-[0.14em]',
                inverted ? 'bg-sidebar-primary/15 text-sidebar-primary' : 'bg-primary/12 text-primary',
              )}
            >
              Admin
            </span>
          </span>
        </span>
      ) : null}
    </Link>
  )
}
