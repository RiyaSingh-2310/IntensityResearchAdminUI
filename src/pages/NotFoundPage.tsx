import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandFooter } from '@/components/common/BrandFooter'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="login-canvas flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 text-center shadow-[0_24px_80px_-32px_rgba(0,0,0,0.6)] sm:p-8">
        <div className="brand-hairline absolute inset-x-0 top-0 h-px" aria-hidden />
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="flex justify-center">
          <Logo to="/admin/dashboard" />
        </div>
        <span className="mx-auto mt-7 grid size-11 place-items-center rounded-xl bg-primary/12 text-primary">
          <Compass className="size-5" />
        </span>
        <p className="mt-4 text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">Error 404</p>
        <h1 className="font-display mt-2 text-[1.75rem] font-bold">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This admin URL does not exist. Check the address or return to the dashboard.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link to="/admin/dashboard">Back to dashboard</Link>
        </Button>
      </div>
      <BrandFooter className="mt-8" />
    </div>
  )
}
