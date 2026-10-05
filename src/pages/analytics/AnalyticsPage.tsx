import { useState } from 'react'
import { AgeDistributionChart } from '@/components/analytics/AgeDistributionChart'
import { GenderDistributionChart } from '@/components/analytics/GenderDistributionChart'
import { PointsEconomyChart } from '@/components/analytics/PointsEconomyChart'
import { RegistrationTrendChart } from '@/components/analytics/RegistrationTrendChart'
import { RewardDistributionChart } from '@/components/analytics/RewardDistributionChart'
import { RewardStatusChart } from '@/components/analytics/RewardStatusChart'
import { sampleNote } from '@/components/analytics/sampleNote'
import { AdminBar, AdminDonut, AdminLine } from '@/components/charts/AdminCharts'
import { ChartCard } from '@/components/charts/ChartCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorState } from '@/components/shared/PageState'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePanelistAnalytics, useRewardAnalytics } from '@/hooks/useAnalytics'
import { useChartTheme } from '@/hooks/useChartTheme'
import { getErrorMessage } from '@/lib/errors'

const RANGE_COPY = {
  daily: 'New panelists per day, last 30 days.',
  weekly: 'New panelists per week, last 12 weeks.',
  monthly: 'New panelists per month, last 12 months.',
} as const

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-10 mb-4 first:mt-0">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function AnalyticsPage() {
  const [range, setRange] = useState<keyof typeof RANGE_COPY>('daily')
  const panelists = usePanelistAnalytics()
  const rewards = useRewardAnalytics()
  const { colors } = useChartTheme()
  const economy = rewards.data?.pointsEconomy
  const note = sampleNote(panelists.data)

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Calculated in the browser from live panelist, survey and payout data."
        crumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Analytics' }]}
      />

      <SectionHeading title="Rewards" description="Point balances and payout requests." />
      {rewards.isError ? (
        <ErrorState message={getErrorMessage(rewards.error)} onRetry={() => rewards.refetch()} />
      ) : (
        <>
          <PointsEconomyChart
            outstanding={economy?.outstanding}
            redeemed={economy?.redeemed}
            pending={economy?.pending}
            loading={rewards.isLoading}
          />
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <ChartCard
              title="Points redeemed"
              description="Approved payouts per day, last 30 days."
              loading={rewards.isLoading}
              empty={!rewards.data?.redeemed.length}
            >
              <AdminLine data={rewards.data?.redeemed ?? []} color={colors[1]} />
            </ChartCard>
            <RewardStatusChart data={rewards.data?.requestStatus} loading={rewards.isLoading} />
            <RewardDistributionChart data={rewards.data?.typeDistribution} loading={rewards.isLoading} />
            <ChartCard
              title="Approved payouts by method"
              description="Number of approved requests."
              loading={rewards.isLoading}
              empty={!rewards.data?.topRewards.length}
            >
              <AdminBar data={rewards.data?.topRewards ?? []} color={colors[2]} />
            </ChartCard>
          </div>
        </>
      )}

      <SectionHeading title="Panel" description="Growth and onboarding demographics." />
      {panelists.isError ? (
        <ErrorState message={getErrorMessage(panelists.error)} onRetry={() => panelists.refetch()} />
      ) : (
        <>
          <RegistrationTrendChart
            data={panelists.data?.registrationTrend[range]}
            loading={panelists.isLoading}
            description={RANGE_COPY[range]}
            action={
              <Tabs value={range} onValueChange={(value) => setRange(value as typeof range)}>
                <TabsList>
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            }
          />
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <GenderDistributionChart data={panelists.data?.gender} loading={panelists.isLoading} description={note} />
            <AgeDistributionChart data={panelists.data?.ageRange} loading={panelists.isLoading} description={note} />
            <ChartCard
              title="Education"
              description={note}
              loading={panelists.isLoading}
              empty={!panelists.data?.education.length}
            >
              <AdminBar data={panelists.data?.education ?? []} color={colors[2]} />
            </ChartCard>
            <ChartCard
              title="Employment status"
              description={note}
              loading={panelists.isLoading}
              empty={!panelists.data?.employment.length}
            >
              <AdminBar data={panelists.data?.employment ?? []} color={colors[3]} />
            </ChartCard>
            <ChartCard
              title="Household income"
              description={note}
              loading={panelists.isLoading}
              empty={!panelists.data?.householdIncome.length}
            >
              <AdminBar data={panelists.data?.householdIncome ?? []} color={colors[1]} />
            </ChartCard>
            <ChartCard
              title="Shopping interests"
              description={note}
              loading={panelists.isLoading}
              empty={!panelists.data?.shoppingPreferences.length}
            >
              <AdminDonut data={panelists.data?.shoppingPreferences ?? []} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}
