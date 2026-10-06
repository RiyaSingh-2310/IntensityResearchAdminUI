import { ShieldCheck } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LoginForm } from '@/components/auth/LoginForm'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'

export function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const requestedPath = (location.state as { from?: string } | null)?.from
  const destination = requestedPath?.startsWith('/admin/') ? requestedPath : '/admin/dashboard'

  return (
    <div className="login-canvas grid min-h-svh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <section className="relative hidden overflow-hidden bg-primary px-8 py-10 text-primary-foreground md:px-12 lg:flex lg:flex-col lg:justify-between">
        <Logo inverted to="/admin/login" />
        <div className="max-w-md">
          <h1 className="font-display mt-4 text-4xl leading-tight xl:text-5xl">Operate the panel with clarity.</h1>
          <p className="mt-5 text-base leading-7 text-primary-foreground/80">
            Sign in to manage panelists, assignments, and rewards from a secure Intensity Research workspace.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-primary-foreground/75">
          <ShieldCheck className="size-4 text-sidebar-primary" />
          Protected admin access · token-ready sessions
        </div>
      </section>

      <section className="relative flex items-center justify-center px-4 py-8 sm:px-8 sm:py-12">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="w-full max-w-[26rem] rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8"
        >
          <div className="mb-6 lg:hidden">
            <Logo to="/admin/login" />
          </div>
          <h2 className="font-display text-[1.85rem] leading-tight sm:text-3xl">Admin sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use your Intensity Research administrator credentials.</p>
          <LoginForm onSuccess={() => navigate(destination, { replace: true })} />
        </motion.div>
      </section>
    </div>
  )
}
