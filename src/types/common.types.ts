export interface ChartDatum {
  key: string
  label: string
  value: number
}

export interface TrendPoint {
  date: string
  label: string
  value: number
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
}

export interface AuthSession {
  token: string
  expiresAt: number
  remember: boolean
  user: AdminUser
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  /** Set when the result could only be computed from part of the data set. */
  notice?: string
}

export interface ListQuery {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface LoginInput {
  email: string
  password: string
  remember: boolean
}

export interface ForgotPasswordInput {
  email: string
}

export interface AdminSettings {
  registrationRewardPoints: number
  minimumPayout: number
  amazonEnabled: boolean
  flipkartEnabled: boolean
  paypalEnabled: boolean
}

export interface LookupOption {
  value: string
  label: string
}
