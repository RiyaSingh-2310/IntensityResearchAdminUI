import { CalendarIcon, X } from 'lucide-react'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import type { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDateRangeLabel, formatDisplayDate, parseLocalDate, toLocalDateString } from '@/lib/format'
import { cn } from '@/lib/utils'

function useWideCalendar() {
  const [wide, setWide] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setWide(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return wide
}

function toCommittedRange(from?: string, to?: string): DateRange | undefined {
  const start = parseLocalDate(from)
  const end = parseLocalDate(to)
  if (!start && !end) return undefined
  if (start && end) {
    return start.getTime() <= end.getTime() ? { from: start, to: end } : { from: end, to: start }
  }
  return { from: start ?? end, to: start ?? end }
}

function normalizeRange(range?: DateRange) {
  if (!range?.from) return undefined
  const start = range.from
  const end = range.to ?? range.from
  return start.getTime() <= end.getTime() ? { from: start, to: end } : { from: end, to: start }
}

export function DateRangePicker({
  from,
  to,
  onApply,
  onClear,
  placeholder = 'Date Range',
}: {
  from?: string
  to?: string
  onApply: (next: { from: string; to: string }) => void
  onClear: () => void
  placeholder?: string
}) {
  const wide = useWideCalendar()
  const [open, setOpen] = useState(false)
  const committed = useMemo(() => toCommittedRange(from, to), [from, to])
  const [draft, setDraft] = useState<DateRange | undefined>(committed)
  const hasValue = Boolean(from && to)
  const label = hasValue ? formatDateRangeLabel(from, to) : placeholder
  const ready = Boolean(draft?.from && draft.to)
  const timeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, [])
  const now = new Date()
  const startMonth = new Date(now.getFullYear() - 10, 0, 1)
  const endMonth = new Date(now.getFullYear() + 1, 11, 31)

  function syncDraft() {
    setDraft(toCommittedRange(from, to))
  }

  function handleSelect(range: DateRange | undefined) {
    if (!range) {
      if (draft?.from && !draft.to) {
        setDraft({ from: draft.from, to: draft.from })
        return
      }
      setDraft(undefined)
      return
    }

    if (
      range.from &&
      !range.to &&
      draft?.from &&
      !draft.to &&
      toLocalDateString(range.from) === toLocalDateString(draft.from)
    ) {
      setDraft({ from: range.from, to: range.from })
      return
    }

    setDraft(range)
  }

  function apply() {
    const next = normalizeRange(draft)
    if (!next?.from || !next.to) return
    const nextFrom = toLocalDateString(next.from)
    const nextTo = toLocalDateString(next.to)
    if (nextFrom !== from || nextTo !== to) onApply({ from: nextFrom, to: nextTo })
    setOpen(false)
  }

  function clear(event?: MouseEvent) {
    event?.preventDefault()
    event?.stopPropagation()
    setDraft(undefined)
    if (hasValue) onClear()
    setOpen(false)
  }

  return (
    <div className="relative min-w-0 w-full">
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) syncDraft()
          setOpen(nextOpen)
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            data-placeholder={!hasValue || undefined}
            aria-label={hasValue ? label : 'Date range'}
            title={hasValue ? label : undefined}
            className={cn(
              // Override buttonVariants shrink-0 / whitespace-nowrap so long ranges stay inside the box.
              'h-9 w-full min-w-0 max-w-full shrink overflow-hidden border-input bg-transparent px-3 font-normal whitespace-normal shadow-xs dark:bg-input/30 dark:hover:bg-input/50',
              'inline-flex items-center justify-start gap-2',
              hasValue ? 'pr-9' : undefined,
              !hasValue && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-left leading-none">{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={6}
          collisionPadding={16}
          className="z-[60] w-auto max-w-[min(44rem,calc(100vw-2rem))] overflow-x-auto overflow-y-auto p-0"
        >
          <div className="border-b p-3">
            <div className="grid min-w-0 grid-cols-2 gap-2 text-xs">
              <div className="flex min-h-14 min-w-0 flex-col justify-center rounded-md border bg-background px-3 py-2">
                <p className="leading-none text-muted-foreground">From</p>
                <p className="mt-1.5 truncate leading-none font-medium">
                  {draft?.from ? formatDisplayDate(draft.from) : 'Select start'}
                </p>
              </div>
              <div className="flex min-h-14 min-w-0 flex-col justify-center rounded-md border bg-background px-3 py-2">
                <p className="leading-none text-muted-foreground">To</p>
                <p className="mt-1.5 truncate leading-none font-medium">
                  {draft?.to ? formatDisplayDate(draft.to) : 'Select end'}
                </p>
              </div>
            </div>
          </div>
          <Calendar
            mode="range"
            timeZone={timeZone}
            captionLayout="dropdown"
            numberOfMonths={wide ? 2 : 1}
            selected={draft}
            onSelect={handleSelect}
            defaultMonth={draft?.from ?? committed?.from ?? now}
            startMonth={startMonth}
            endMonth={endMonth}
            className="px-2 pb-1"
          />
          <div className="flex items-center justify-between gap-2 border-t px-3 py-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => clear()} disabled={!draft && !hasValue}>
              Clear
            </Button>
            <Button type="button" size="sm" onClick={apply} disabled={!ready}>
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {hasValue ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="absolute top-1/2 right-1.5 z-10 -translate-y-1/2"
          onClick={(event) => clear(event)}
          aria-label="Clear date range"
        >
          <X className="size-3.5" />
        </Button>
      ) : null}
    </div>
  )
}
