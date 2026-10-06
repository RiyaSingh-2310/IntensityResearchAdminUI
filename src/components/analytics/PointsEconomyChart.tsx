import { Clock, Gift, Wallet } from 'lucide-react'
import { KpiCard } from '@/components/shared/KpiCard'
import { KpiSkeleton } from '@/components/shared/PageState'
import { formatCompact } from '@/lib/format'

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
    return <KpiSkeleton />
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <KpiCard label="Outstanding points" value={formatCompact(outstanding)} icon={Wallet} />
      <KpiCard label="Pending payout points" value={formatCompact(pending)} icon={Clock} />
      <KpiCard label="Total points redeemed" value={formatCompact(redeemed)} icon={Gift} />
    </div>
  )
}
