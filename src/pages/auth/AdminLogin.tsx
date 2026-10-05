import { ClipboardList, ShieldCheck, Users, Wallet } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LoginForm } from '@/components/auth/LoginForm'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { BrandFooter } from '@/components/common/BrandFooter'

const CAPABILITIES = [
  { icon: Users, title: 'Panel management', detail: 'Review panelists, verification, onboarding answers, and status.' },
  { icon: ClipboardList, title: 'Survey assignments', detail: 'Assign survey links, track completes, terminates, and quota-fulls.' },
  { icon: Wallet, title: 'Rewards & payouts', detail: 'Approve redemptions, credit points, and audit reward history.' },
] as const

export function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const requestedPath = (location.state as { from?: string } | null)?.from
  const destination = requestedPath?.startsWith('/admin/') ? requestedPath : '/admin/dashboard'

  return (
    <div className="login-canvas grid min-h-svh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <section className="relative hidden overflow-hidden border-r border-sidebar-border bg-sidebar px-10 py-10 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between xl:px-14">
        <div className="brand-grid pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute -top-40 -left-32 size-[34rem] rounded-full bg-[radial-gradient(circle,rgba(47,107,255,0.28),transparent_65%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-40 -bottom-48 size-[36rem] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.22),transparent_65%)]"
          aria-hidden
        />

        <Logo inverted size="lg" to="/admin/login" className="relative" />

        <div className="relative max-w-lg">
          <p className="text-xs font-semibold tracking-[0.28em] text-sidebar-primary uppercase">Admin console</p>
          <h1 className="font-display mt-4 text-4xl leading-[1.1] font-bold text-white xl:text-[2.85rem]">
            Research operations,
            <br />
            <span className="brand-gradient-text">measured with precision.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-sidebar-foreground/80">
            Sign in to run the Intensity Research panel — participants, survey assignments, and rewards — from one secure workspace.
          </p>

          <ul className="mt-9 space-y-3">
            {CAPABILITIES.map((item) => (
              <li
                key={item.title}
                className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 backdrop-blur-sm"
              >
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary/12 text-sidebar-primary">
                  <item.icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{item.title}</span>
                  <span className="block text-sm leading-6 text-sidebar-foreground/70">{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-sm text-sidebar-foreground/70">
          <ShieldCheck className="size-4 text-sidebar-primary" />
          Authorized administrators only · Bearer-token sessions
        </div>
      </section>

      <section className="relative flex flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-12">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="relative w-full max-w-[26rem] overflow-hidden rounded-2xl border border-border bg-card/95 p-6 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.6)] backdrop-blur sm:p-8"
        >
          <div className="brand-hairline absolute inset-x-0 top-0 h-px" aria-hidden />
          <div className="mb-7 lg:hidden">
            <Logo to="/admin/login" />
          </div>
          <h2 className="font-display text-[1.75rem] leading-tight font-bold sm:text-3xl">Admin sign in</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Use your Intensity Research administrator credentials.</p>
          <LoginForm onSuccess={() => navigate(destination, { replace: true })} />
        </motion.div>
        <BrandFooter className="mt-8" />
      </section>
    </div>
  )
}
