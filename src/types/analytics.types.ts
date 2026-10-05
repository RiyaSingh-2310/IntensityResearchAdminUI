import type { ChartDatum, TrendPoint } from './common.types'

export interface ActivityItem {
  id: string
  title: string
  detail: string
  at: string
  kind: 'panelist' | 'project' | 'reward'
}

export interface DashboardAnalytics {
  totalPanelists: number
  newRegistrations: number
  activePanelists: number
  pendingRewardRequests: number
  outstandingPoints: number
  totalPointsRedeemed: number
  pendingRequestPoints: number
  activeProjects: number
  recentActivity: ActivityItem[]
}

export interface PanelistAnalytics {
  gender: ChartDatum[]
  ageRange: ChartDatum[]
  education: ChartDatum[]
  employment: ChartDatum[]
  householdIncome: ChartDatum[]
  shoppingPreferences: ChartDatum[]
  /** Panelists whose onboarding answers were loaded for the demographic charts. */
  sampleSize: number
  population: number
  registrationTrend: {
    daily: TrendPoint[]
    weekly: TrendPoint[]
    monthly: TrendPoint[]
  }
}

export interface RewardAnalytics {
  redeemed: TrendPoint[]
  typeDistribution: ChartDatum[]
  requestStatus: ChartDatum[]
  topRewards: ChartDatum[]
  pointsEconomy: {
    outstanding: number
    redeemed: number
    pending: number
  }
}
