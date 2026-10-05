import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notify } from '@/lib/notify'
import { queryKeys } from '@/lib/query'
import { settingsService } from '@/services/settings.service'
import type { AdminSettings } from '@/types'

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => settingsService.get(),
  })
}

export function useSaveSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AdminSettings) => settingsService.update(input),
    onSuccess: () => {
      notify.success('Settings saved.')
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings })
      void queryClient.invalidateQueries({ queryKey: queryKeys.rewardMethods })
    },
    onError: (error) => notify.error(error),
  })
}

export function useSendTestEmail(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (email: string) => settingsService.sendTestEmail(email),
    onSuccess: (_data, email) => {
      notify.success(`Test email sent to ${email.trim()}.`)
      onSuccess?.()
    },
    onError: (error) => notify.error(error),
  })
}
