import { AdminDonut } from '@/components/charts/AdminCharts'
import { ChartCard } from '@/components/charts/ChartCard'
import type { ChartDatum } from '@/types'

export function RewardStatusChart({ data, loading }: { data?: ChartDatum[]; loading?: boolean }) {
  return (
    <ChartCard title="Pending vs approved vs rejected" loading={loading} empty={!data?.length}>
      <AdminDonut data={data ?? []} />
    </ChartCard>
  )
}
