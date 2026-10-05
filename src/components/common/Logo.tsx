import { Link } from 'react-router-dom'
import logoFull from '@/assets/brand/intensity-research-logo-full.png'
import logoMark from '@/assets/brand/intensity-research-mark.png'
import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'

interface LogoProps {
  to?: string
  /** Show only the globe mark (collapsed sidebar, mobile header). */
  compact?: boolean
  size?: 'md' | 'lg'
  /** Show the "Admin" tag beside the full logo. */
  showBadge?: boolean
  className?: string
}

export function Logo({ to = '/admin/dashboard', compact = false, size = 'md', showBadge = true, className }: LogoProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex shrink-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className,
      )}
      aria-label={BRAND.appName}
    >
      {/* The brand's on-dark treatment is a solid white logo. */}
      <img
        src={compact ? logoMark : logoFull}
        alt=""
        draggable={false}
        className={cn(
          'shrink-0 select-none dark:brightness-0 dark:invert',
          compact ? (size === 'lg' ? 'size-11' : 'size-9') : size === 'lg' ? 'h-14 w-auto' : 'h-10 w-auto',
        )}
      />
      {!compact && showBadge ? (
        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] leading-none font-semibold tracking-[0.14em] text-primary uppercase ring-1 ring-primary/15 ring-inset">
          Admin
        </span>
      ) : null}
    </Link>
  )
}
