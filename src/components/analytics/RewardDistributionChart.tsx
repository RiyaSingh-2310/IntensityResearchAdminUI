import { AdminDonut } from '@/components/charts/AdminCharts'
import { ChartCard } from '@/components/charts/ChartCard'
import type { ChartDatum } from '@/types'

export function RewardDistributionChart({ data, loading }: { data?: ChartDatum[]; loading?: boolean }) {
  return (
    <ChartCard title="Requests by payout method" description="All requests, any status." loading={loading} empty={!data?.length}>
      <AdminDonut data={data ?? []} />
    </ChartCard>
  )
}
