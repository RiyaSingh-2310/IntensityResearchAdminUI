import { AdminDonut } from '@/components/charts/AdminCharts'
import { ChartCard } from '@/components/charts/ChartCard'
import type { ChartDatum } from '@/types'

export function GenderDistributionChart({
  data,
  loading,
  description,
}: {
  data?: ChartDatum[]
  loading?: boolean
  description?: string
}) {
  return (
    <ChartCard title="Gender" description={description} loading={loading} empty={!data?.length}>
      <AdminDonut data={data ?? []} />
    </ChartCard>
  )
}
