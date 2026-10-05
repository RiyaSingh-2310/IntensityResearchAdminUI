import { Loader2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SearchField({
  value,
  onChange,
  placeholder,
  searching = false,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  searching?: boolean
}) {
  return (
    <div className="relative flex-1">
      <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
      <Input
        className="pr-9 pl-9"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={placeholder}
      />
      {searching ? (
        <Loader2 className="absolute top-2.5 right-3 size-4 animate-spin text-muted-foreground" aria-hidden />
      ) : value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="absolute top-1.5 right-1.5"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </Button>
      ) : null}
    </div>
  )
}
