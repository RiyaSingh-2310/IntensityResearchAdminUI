import { Link } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="login-canvas flex min-h-svh items-center justify-center px-4 py-10">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Logo to="/admin/dashboard" />
        <h1 className="font-display mt-6 text-3xl">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This admin URL does not exist. Check the address or return to the dashboard.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link to="/admin/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
