import type { ReactNode } from 'react'
import { AdminLine } from '@/components/charts/AdminCharts'
import { ChartCard } from '@/components/charts/ChartCard'
import type { TrendPoint } from '@/types'

export function RegistrationTrendChart({
  data,
  loading,
  action,
  description = 'New panelists per day, last 30 days.',
}: {
  data?: TrendPoint[]
  loading?: boolean
  action?: ReactNode
  description?: string
}) {
  return (
    <ChartCard
      title="Registration trend"
      description={description}
      loading={loading}
      empty={!data?.length}
      action={action}
    >
      <AdminLine data={data ?? []} />
    </ChartCard>
  )
}
