import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SortableHeader({
  label,
  column,
  sortBy,
  sortDir,
  onSort,
}: {
  label: string
  column: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSort: (column: string) => void
}) {
  const active = sortBy === column
  return (
    <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={() => onSort(column)}>
      {label}
      {active && sortDir === 'asc' ? (
        <ArrowUp className="size-3.5" />
      ) : active && sortDir === 'desc' ? (
        <ArrowDown className="size-3.5" />
      ) : (
        <ArrowUpDown className="size-3.5 opacity-50" />
      )}
    </Button>
  )
}
