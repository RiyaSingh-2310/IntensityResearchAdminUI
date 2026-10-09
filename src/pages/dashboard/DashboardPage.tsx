import { ClipboardList, Coins, Gift, UserPlus, Users, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AgeDistributionChart } from '@/components/analytics/AgeDistributionChart'
import { GenderDistributionChart } from '@/components/analytics/GenderDistributionChart'
import { RegistrationTrendChart } from '@/components/analytics/RegistrationTrendChart'
// import { sampleNote } from '@/components/analytics/sampleNote'
import { ErrorState } from '@/components/shared/PageState'
import { KpiCard } from '@/components/shared/KpiCard'
import { KpiSkeleton } from '@/components/shared/PageState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboard, usePanelistAnalytics } from '@/hooks/useAnalytics'
import { getErrorMessage } from '@/lib/errors'
import { formatCompact, formatDateTime, formatNumber } from '@/lib/format'

export function DashboardPage() {
  const dashboard = useDashboard()
  const panelists = usePanelistAnalytics()

  if (dashboard.isError) {
    return <ErrorState message={getErrorMessage(dashboard.error)} onRetry={() => dashboard.refetch()} />
  }

  const data = dashboard.data

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A live operating picture of the panel, assignments, and rewards economy."
        crumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Dashboard' }]}
      />

      {panelists.isError ? (
        <div className="mt-4">
          <ErrorState message={getErrorMessage(panelists.error)} onRetry={() => panelists.refetch()} />
        </div>
      ) : null}

      {dashboard.isLoading || !data ? (
        <KpiSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard label="Total Panelists" value={formatNumber(data.totalPanelists)} hint="All registered members" icon={Users} />
          <KpiCard label="New Registrations" value={formatNumber(data.newRegistrations)} hint="Last 30 days" icon={UserPlus} />
          <KpiCard label="Active Panelists" value={formatNumber(data.activePanelists)} hint="Verified and active" icon={Users} />
          <KpiCard
            label="Pending Reward Requests"
            value={formatNumber(data.pendingRewardRequests)}
            hint={`${formatNumber(data.pendingRequestPoints)} points awaiting admin review`}
            icon={Wallet}
          />
          <KpiCard
            label="Outstanding Points"
            value={formatCompact(data.outstandingPoints)}
            hint="Current panelist balances"
            icon={Coins}
          />
          <KpiCard
            label="Total Points Redeemed"
            value={formatCompact(data.totalPointsRedeemed)}
            hint="Approved payout requests"
            icon={Gift}
          />
        </div>
      )}

{panelists.isError ? null : (
        <div className="mt-4 w-full space-y-4">
          <RegistrationTrendChart
            data={panelists.data?.registrationTrend.daily}
            loading={panelists.isLoading}
            compact
          />

          <div className="grid gap-4 md:grid-cols-2">
            <GenderDistributionChart data={panelists.data?.gender} loading={panelists.isLoading} />
            <AgeDistributionChart data={panelists.data?.ageRange} loading={panelists.isLoading} />
          </div>
        </div>
      )}

      <Card className="mt-4 w-full gap-3 py-4 shadow-sm">
        <CardHeader className="flex-row items-center justify-between px-5">
          <CardTitle className="font-display text-xl">Current operations</CardTitle>
          <ClipboardList className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3 px-5">
          <div className="rounded-2xl bg-secondary px-4 py-2.5">
            <p className="text-sm text-muted-foreground">Active projects</p>
            <p className="font-display text-2xl leading-tight">
              {data ? formatNumber(data.activeProjects) : '—'}
            </p>
          </div>
          <div className="space-y-2">
            {(data?.recentActivity ?? []).map((item) => (
              <div key={item.id} className="border-b border-border/70 pb-2 last:border-0 last:pb-0">
                <p className="text-sm font-medium leading-snug">{item.title}</p>
                <p className="text-xs leading-snug text-muted-foreground">{item.detail}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDateTime(item.at)}</p>
              </div>
            ))}
          </div>
          <Link to="/admin/reward-requests" className="inline-block text-sm text-primary hover:underline">
            Review pending rewards
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
