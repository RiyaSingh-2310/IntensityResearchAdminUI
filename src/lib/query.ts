import type {
  PanelistListQuery,
  ProjectListQuery,
  RewardHistoryQuery,
  RewardRequestListQuery,
} from '@/types'

export const queryKeys = {
  session: ['admin', 'session'] as const,
  dashboard: ['analytics', 'dashboard'] as const,
  panelistAnalytics: ['analytics', 'panelists'] as const,
  rewardAnalytics: ['analytics', 'rewards'] as const,
  panelists: (query: PanelistListQuery) => ['panelists', query] as const,
  panelist: (id: string) => ['panelists', 'detail', id] as const,
  additionalProfiles: (id: string) => ['panelists', 'additional-profiles', id] as const,
  profileQuestions: (profileType: string) => ['profile-questions', profileType] as const,
  panelistOptions: ['panelists', 'options'] as const,
  projects: (query: ProjectListQuery) => ['projects', query] as const,
  project: (id: string) => ['projects', 'detail', id] as const,
  rewardMethods: ['reward-methods'] as const,
  rewardRequests: (query: RewardRequestListQuery) => ['reward-requests', query] as const,
  rewardHistory: (query: RewardHistoryQuery) => ['reward-history', query] as const,
  settings: ['settings'] as const,
}
