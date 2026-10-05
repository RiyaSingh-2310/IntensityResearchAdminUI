import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query'
import { rewardService } from '@/services/reward.service'

export function useRewardMethods() {
  return useQuery({
    queryKey: queryKeys.rewardMethods,
    queryFn: () => rewardService.methods(),
    staleTime: 60_000,
  })
}

export function useRewardTypes() {
  const methods = useRewardMethods()
  return {
    ...methods,
    data: methods.data?.map((method) => ({ value: method.name, label: method.label })),
  }
}
