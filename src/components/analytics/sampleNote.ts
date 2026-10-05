import { formatNumber } from '@/lib/format'
import type { PanelistAnalytics } from '@/types'

export function sampleNote(data?: PanelistAnalytics) {
  if (!data) return undefined
  if (data.sampleSize >= data.population) return 'From onboarding answers.'
  return `From onboarding answers of the ${formatNumber(data.sampleSize)} newest of ${formatNumber(data.population)} panelists.`
}
