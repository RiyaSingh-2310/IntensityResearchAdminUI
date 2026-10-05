import { useMutation, useQuery } from '@tanstack/react-query'
import { notify } from '@/lib/notify'
import { queryKeys } from '@/lib/query'
import { rewardHistoryService } from '@/services/rewardHistory.service'
import type { RewardHistoryQuery } from '@/types'

export function useRewardHistory(query: RewardHistoryQuery) {
  return useQuery({
    queryKey: queryKeys.rewardHistory(query),
    queryFn: () => rewardHistoryService.list(query),
  })
}

export function useExportRewardHistory(query: RewardHistoryQuery) {
  return useMutation({
    mutationFn: () => rewardHistoryService.export(query),
    onSuccess: () => notify.success('Reward history exported.'),
    onError: (error) => notify.error(error),
  })
}
