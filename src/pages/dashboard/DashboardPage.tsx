import { ArrowRight, ClipboardList, Clock, Gift, UserCheck, UserPlus, Users, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AgeDistributionChart } from '@/components/analytics/AgeDistributionChart'
import { GenderDistributionChart } from '@/components/analytics/GenderDistributionChart'
import { RegistrationTrendChart } from '@/components/analytics/RegistrationTrendChart'
import { sampleNote } from '@/components/analytics/sampleNote'
import { KpiCard } from '@/components/shared/KpiCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, KpiSkeleton } from '@/components/shared/PageState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { useDashboard, usePanelistAnalytics } from '@/hooks/useAnalytics'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const { user } = useAuth()
  const dashboard = useDashboard()
  const panelists = usePanelistAnalytics()
  const data = dashboard.data
  const firstName = user?.name?.split(/\s+/)[0]

  return (
    <div>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
        description="Panel growth, payout workload and survey activity at a glance."
        crumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Dashboard' }]}
      />

      {dashboard.isError ? (
        <ErrorState message={getErrorMessage(dashboard.error)} onRetry={() => dashboard.refetch()} />
      ) : dashboard.isLoading || !data ? (
        <KpiSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard label="Total panelists" value={formatNumber(data.totalPanelists)} hint="All registered members" icon={Users} />
          <KpiCard
            label="New registrations"
            value={formatNumber(data.newRegistrations)}
            hint="Last 30 days"
            icon={UserPlus}
            tone="cyan"
          />
          <KpiCard
            label="Active & verified"
            value={formatNumber(data.activePanelists)}
            hint="Eligible for survey assignment"
            icon={UserCheck}
            tone="success"
          />
          <KpiCard
            label="Pending reward requests"
            value={formatNumber(data.pendingRewardRequests)}
            hint={`${formatNumber(data.pendingRequestPoints)} points awaiting review`}
            icon={Clock}
            tone="warning"
          />
          <KpiCard
            label="Outstanding balance"
            value={formatNumber(data.outstandingPoints)}
            hint="Points held across all panelists"
            icon={Wallet}
            tone="teal"
          />
          <KpiCard
            label="Points redeemed"
            value={formatNumber(data.totalPointsRedeemed)}
            hint="Approved payout requests"
            icon={Gift}
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {panelists.isError ? (
          <ErrorState message={getErrorMessage(panelists.error)} onRetry={() => panelists.refetch()} />
        ) : (
          <RegistrationTrendChart data={panelists.data?.registrationTrend.daily} loading={panelists.isLoading} />
        )}

        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="font-display text-base font-semibold">Operations</CardTitle>
              <CardDescription>Latest registrations and payout activity.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="-mr-2 text-primary">
              <Link to="/admin/reward-requests">
                Review
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              to="/admin/projects"
              className="flex items-center justify-between rounded-lg border bg-surface/50 px-4 py-3 transition-colors hover:border-primary/30"
            >
              <span className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-cyan/12 text-cyan ring-1 ring-cyan/20 ring-inset">
                  <ClipboardList className="size-4" />
                </span>
                <span>
                  <span className="block text-sm text-muted-foreground">Active survey assignments</span>
                  <span className="font-display tabular block text-2xl font-bold">
                    {data ? formatNumber(data.activeProjects) : '—'}
                  </span>
                </span>
              </span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>

            {dashboard.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : (data?.recentActivity ?? []).length === 0 ? (
              <EmptyState title="No recent activity" description="New registrations and payout requests will appear here." />
            ) : (
              <ol className="relative space-y-4 border-l border-border pl-5">
                {(data?.recentActivity ?? []).map((item) => (
                  <li key={item.id} className="relative">
                    <span
                      className={cn(
                        'absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full ring-4 ring-card',
                        item.kind === 'reward' ? 'bg-warning' : 'bg-primary',
                      )}
                      aria-hidden
                    />
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                    <p className="mt-0.5 text-[0.7rem] text-muted-foreground/80">{formatDateTime(item.at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {panelists.isError ? null : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <GenderDistributionChart
            data={panelists.data?.gender}
            loading={panelists.isLoading}
            description={sampleNote(panelists.data)}
          />
          <AgeDistributionChart
            data={panelists.data?.ageRange}
            loading={panelists.isLoading}
            description={sampleNote(panelists.data)}
          />
        </div>
      )}
    </div>
  )
}
