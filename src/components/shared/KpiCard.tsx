import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const toneStyles = {
  primary: 'bg-primary/12 text-primary ring-primary/20',
  cyan: 'bg-cyan/12 text-cyan ring-cyan/20',
  teal: 'bg-highlight/12 text-highlight ring-highlight/20',
  success: 'bg-success/12 text-success ring-success/20',
  warning: 'bg-warning/12 text-warning ring-warning/20',
} as const

export type KpiTone = keyof typeof toneStyles

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
}: {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  tone?: KpiTone
}) {
  return (
    <Card className="group relative gap-0 overflow-hidden py-5 transition-colors hover:border-primary/30">
      <div className="brand-hairline absolute inset-x-0 top-0 h-px opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
      <CardContent className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{label}</p>
          <p className="font-display tabular mt-2.5 text-[1.9rem] leading-none font-bold">{value}</p>
          {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl ring-1 ring-inset', toneStyles[tone])}>
          <Icon className="size-[1.15rem]" />
        </span>
      </CardContent>
    </Card>
  )
}
