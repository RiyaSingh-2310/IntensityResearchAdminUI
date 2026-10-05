import { Clock, Gift, Wallet } from 'lucide-react'
import { KpiCard } from '@/components/shared/KpiCard'
import { KpiSkeleton } from '@/components/shared/PageState'
import { formatNumber } from '@/lib/format'

export function PointsEconomyChart({
  outstanding,
  redeemed,
  pending,
  loading,
}: {
  outstanding?: number
  redeemed?: number
  pending?: number
  loading?: boolean
}) {
  if (loading || outstanding === undefined || redeemed === undefined || pending === undefined) {
    return <KpiSkeleton count={3} />
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <KpiCard
        label="Outstanding balance"
        value={formatNumber(outstanding)}
        hint="Points held across all panelists"
        icon={Wallet}
      />
      <KpiCard
        label="Pending payouts"
        value={formatNumber(pending)}
        hint="Points in requests awaiting review"
        icon={Clock}
        tone="warning"
      />
      <KpiCard
        label="Points redeemed"
        value={formatNumber(redeemed)}
        hint="Approved payout requests"
        icon={Gift}
        tone="success"
      />
    </div>
  )
}
