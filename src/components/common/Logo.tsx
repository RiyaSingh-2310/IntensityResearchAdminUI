import { Link } from 'react-router-dom'
import logoMark from '@/assets/brand/intensity-research-mark.png'
import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'

interface LogoProps {
  to?: string
  inverted?: boolean
  compact?: boolean
  className?: string
}

export function Logo({
  to = '/admin/dashboard',
  inverted = false,
  compact = false,
  className,
}: LogoProps) {
  return (
    <Link to={to} className={cn('flex items-center gap-2.5', className)} aria-label={BRAND.appName}>
      <span
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-2xl bg-white p-1 shadow-sm',
          !inverted && 'ring-1 ring-border',
        )}
      >
        <img src={logoMark} alt="" draggable={false} className="size-full select-none object-contain" />
      </span>
      {!compact ? (
        <span className="min-w-0 leading-none">
          <span
            className={cn(
              'font-display block truncate text-[1.18rem] font-semibold tracking-tight',
              inverted ? 'text-sidebar-foreground' : 'text-foreground',
            )}
          >
            Intensity Research
          </span>
          <span
            className={cn(
              'mt-1 block text-[11px] tracking-[0.18em] uppercase',
              inverted ? 'text-sidebar-foreground/70' : 'text-muted-foreground',
            )}
          >
            Admin
          </span>
        </span>
      ) : null}
    </Link>
  )
}
