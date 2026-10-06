import { Children, cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type ControlProps = { id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }

export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  const autoId = useId()
  const child = Children.count(children) === 1 && isValidElement(children) ? (children as ReactElement<ControlProps>) : null
  const controlId = htmlFor ?? child?.props.id ?? autoId
  const messageId = `${controlId}-message`
  const message = error || hint
  const control =
    child && !htmlFor
      ? cloneElement(child, {
          id: controlId,
          ...(message ? { 'aria-describedby': messageId } : {}),
          ...(error ? { 'aria-invalid': true } : {}),
        })
      : children

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={controlId}>{label}</Label>
      {control}
      {error ? (
        <p id={messageId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      {!error && hint ? (
        <p id={messageId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
