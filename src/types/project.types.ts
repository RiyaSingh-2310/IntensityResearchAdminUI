import type { ListQuery } from './common.types'

export type AssignmentStatus = 'active' | 'complete' | 'terminate' | 'quota_full'

export interface ProjectAssignment {
  id: string
  projectName: string
  panelistId: string
  panelistName: string
  panelistEmail: string
  surveyUrl: string
  assignedAt: string
  status: AssignmentStatus
  rewardPoints: number
  completedAt: string
  remark: string
  createdBy?: string
  createdByName?: string
  updatedBy?: string
  updatedByName?: string
  updatedAt?: string
}

export interface AssignProjectInput {
  panelistId: string
  projectName: string
  surveyUrl: string
  rewardPoints: number
  remark?: string
}

export interface SelectedPanelist {
  id: string
  name: string
  email: string
}

export interface AssignPanelistsInput {
  surveyName: string
  surveyUrl: string
  panelistIds: string[]
  rewardPoints: number
  remark?: string
}

export interface UpdateSurveyInput {
  surveyName?: string
  surveyUrl?: string
  rewardPoints?: number
  status?: AssignmentStatus
  remark?: string
}

export interface AssignmentSummary {
  surveyName: string
  surveyUrl: string
  panelistCount: number
  panelists: SelectedPanelist[]
  rewardPointsPerPanelist: number
  totalRewardPoints: number
  remark?: string
}

export interface ProjectListQuery extends ListQuery {
  status?: AssignmentStatus | 'all'
  panelistId?: string
}
