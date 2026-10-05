import type { ListQuery } from './common.types'

export type RewardRequestStatus = 'pending' | 'approved' | 'rejected'

/** A payout method panelists can redeem through, from GET /settings `payment_methods`. */
export interface RewardMethod {
  id: string
  name: string
  label: string
}

export interface RewardRequest {
  id: string
  requestId: string
  panelistId: string
  panelistName: string
  panelistEmail: string
  /** Panelist's current point balance at the time the list was fetched. */
  panelistBalance?: number
  rewardName: string
  rewardType: string
  points: number
  requestedAt: string
  status: RewardRequestStatus
  remark?: string
  comment?: string
  actionBy?: string
  actionDate?: string
}

export interface RewardTransaction {
  id: string
  requestId: string
  panelistId: string
  panelistName: string
  panelistEmail: string
  rewardName: string
  rewardType: string
  points: number
  transactionDate: string
  status: RewardRequestStatus
  comment?: string
  actionDate?: string
}

export interface RewardRequestListQuery extends ListQuery {
  status?: RewardRequestStatus | 'all'
  panelistId?: string
}

export interface RewardHistoryQuery extends ListQuery {
  status?: RewardRequestStatus | 'all'
  rewardType?: string | 'all'
  panelistId?: string
  dateFrom?: string
  dateTo?: string
}
