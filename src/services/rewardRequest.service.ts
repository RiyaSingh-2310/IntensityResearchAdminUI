import { apiRequest, toSearch } from '@/lib/apiClient'
import { mapRewardRequest, paginateRows, sortRows } from '@/lib/mappers'
import type { PaginatedResult, RewardRequest, RewardRequestListQuery } from '@/types'
import type { ApiRewardRequestListData } from '@/types/api'

export async function fetchRewardRequests(status?: string) {
  const data = await apiRequest<ApiRewardRequestListData>(
    `/admin/reward-requests${toSearch({
      status: status && status !== 'all' ? status : undefined,
    })}`,
  )
  return (data.requests ?? []).map(mapRewardRequest)
}

export const rewardRequestService = {
  async list(query: RewardRequestListQuery = {}): Promise<PaginatedResult<RewardRequest>> {
    const rows = filterRequests(await fetchRewardRequests(query.status), query)
    const sorted = sortRows(rows, query.sortBy === 'requestedAt' ? 'requestedAt' : query.sortBy, query.sortDir)
    return paginateRows(sorted, query.page ?? 1, query.pageSize ?? 10)
  },
  async get(id: string) {
    const match = (await fetchRewardRequests()).find((item) => item.id === id)
    if (!match) throw new Error('The requested record was not found.')
    return match
  },
  approve(id: string, comment?: string) {
    return apiRequest(`/admin/reward-requests/${id}`, {
      method: 'PUT',
      body: { status: 'approved', ...(comment ? { comment } : {}) },
    })
  },
  reject(id: string, comment?: string) {
    return apiRequest(`/admin/reward-requests/${id}`, {
      method: 'PUT',
      body: { status: 'rejected', ...(comment ? { comment } : {}) },
    })
  },
}

function filterRequests(rows: RewardRequest[], query: RewardRequestListQuery) {
  const search = query.search?.trim().toLowerCase()
  return rows.filter((item) => {
    if (query.status && query.status !== 'all' && item.status !== query.status) return false
    if (query.panelistId && item.panelistId !== query.panelistId) return false
    if (!search) return true
    return `${item.requestId} ${item.panelistName} ${item.panelistEmail} ${item.rewardName}`.toLowerCase().includes(search)
  })
}
