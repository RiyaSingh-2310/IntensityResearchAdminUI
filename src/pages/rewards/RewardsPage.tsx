import { CreditCard, Gift, Info, Settings2, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { KpiCard } from '@/components/shared/KpiCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/shared/PageState'
import { ToneBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRewardMethods } from '@/hooks/useRewards'
import { useSettings } from '@/hooks/useSettings'
import { getErrorMessage } from '@/lib/errors'
import { formatNumber } from '@/lib/format'
import type { AdminSettings } from '@/types'

const PAYOUT_TOGGLES: { key: keyof AdminSettings; label: string }[] = [
  { key: 'amazonEnabled', label: 'Amazon' },
  { key: 'flipkartEnabled', label: 'Flipkart' },
  { key: 'paypalEnabled', label: 'PayPal' },
]

function methodInitials(label: string) {
  return (
    label
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  )
}

export function RewardsPage() {
  const methods = useRewardMethods()
  const settings = useSettings()
  const rows = methods.data ?? []

  return (
    <div>
      <PageHeader
        title="Reward Methods"
        description="Payout methods panelists can currently redeem points through, as published by the Intensity API."
        crumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Reward Methods' }]}
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/settings">
              <Settings2 className="size-4" />
              Payout settings
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {methods.isLoading || settings.isLoading ? (
          Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-[7.5rem] rounded-xl" />)
        ) : (
          <>
            <KpiCard
              label="Methods offered"
              value={methods.isError ? '—' : formatNumber(rows.length)}
              hint="Returned by GET /settings"
              icon={CreditCard}
            />
            <KpiCard
              label="Minimum payout"
              value={settings.data ? `${formatNumber(settings.data.minimumPayout)} pts` : '—'}
              hint="Smallest redeemable balance"
              icon={Gift}
              tone="cyan"
            />
            <KpiCard
              label="Registration bonus"
              value={settings.data ? `${formatNumber(settings.data.registrationRewardPoints)} pts` : '—'}
              hint="Credited on sign-up"
              icon={Sparkles}
              tone="violet"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base font-semibold">Available payout methods</CardTitle>
            <CardDescription>Panelists choose one of these when they submit a redemption request.</CardDescription>
          </CardHeader>
          <CardContent>
            {methods.isLoading ? (
              <LoadingSkeleton rows={4} />
            ) : methods.isError ? (
              <ErrorState message={getErrorMessage(methods.error)} onRetry={() => methods.refetch()} />
            ) : rows.length === 0 ? (
              <EmptyState
                title="No payout methods published"
                description="The API did not return any payment methods. Check the payout toggles in Settings."
              />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {rows.map((method) => (
                  <li
                    key={method.id}
                    className="flex items-center gap-3 rounded-lg border bg-surface/50 px-4 py-3 transition-colors hover:border-primary/30"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/12 text-sm font-semibold text-primary ring-1 ring-primary/20 ring-inset">
                      {methodInitials(method.label)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{method.label}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        API value <span className="font-mono">{method.name}</span>
                      </p>
                    </div>
                    <ToneBadge tone="success">Offered</ToneBadge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base font-semibold">Payout toggles</CardTitle>
              <CardDescription>Current values from admin settings.</CardDescription>
            </CardHeader>
            <CardContent>
              {settings.isLoading ? (
                <LoadingSkeleton rows={3} />
              ) : settings.isError ? (
                <ErrorState message={getErrorMessage(settings.error)} onRetry={() => settings.refetch()} />
              ) : (
                <ul className="divide-y">
                  {PAYOUT_TOGGLES.map((toggle) => {
                    const enabled = Boolean(settings.data?.[toggle.key])
                    return (
                      <li key={toggle.key} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                        <span className="text-sm font-medium">{toggle.label}</span>
                        <ToneBadge tone={enabled ? 'success' : 'muted'}>{enabled ? 'Enabled' : 'Disabled'}</ToneBadge>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 rounded-xl border border-info/25 bg-info-foreground/60 p-4 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-info" />
            <p className="leading-6 text-muted-foreground">
              The Intensity API has no rewards catalog endpoint, so methods can't be created, renamed or removed here.
              Use <span className="font-medium text-foreground">Settings</span> to enable or disable Amazon, Flipkart and
              PayPal payouts.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
