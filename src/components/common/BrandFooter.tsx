import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'

export function BrandFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground',
        className,
      )}
    >
      <span>© {new Date().getFullYear()} {BRAND.company}</span>
      <span aria-hidden className="text-border">•</span>
      <a className="rounded-sm hover:text-foreground hover:underline underline-offset-4" href={`mailto:${BRAND.email}`}>
        {BRAND.email}
      </a>
      <span aria-hidden className="text-border">•</span>
      <a
        className="rounded-sm hover:text-foreground hover:underline underline-offset-4"
        href={BRAND.website}
        target="_blank"
        rel="noopener noreferrer"
      >
        intensityresearch.com
      </a>
    </footer>
  )
}
