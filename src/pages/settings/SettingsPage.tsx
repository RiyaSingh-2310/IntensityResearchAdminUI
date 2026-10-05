import { KeyRound, LogOut, Mail, Monitor, Moon, Send, Sun } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Field } from '@/components/shared/Field'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorState, LoadingSkeleton } from '@/components/shared/PageState'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PointsInput } from '@/components/ui/points-input'
import { Switch } from '@/components/ui/switch'
import { BRAND } from '@/config/brand'
import type { ThemeMode } from '@/config/theme'
import { useAuth } from '@/context/AuthContext'
import { useSaveSettings, useSendTestEmail, useSettings } from '@/hooks/useSettings'
import { useTheme } from '@/hooks/useTheme'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import { isValidEmail, validateNonNegativePoints } from '@/lib/validators'
import type { AdminSettings } from '@/types'

const PAYOUT_TOGGLES: { key: 'amazonEnabled' | 'flipkartEnabled' | 'paypalEnabled'; label: string }[] = [
  { key: 'amazonEnabled', label: 'Amazon' },
  { key: 'flipkartEnabled', label: 'Flipkart' },
  { key: 'paypalEnabled', label: 'PayPal' },
]

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
]

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'IR'
  )
}

function SectionCard({
  title,
  description,
  icon,
  className,
  children,
}: {
  title: string
  description?: string
  icon?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start gap-3">
        {icon ? (
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/20 ring-inset">
            {icon}
          </span>
        ) : null}
        <div>
          <CardTitle className="font-display text-base font-semibold">{title}</CardTitle>
          {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function sameSettings(a: AdminSettings, b: AdminSettings) {
  return (
    a.registrationRewardPoints === b.registrationRewardPoints &&
    a.minimumPayout === b.minimumPayout &&
    a.amazonEnabled === b.amazonEnabled &&
    a.flipkartEnabled === b.flipkartEnabled &&
    a.paypalEnabled === b.paypalEnabled
  )
}

function PayoutSettingsCard() {
  const settings = useSettings()
  const save = useSaveSettings()
  const [draft, setDraft] = useState<AdminSettings | null>(null)
  const [errors, setErrors] = useState<{ registration?: string; payout?: string }>({})
  const form = draft ?? settings.data ?? null
  const dirty = Boolean(draft && settings.data && !sameSettings(draft, settings.data))

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!form || save.isPending) return
    const next = {
      registration: validateNonNegativePoints(form.registrationRewardPoints, 'Registration reward points'),
      payout: validateNonNegativePoints(form.minimumPayout, 'Minimum payout'),
    }
    setErrors(next)
    if (next.registration || next.payout) return
    save.mutate(form, { onSuccess: () => setDraft(null) })
  }

  return (
    <SectionCard
      title="Rewards & payouts"
      description="Applies to every panelist. Changes take effect as soon as you save."
      className="xl:col-span-2"
    >
      {settings.isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : settings.isError ? (
        <ErrorState message={getErrorMessage(settings.error)} onRetry={() => settings.refetch()} />
      ) : form ? (
        <form onSubmit={submit} noValidate>
          <fieldset disabled={save.isPending} className="grid gap-6 lg:grid-cols-2">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Field
                label="Registration reward points"
                htmlFor="registration-points"
                error={errors.registration}
                hint="Credited when a panelist signs up."
              >
                <PointsInput
                  id="registration-points"
                  value={form.registrationRewardPoints}
                  aria-invalid={Boolean(errors.registration)}
                  onValueChange={(value) => {
                    setErrors((current) => ({ ...current, registration: undefined }))
                    setDraft({ ...form, registrationRewardPoints: value ? Number(value) : 0 })
                  }}
                />
              </Field>
              <Field
                label="Minimum payout (points)"
                htmlFor="minimum-payout"
                error={errors.payout}
                hint="Smallest balance a panelist can redeem."
              >
                <PointsInput
                  id="minimum-payout"
                  value={form.minimumPayout}
                  aria-invalid={Boolean(errors.payout)}
                  onValueChange={(value) => {
                    setErrors((current) => ({ ...current, payout: undefined }))
                    setDraft({ ...form, minimumPayout: value ? Number(value) : 0 })
                  }}
                />
              </Field>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Payout methods</p>
              <div className="divide-y rounded-lg border bg-surface/50">
                {PAYOUT_TOGGLES.map((toggle) => (
                  <label
                    key={toggle.key}
                    htmlFor={`toggle-${toggle.key}`}
                    className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3"
                  >
                    <span className="text-sm">{toggle.label}</span>
                    <Switch
                      id={`toggle-${toggle.key}`}
                      checked={form[toggle.key]}
                      onCheckedChange={(checked) => setDraft({ ...form, [toggle.key]: checked })}
                    />
                  </label>
                ))}
              </div>
            </div>
          </fieldset>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-5">
            <Button type="submit" disabled={save.isPending || !dirty}>
              {save.isPending ? 'Saving…' : 'Save changes'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={save.isPending || !dirty}
              onClick={() => {
                setDraft(null)
                setErrors({})
              }}
            >
              Discard
            </Button>
            {dirty ? <span className="text-xs text-warning">You have unsaved changes.</span> : null}
          </div>
        </form>
      ) : null}
    </SectionCard>
  )
}

function TestEmailCard() {
  const { user } = useAuth()
  const [email, setEmail] = useState(user?.email ?? '')
  const [error, setError] = useState<string>()
  const send = useSendTestEmail()

  function submit(event: FormEvent) {
    event.preventDefault()
    if (send.isPending) return
    const next = !email.trim() ? 'Enter an email address.' : !isValidEmail(email) ? 'Enter a valid email address.' : undefined
    setError(next)
    if (!next) send.mutate(email)
  }

  return (
    <SectionCard
      title="Email delivery check"
      description="Sends a test message through the platform's mail server to confirm emails are going out."
      icon={<Mail className="size-4" />}
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Field label="Recipient" htmlFor="test-email" error={error} className="flex-1">
          <Input
            id="test-email"
            type="email"
            autoComplete="email"
            value={email}
            aria-invalid={Boolean(error)}
            disabled={send.isPending}
            onChange={(event) => {
              setEmail(event.target.value)
              setError(undefined)
            }}
          />
        </Field>
        <Button type="submit" variant="outline" className="sm:mt-[1.375rem]" disabled={send.isPending}>
          <Send className="size-4" />
          {send.isPending ? 'Sending…' : 'Send test'}
        </Button>
      </form>
    </SectionCard>
  )
}

export function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  function handleLogout() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Reward rules, payout methods, your account and appearance."
        crumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Settings' }]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <PayoutSettingsCard />

        <SectionCard title="Your account" description="Details from your current admin session.">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="bg-gradient-to-br from-primary to-highlight text-base font-semibold text-white">
                {user ? initials(user.name) : 'IR'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{user?.name}</p>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
              <p className="mt-1 text-[0.7rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                {user?.role}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <p className="text-sm text-muted-foreground">Signed in on this device.</p>
            <Button type="button" variant="outline" onClick={handleLogout}>
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Appearance" description="Stored on this device only." icon={<Monitor className="size-4" />}>
          <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-3">
            {THEME_OPTIONS.map((option) => {
              const active = theme === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                    active
                      ? 'border-primary/60 bg-primary/[0.08] text-foreground'
                      : 'bg-surface/50 text-muted-foreground hover:border-primary/30 hover:text-foreground',
                  )}
                >
                  <option.icon className={cn('size-4', active && 'text-primary')} />
                  <span className="font-medium">{option.label}</span>
                </button>
              )
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="Password"
          description="Changing an admin password isn't available in this console."
          icon={<KeyRound className="size-4" />}
        >
          <p className="text-sm leading-6 text-muted-foreground">
            The Intensity Research API has no admin password-change endpoint, so passwords can't be changed here. To
            change or reset your password, contact{' '}
            <a href={`mailto:${BRAND.email}`} className="font-medium text-primary hover:underline">
              {BRAND.email}
            </a>
            .
          </p>
        </SectionCard>

        <TestEmailCard />
      </div>
    </div>
  )
}
