import type { InputHTMLAttributes } from 'react'
import { Input } from '@/components/ui/input'
import { sanitizePointsInput } from '@/lib/validators'
import { cn } from '@/lib/utils'

type PointsInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  value: string | number
  onValueChange: (value: string) => void
}

/** Integer points field: typing only, max 6 digits, no spinner/wheel/arrow stepping. */
export function PointsInput({ value, onValueChange, className, onKeyDown, ...props }: PointsInputProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={String(value)}
      className={cn('[appearance:textfield]', className)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') event.preventDefault()
        onKeyDown?.(event)
      }}
      onChange={(event) => onValueChange(sanitizePointsInput(event.target.value))}
    />
  )
}
