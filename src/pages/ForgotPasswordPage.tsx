import { ArrowLeft, KeyRound, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandFooter } from '@/components/common/BrandFooter'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { Button } from '@/components/ui/button'
import { BRAND } from '@/config/brand'

/**
 * The Intensity API only exposes POST /auth/forgot-password for panelist accounts.
 * Administrator accounts live in a separate table, so that endpoint cannot reset them,
 * and there is no /admin/forgot-password route. This page therefore routes admins to support.
 */
export function ForgotPasswordPage() {
  return (
    <div className="login-canvas flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <div className="brand-hairline absolute inset-x-0 top-0 h-px" aria-hidden />
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Logo to="/admin/login" />
        <span className="mt-7 grid size-11 place-items-center rounded-xl bg-primary/12 text-primary">
          <KeyRound className="size-5" />
        </span>
        <h1 className="font-display mt-4 text-[1.75rem] leading-tight font-bold">Reset your password</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Self-service password reset is not available for administrator accounts. The Intensity Research API only
          supports password resets for panelist accounts.
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Contact the Intensity Research team to have your administrator password reset.
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Button asChild>
            <a href={`mailto:${BRAND.email}?subject=${encodeURIComponent('Admin password reset request')}`}>
              <Mail className="size-4" />
              Email support
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/login">
              <ArrowLeft className="size-4" />
              Back to sign in
            </Link>
          </Button>
        </div>
      </div>
      <BrandFooter className="mt-8" />
    </div>
  )
}
