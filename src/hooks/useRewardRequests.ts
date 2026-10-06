import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/errors'
import { notify } from '@/lib/notify'
import { queryKeys } from '@/lib/query'
import { rewardRequestService } from '@/services/rewardRequest.service'
import type { RewardRequestListQuery } from '@/types'

export function useRewardRequestList(query: RewardRequestListQuery) {
  return useQuery({
    queryKey: queryKeys.rewardRequests(query),
    queryFn: () => rewardRequestService.list(query),
  })
}

async function refetchAfterMutation(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['reward-requests'] }),
    queryClient.invalidateQueries({ queryKey: ['reward-history'] }),
    queryClient.invalidateQueries({ queryKey: ['panelists'] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    queryClient.invalidateQueries({ queryKey: queryKeys.rewardAnalytics }),
  ])
}

export function useRewardRequestAction(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      action,
      comment,
    }: {
      id: string
      action: 'approve' | 'reject'
      comment?: string
    }) => {
      const note = comment?.trim() || undefined
      if (action === 'approve') return rewardRequestService.approve(id, note)
      return rewardRequestService.reject(id, note)
    },
    onSuccess: async (_data, variables) => {
      await refetchAfterMutation(queryClient)
      notify.success(
        variables.action === 'approve' ? 'Reward request approved.' : 'Reward request rejected.',
      )
      onSuccess?.()
    },
    onError: async (error) => {
      notify.error(error)
      if (error instanceof ApiError && error.status === 409) {
        await refetchAfterMutation(queryClient)
        onSuccess?.()
      }
    },
  })
}
