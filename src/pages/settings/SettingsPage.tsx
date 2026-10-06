import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { ErrorState, LoadingSkeleton } from '@/components/shared/PageState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PointsInput } from '@/components/ui/points-input'
import { Switch } from '@/components/ui/switch'
import { BRAND } from '@/config/brand'
import { useAuth } from '@/context/AuthContext'
import { useSaveSettings, useSendTestEmail, useSettings } from '@/hooks/useSettings'
import { useTheme } from '@/hooks/useTheme'
import { getErrorMessage } from '@/lib/errors'
import { roleLabel } from '@/lib/labels'
import { isValidEmail, validateNonNegativePoints } from '@/lib/validators'
import type { AdminSettings } from '@/types'

const PAYOUT_TOGGLES: { key: 'amazonEnabled' | 'flipkartEnabled' | 'paypalEnabled'; label: string }[] = [
  { key: 'amazonEnabled', label: 'Amazon enabled' },
  { key: 'flipkartEnabled', label: 'Flipkart enabled' },
  { key: 'paypalEnabled', label: 'PayPal enabled' },
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

function sameSettings(a: AdminSettings, b: AdminSettings) {
  return (
    a.registrationRewardPoints === b.registrationRewardPoints &&
    a.minimumPayout === b.minimumPayout &&
    a.amazonEnabled === b.amazonEnabled &&
    a.flipkartEnabled === b.flipkartEnabled &&
    a.paypalEnabled === b.paypalEnabled
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
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-display text-xl">Email delivery</CardTitle>
        <CardDescription>Send a test message to confirm platform emails are going out.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="test-email">Recipient</Label>
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
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
          <Button type="submit" variant="outline" disabled={send.isPending}>
            {send.isPending ? 'Sending…' : 'Send test email'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const settings = useSettings()
  const save = useSaveSettings()
  const [draft, setDraft] = useState<AdminSettings | null>(null)
  const [pointsError, setPointsError] = useState<string>()
  const [payoutError, setPayoutError] = useState<string>()
  const [pointsText, setPointsText] = useState<{ registration?: string; minimum?: string }>({})
  const form = draft ?? settings.data ?? null
  const dirty = Boolean(
    draft &&
      settings.data &&
      (!sameSettings(draft, settings.data) || pointsText.registration === '' || pointsText.minimum === ''),
  )

  if (settings.isLoading) return <LoadingSkeleton />
  if (settings.isError) {
    return <ErrorState message={getErrorMessage(settings.error)} onRetry={() => settings.refetch()} />
  }
  if (!form) return null

  function saveSettings() {
    if (!form || save.isPending) return
    const registrationError = validateNonNegativePoints(
      pointsText.registration ?? form.registrationRewardPoints,
      'Registration reward points',
    )
    const nextPayoutError = validateNonNegativePoints(pointsText.minimum ?? form.minimumPayout, 'Minimum payout')
    setPointsError(registrationError)
    setPayoutError(nextPayoutError)
    if (registrationError || nextPayoutError) return
    save.mutate(form, { onSuccess: discardChanges })
  }

  function discardChanges() {
    setDraft(null)
    setPointsText({})
    setPointsError(undefined)
    setPayoutError(undefined)
  }

  function handleLogout() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Administrator profile, appearance, and payout configuration."
        crumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Settings' }]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-xl">Administrator</CardTitle>
            <CardDescription>Profile details from your signed-in admin session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar size="lg" className="size-16">
                <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                  {user ? initials(user.name) : 'IR'}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="admin-name">Name</Label>
                <Input id="admin-name" value={user?.name ?? ''} disabled readOnly className="cursor-not-allowed" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input id="admin-email" value={user?.email ?? ''} disabled readOnly className="cursor-not-allowed" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="admin-role">Role</Label>
                <Input
                  id="admin-role"
                  value={roleLabel(user?.role)}
                  disabled
                  readOnly
                  className="cursor-not-allowed"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-xl">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">Currently using {theme} mode.</p>
              </div>
              <ThemeToggle />
            </div>
            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium">Password</p>
              <p className="text-sm text-muted-foreground">
                Admin passwords can't be changed from this console. Contact{' '}
                <a href={`mailto:${BRAND.email}`} className="font-medium text-primary hover:underline">
                  {BRAND.email}
                </a>{' '}
                to change or reset your password.
              </p>
            </div>
            <div className="space-y-2 border-t pt-4">
              <p className="text-sm text-muted-foreground">If you want to logout, click here.</p>
              <Button type="button" variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-xl">Payout settings</CardTitle>
            <CardDescription>Registration points, minimum payout, and enabled payment methods.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="registration-points">Registration reward points</Label>
              <PointsInput
                id="registration-points"
                value={pointsText.registration ?? form.registrationRewardPoints}
                disabled={save.isPending}
                aria-invalid={Boolean(pointsError)}
                onValueChange={(value) => {
                  setPointsError(undefined)
                  setPointsText((current) => ({ ...current, registration: value }))
                  setDraft({
                    ...form,
                    registrationRewardPoints: value ? Number(value) : 0,
                  })
                }}
              />
              {pointsError ? <p className="text-xs text-destructive">{pointsError}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="minimum-payout">Minimum payout</Label>
              <PointsInput
                id="minimum-payout"
                value={pointsText.minimum ?? form.minimumPayout}
                disabled={save.isPending}
                aria-invalid={Boolean(payoutError)}
                onValueChange={(value) => {
                  setPayoutError(undefined)
                  setPointsText((current) => ({ ...current, minimum: value }))
                  setDraft({
                    ...form,
                    minimumPayout: value ? Number(value) : 0,
                  })
                }}
              />
              {payoutError ? <p className="text-xs text-destructive">{payoutError}</p> : null}
            </div>
            {PAYOUT_TOGGLES.map((toggle) => (
              <label key={toggle.key} className="flex cursor-pointer items-center justify-between gap-4 text-sm">
                <span>{toggle.label}</span>
                <Switch
                  checked={form[toggle.key]}
                  disabled={save.isPending}
                  onCheckedChange={(checked) => setDraft({ ...form, [toggle.key]: checked })}
                />
              </label>
            ))}
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
              <Button disabled={save.isPending || !dirty} onClick={saveSettings}>
                {save.isPending ? 'Saving…' : 'Save settings'}
              </Button>
              {dirty ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={save.isPending}
                  onClick={discardChanges}
                >
                  Discard
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <TestEmailCard />
      </div>
    </div>
  )
}
