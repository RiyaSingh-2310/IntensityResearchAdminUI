import type { ListQuery } from './common.types'
import type { ProjectAssignment } from './project.types'
import type { RewardTransaction } from './reward.types'

export type Gender = 'female' | 'male' | 'non_binary' | 'prefer_not'
export type AgeRange = '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+'
export type PanelistStatus = 'active' | 'inactive' | 'pending'
export type Education =
  | 'high_school'
  | 'some_college'
  | 'associate'
  | 'bachelors'
  | 'masters'
  | 'doctorate'
export type Employment =
  | 'full_time'
  | 'part_time'
  | 'self_employed'
  | 'unemployed'
  | 'student'
  | 'retired'
  | 'homemaker'
export type HouseholdIncome =
  | 'under_25k'
  | '25k_49k'
  | '50k_74k'
  | '75k_99k'
  | '100k_149k'
  | '150k_plus'

export interface SurveyPreferences {
  shoppingPreference: string
  preferredCategories: string[]
  typicalSpend: string
  researchParticipation: string
}

export interface Panelist {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  gender?: Gender
  ageRange?: AgeRange
  education?: Education
  employment?: Employment
  householdIncome?: HouseholdIncome
  householdSize?: string
  status: PanelistStatus
  isVerified: boolean
  onboardingStep: number
  onboardingCompletedAt: string
  updatedAt: string
  photo: string
  rewardPoints: number
  redeemedPoints: number
  pendingPoints: number
  assignedProjectCount: number
  completedProjectCount: number
  registeredAt: string
  surveyPreferences: SurveyPreferences
}

export interface OnboardingAnswer {
  id: string
  question: string
  answer: string
}

export interface PanelistDetail extends Panelist {
  assignments: ProjectAssignment[]
  recentRewards: RewardTransaction[]
  /** Every onboarding answer returned by GET /admin/panelists/{id}. */
  onboardingAnswers: OnboardingAnswer[]
}

export interface UpdatePanelistInput {
  firstName: string
  lastName: string
  phone: string
  status: 'active' | 'inactive'
  isVerified: boolean
}

export interface PanelistListQuery extends ListQuery {
  status?: PanelistStatus | 'all'
  gender?: Gender | 'all'
  ageRange?: AgeRange | 'all'
  registeredFrom?: string
  registeredTo?: string
  /** When set, only verified panelists are returned and pagination is applied after that filter. */
  verifiedOnly?: boolean
}
