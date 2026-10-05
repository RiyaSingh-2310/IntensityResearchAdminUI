import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, onKeyDown, ...props }: React.ComponentProps<"input">) {
  const ref = React.useRef<HTMLInputElement>(null)
  const isNumber = type === "number"

  React.useEffect(() => {
    const el = ref.current
    if (!el || !isNumber) return

    const onWheel = (event: WheelEvent) => {
      if (document.activeElement === el) event.preventDefault()
    }

    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [isNumber])

  return (
    <input
      type={type}
      ref={ref}
      data-slot="input"
      inputMode={isNumber ? "numeric" : props.inputMode}
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        isNumber &&
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className
      )}
      {...props}
      onKeyDown={(event) => {
        if (isNumber && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
          event.preventDefault()
        }
        onKeyDown?.(event)
      }}
    />
  )
}

export { Input }
