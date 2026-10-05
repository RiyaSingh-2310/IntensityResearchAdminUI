import { apiRequest } from '@/lib/apiClient'
import { paymentMethodLabel } from '@/lib/labels'
import type { LookupOption, RewardMethod } from '@/types'
import type { ApiPublicSettings } from '@/types/api'

/**
 * The Intensity API has no rewards catalog. Panelists redeem points through the payout
 * methods listed in GET /settings → `payment_methods`; enable/disable toggles live in
 * the admin settings (PUT /admin/settings).
 */
export const rewardService = {
  async methods(): Promise<RewardMethod[]> {
    const settings = await apiRequest<ApiPublicSettings>('/settings', { auth: false })
    const seen = new Set<string>()
    const methods: RewardMethod[] = []
    for (const method of settings.payment_methods ?? []) {
      const name = method.name?.trim()
      if (!name) continue
      const key = name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      methods.push({ id: String(method.id), name, label: paymentMethodLabel(name) })
    }
    return methods
  },
  async types(): Promise<LookupOption[]> {
    const methods = await rewardService.methods()
    return methods.map((method) => ({ value: method.name, label: method.label }))
  },
}
