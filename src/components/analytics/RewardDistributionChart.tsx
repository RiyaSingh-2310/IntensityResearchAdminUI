import { AdminDonut } from '@/components/charts/AdminCharts'
import { ChartCard } from '@/components/charts/ChartCard'
import type { ChartDatum } from '@/types'

export function RewardDistributionChart({ data, loading }: { data?: ChartDatum[]; loading?: boolean }) {
  return (
    <ChartCard title="Reward type distribution" loading={loading} empty={!data?.length}>
      <AdminDonut data={data ?? []} />
    </ChartCard>
  )
}
