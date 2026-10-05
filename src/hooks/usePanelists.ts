import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notify } from '@/lib/notify'
import { queryKeys } from '@/lib/query'
import { panelistService } from '@/services/panelist.service'
import type { PanelistListQuery, UpdatePanelistInput } from '@/types'

export function usePanelistList(query: PanelistListQuery) {
  return useQuery({
    queryKey: queryKeys.panelists(query),
    queryFn: () => panelistService.list(query),
  })
}

export function usePanelist(id: string) {
  return useQuery({
    queryKey: queryKeys.panelist(id),
    queryFn: () => panelistService.get(id),
    enabled: Boolean(id),
  })
}

export function usePanelistOptions() {
  return useQuery({
    queryKey: queryKeys.panelistOptions,
    queryFn: () => panelistService.options(),
  })
}

function invalidatePanelists(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['panelists'] })
}

export function useUpdatePanelist(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePanelistInput }) =>
      panelistService.update(id, input),
    onSuccess: () => {
      notify.success('Panelist updated successfully.')
      invalidatePanelists(queryClient)
      onSuccess?.()
    },
    onError: (error) => notify.error(error),
  })
}

export function useActivatePanelist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: panelistService.activate,
    onSuccess: () => {
      notify.success('Panelist activated successfully.')
      invalidatePanelists(queryClient)
    },
    onError: (error) => notify.error(error),
  })
}

export function useDeactivatePanelist(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: panelistService.deactivate,
    onSuccess: () => {
      notify.success('Panelist deactivated successfully.')
      invalidatePanelists(queryClient)
      onSuccess?.()
    },
    onError: (error) => notify.error(error),
  })
}

export function useCreditPanelist(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, points, remark }: { id: string; points: number; remark?: string }) =>
      panelistService.credit(id, points, remark),
    onSuccess: () => {
      notify.success('Points credited successfully.')
      invalidatePanelists(queryClient)
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      void queryClient.invalidateQueries({ queryKey: queryKeys.rewardAnalytics })
      onSuccess?.()
    },
    onError: (error) => notify.error(error),
  })
}
