import { AdminDonut } from '@/components/charts/AdminCharts'
import { ChartCard } from '@/components/charts/ChartCard'
import type { ChartDatum } from '@/types'

export function RewardStatusChart({ data, loading }: { data?: ChartDatum[]; loading?: boolean }) {
  return (
    <ChartCard title="Request outcomes" description="Pending, approved and rejected requests." loading={loading} empty={!data?.length}>
      <AdminDonut data={data ?? []} />
    </ChartCard>
  )
}
