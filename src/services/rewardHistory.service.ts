import { downloadCsv, toCsv } from '@/lib/csv'
import { paginateRows, sortRows, toTransaction } from '@/lib/mappers'
import { fetchRewardRequests } from '@/services/rewardRequest.service'
import type { PaginatedResult, RewardHistoryQuery, RewardTransaction } from '@/types'

export const rewardHistoryService = {
  async list(query: RewardHistoryQuery = {}): Promise<PaginatedResult<RewardTransaction>> {
    const rows = filterHistory((await fetchRewardRequests(query.status)).map(toTransaction), query)
    const sorted = sortRows(
      rows,
      query.sortBy === 'transactionDate' ? 'transactionDate' : query.sortBy,
      query.sortDir,
    )
    return paginateRows(sorted, query.page ?? 1, query.pageSize ?? 10)
  },
  async export(query: RewardHistoryQuery = {}) {
    const result = await rewardHistoryService.list({ ...query, page: 1, pageSize: Number.MAX_SAFE_INTEGER })
    const csv = toCsv(
      result.data.map((item) => ({
        Request: item.requestId,
        Panelist: item.panelistName,
        Email: item.panelistEmail,
        Method: item.rewardName,
        Points: item.points,
        Status: item.status,
        Requested: item.transactionDate,
        Actioned: item.actionDate ?? '',
        Comment: item.comment ?? '',
      })),
    )
    downloadCsv(csv, 'intensity-research-reward-history.csv')
  },
}

function filterHistory(rows: RewardTransaction[], query: RewardHistoryQuery) {
  const search = query.search?.trim().toLowerCase()
  const rewardType = query.rewardType?.trim()
  return rows.filter((item) => {
    if (query.status && query.status !== 'all' && item.status !== query.status) return false
    if (
      rewardType &&
      rewardType !== 'all' &&
      item.rewardType.trim().toLowerCase() !== rewardType.trim().toLowerCase()
    ) {
      return false
    }
    if (query.panelistId && item.panelistId !== query.panelistId) return false
    if (query.dateFrom && item.transactionDate.slice(0, 10) < query.dateFrom) return false
    if (query.dateTo && item.transactionDate.slice(0, 10) > query.dateTo) return false
    if (!search) return true
    return `${item.requestId} ${item.panelistName} ${item.panelistEmail} ${item.rewardName}`
      .toLowerCase()
      .includes(search)
  })
}
