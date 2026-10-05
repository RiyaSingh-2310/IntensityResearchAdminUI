import { apiRequest } from '@/lib/apiClient'
import { mapSettings } from '@/lib/mappers'
import type { AdminSettings } from '@/types'
import type { ApiSettings, ApiSettingsData, ApiSettingsInput } from '@/types/api'

export const settingsService = {
  async get(): Promise<AdminSettings> {
    const data = await apiRequest<ApiSettingsData | ApiSettings>('/admin/settings')
    const settings = 'settings' in data && data.settings ? data.settings : (data as ApiSettings)
    return mapSettings(settings)
  },
  async update(input: AdminSettings): Promise<AdminSettings> {
    const payload: ApiSettingsInput = {
      registration_reward_points: input.registrationRewardPoints,
      minimum_payout: input.minimumPayout,
      amazon_enabled: input.amazonEnabled ? 1 : 0,
      flipkart_enabled: input.flipkartEnabled ? 1 : 0,
      paypal_enabled: input.paypalEnabled ? 1 : 0,
    }
    await apiRequest('/admin/settings', { method: 'PUT', body: payload })
    return settingsService.get()
  },
  async sendTestEmail(email: string) {
    await apiRequest('/admin/test-email', { method: 'POST', body: { email: email.trim() } })
  },
}
