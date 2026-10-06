import { decodeJwtExpiry } from '@/lib/jwt'
import {
  AGE_RANGE_LABELS,
  EDUCATION_LABELS,
  EMPLOYMENT_LABELS,
  GENDER_LABELS,
  INCOME_LABELS,
  REQUEST_STATUS_LABELS,
  paymentMethodLabel,
} from '@/lib/labels'
import type {
  AgeRange,
  AuthSession,
  ChartDatum,
  DashboardAnalytics,
  Education,
  Employment,
  Gender,
  HouseholdIncome,
  LoginInput,
  PaginatedResult,
  Panelist,
  PanelistAnalytics,
  PanelistDetail,
  RewardAnalytics,
  RewardRequest,
  RewardRequestStatus,
  AssignmentStatus,
  ProjectAssignment,
  RewardTransaction,
  TrendPoint,
} from '@/types'
import type {
  ApiAdmin,
  ApiLoginData,
  ApiPanelist,
  ApiPanelistAnswer,
  ApiRewardRequest,
  ApiSettings,
  ApiSurveyAssignment,
} from '@/types/api'

export function asString(value: unknown, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value)
}

export function asNumber(value: unknown, fallback = 0) {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

export function asFlag(value: unknown) {
  return value === 1 || value === '1' || value === true || value === 'true'
}

export function toIsoDate(value?: string | null) {
  if (!value) return ''
  return value.includes('T') ? value : value.replace(' ', 'T')
}

export function splitName(name: string) {
  const trimmed = name.trim()
  const index = trimmed.indexOf(' ')
  if (index === -1) return { firstName: trimmed, lastName: '' }
  return { firstName: trimmed.slice(0, index), lastName: trimmed.slice(index + 1) }
}

export function joinName(firstName: string, lastName: string) {
  return [firstName, lastName].filter(Boolean).join(' ').trim()
}

export function paginateRows<T>(rows: T[], page = 1, pageSize = 10): PaginatedResult<T> {
  const safePage = Math.max(1, page)
  const safeSize = Math.max(1, pageSize)
  const start = (safePage - 1) * safeSize
  return {
    data: rows.slice(start, start + safeSize),
    total: rows.length,
    page: safePage,
    pageSize: safeSize,
  }
}

export function sortRows<T>(rows: T[], sortBy?: string, sortDir: 'asc' | 'desc' = 'desc') {
  if (!sortBy) return rows
  const copy = [...rows]
  copy.sort((left, right) => {
    const a = (left as Record<string, unknown>)[sortBy]
    const b = (right as Record<string, unknown>)[sortBy]
    const av = a instanceof Date ? a.getTime() : a
    const bv = b instanceof Date ? b.getTime() : b
    if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
    return sortDir === 'asc'
      ? String(av ?? '').localeCompare(String(bv ?? ''))
      : String(bv ?? '').localeCompare(String(av ?? ''))
  })
  return copy
}

export function mapAdminUser(admin: ApiAdmin) {
  return {
    id: asString(admin.id),
    name: admin.name,
    email: admin.email,
    // Display label only; authorization is enforced by the API on every admin route.
    role: admin.role?.trim() || 'Administrator',
  }
}

export function mapAuthSession(data: ApiLoginData, input: LoginInput): AuthSession {
  return {
    token: data.token,
    expiresAt: decodeJwtExpiry(data.token) ?? Date.now() + 7 * 24 * 60 * 60 * 1000,
    remember: input.remember,
    user: mapAdminUser(data.admin),
  }
}

export function mapPanelist(item: ApiPanelist, answers: ApiPanelistAnswer[] = []): Panelist {
  const { firstName, lastName } = splitName(item.name ?? '')
  const demographics = parseDemographics(answers)
  return {
    id: asString(item.id),
    firstName,
    lastName,
    email: item.email ?? '',
    phone: item.phone ?? '',
    gender: demographics.gender,
    ageRange: demographics.ageRange,
    education: demographics.education,
    employment: demographics.employment,
    householdIncome: demographics.householdIncome,
    householdSize: demographics.householdSize,
    status: item.status === 'active' ? 'active' : 'inactive',
    isVerified: asFlag(item.is_verified),
    onboardingStep: asNumber(item.onboarding_step),
    onboardingCompletedAt: toIsoDate(item.onboarding_completed_at),
    updatedAt: toIsoDate(item.updated_at),
    photo: item.photo ?? '',
    rewardPoints: asNumber(item.balance_point),
    redeemedPoints: 0,
    pendingPoints: 0,
    assignedProjectCount: 0,
    completedProjectCount: 0,
    registeredAt: toIsoDate(item.created_at),
    surveyPreferences: {
      shoppingPreference: answerText(answers, 'shopping method') || '—',
      preferredCategories: multiAnswer(answers, 'shopping interest categor'),
      typicalSpend: answerText(answers, 'shopping budget') || '—',
      researchParticipation: answerText(answers, 'survey frequency') || '—',
    },
  }
}

export function mapPanelistDetail(
  item: ApiPanelist,
  answers: ApiPanelistAnswer[] = [],
  requests: RewardRequest[] = [],
  assignments: ProjectAssignment[] = [],
): PanelistDetail {
  const panelist = mapPanelist(item, answers)
  const mine = requests.filter((request) => request.panelistId === panelist.id)
  const redeemed = mine.filter((request) => request.status === 'approved').reduce((sum, item) => sum + item.points, 0)
  const pending = mine.filter((request) => request.status === 'pending').reduce((sum, item) => sum + item.points, 0)
  return {
    ...panelist,
    redeemedPoints: redeemed,
    pendingPoints: pending,
    assignedProjectCount: assignments.length,
    completedProjectCount: assignments.filter((assignment) => assignment.status === 'complete').length,
    assignments,
    recentRewards: mine.map(toTransaction),
    onboardingAnswers: answers
      .map((answer) => ({
        id: asString(answer.id ?? answer.question_id),
        question: (answer.question_text ?? '').trim(),
        answer: (answer.answer_text ?? '').trim(),
      }))
      .filter((answer) => answer.question || answer.answer),
  }
}

export function mapRewardRequest(item: ApiRewardRequest): RewardRequest {
  const method = (item.payment_method || item.payment_methord || '').trim() || 'Not specified'
  const balance = item.balance_point
  return {
    id: asString(item.id),
    requestId: `RR-${asString(item.id).padStart(4, '0')}`,
    panelistId: asString(item.user_id),
    panelistName: item.panelist_name || item.requested_by || 'Panelist',
    panelistEmail: (item.panelist_email ?? '').trim(),
    panelistBalance: balance === null || balance === undefined || balance === '' ? undefined : asNumber(balance),
    rewardName: method,
    rewardType: method,
    points: asNumber(item.reward_points),
    requestedAt: toIsoDate(item.created_at),
    status: normalizeRequestStatus(item.status),
    remark: item.remark?.trim() || undefined,
    comment: item.comment?.trim() || undefined,
    actionBy: item.action_by?.trim() || undefined,
    actionDate: item.action_date ? toIsoDate(item.action_date) : undefined,
  }
}

export function toTransaction(item: RewardRequest): RewardTransaction {
  return {
    id: item.id,
    requestId: item.requestId,
    panelistId: item.panelistId,
    panelistName: item.panelistName,
    panelistEmail: item.panelistEmail,
    rewardName: item.rewardName,
    rewardType: item.rewardType,
    points: item.points,
    transactionDate: item.requestedAt,
    status: item.status,
    comment: item.comment,
    actionDate: item.actionDate,
  }
}

export function mapSettings(item: ApiSettings) {
  return {
    registrationRewardPoints: asNumber(item.registration_reward_points),
    minimumPayout: asNumber(item.minimum_payout),
    amazonEnabled: asFlag(item.amazon_enabled),
    flipkartEnabled: asFlag(item.flipkart_enabled),
    paypalEnabled: asFlag(item.paypal_enabled),
  }
}

export function buildDashboard(
  panelists: Panelist[],
  requests: RewardRequest[],
): DashboardAnalytics {
  const now = Date.now()
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000
  const redeemed = requests.filter((item) => item.status === 'approved')
  const pending = requests.filter((item) => item.status === 'pending')
  const recentPanelists = [...panelists]
    .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
    .slice(0, 4)
    .map((item) => ({
      id: `pnl-${item.id}`,
      title: 'New panelist registered',
      detail: `${[item.firstName, item.lastName].filter(Boolean).join(' ')} joined the panel.`,
      at: item.registeredAt,
      kind: 'panelist' as const,
    }))
  const recentRequests = [...requests]
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
    .slice(0, 4)
    .map((item) => ({
      id: `req-${item.id}`,
      title: `Reward request ${REQUEST_STATUS_LABELS[item.status].toLowerCase()}`,
      detail: `${item.panelistName} · ${paymentMethodLabel(item.rewardName)} · ${item.points.toLocaleString('en-US')} pts`,
      at: item.requestedAt,
      kind: 'reward' as const,
    }))
  return {
    totalPanelists: panelists.length,
    newRegistrations: panelists.filter((item) => new Date(item.registeredAt).getTime() >= monthAgo).length,
    activePanelists: panelists.filter((item) => item.status === 'active' && item.isVerified).length,
    pendingRewardRequests: pending.length,
    outstandingPoints: panelists.reduce((sum, item) => sum + item.rewardPoints, 0),
    totalPointsRedeemed: redeemed.reduce((sum, item) => sum + item.points, 0),
    pendingRequestPoints: pending.reduce((sum, item) => sum + item.points, 0),
    activeProjects: 0,
    recentActivity: [...recentRequests, ...recentPanelists]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 6),
  }
}

export function buildPanelistAnalytics(details: Panelist[], population = details.length): PanelistAnalytics {
  return {
    sampleSize: details.length,
    population,
    gender: countBy(
      details,
      (item) => item.gender,
      (key) => GENDER_LABELS[key as Gender] ?? key,
      Object.keys(GENDER_LABELS),
    ),
    ageRange: countBy(
      details,
      (item) => item.ageRange,
      (key) => AGE_RANGE_LABELS[key as AgeRange] ?? key,
      Object.keys(AGE_RANGE_LABELS),
    ),
    education: countBy(
      details,
      (item) => item.education,
      (key) => EDUCATION_LABELS[key as Education] ?? key,
      Object.keys(EDUCATION_LABELS),
    ),
    employment: countBy(details, (item) => item.employment, (key) => EMPLOYMENT_LABELS[key as Employment] ?? key),
    householdIncome: countBy(
      details,
      (item) => item.householdIncome,
      (key) => INCOME_LABELS[key as HouseholdIncome] ?? key,
      Object.keys(INCOME_LABELS),
    ),
    shoppingPreferences: countBy(
      details.flatMap((item) => item.surveyPreferences.preferredCategories),
      (item) => item,
      (key) => key,
    ),
    registrationTrend: {
      daily: trendBy(details, 'day'),
      weekly: trendBy(details, 'week'),
      monthly: trendBy(details, 'month'),
    },
  }
}

export function buildRewardAnalytics(requests: RewardRequest[], panelists: Panelist[]): RewardAnalytics {
  const approved = requests.filter((item) => item.status === 'approved')
  const pending = requests.filter((item) => item.status === 'pending')
  return {
    redeemed: trendBy(
      approved.map((item) => ({ at: item.actionDate || item.requestedAt, value: item.points })),
      'day',
      'at',
      'value',
    ),
    typeDistribution: countBy(requests, (item) => item.rewardType, (key) => paymentMethodLabel(key)),
    requestStatus: countBy(
      requests,
      (item) => item.status,
      (key) => REQUEST_STATUS_LABELS[key as RewardRequestStatus] ?? key,
      Object.keys(REQUEST_STATUS_LABELS),
    ),
    topRewards: countBy(approved, (item) => item.rewardName, (key) => paymentMethodLabel(key)),
    pointsEconomy: {
      outstanding: panelists.reduce((sum, item) => sum + item.rewardPoints, 0),
      redeemed: approved.reduce((sum, item) => sum + item.points, 0),
      pending: pending.reduce((sum, item) => sum + item.points, 0),
    },
  }
}

function normalizeRequestStatus(status?: string): RewardRequestStatus {
  if (status === 'approved' || status === 'rejected' || status === 'pending') return status
  return 'pending'
}

function parseDemographics(answers: ApiPanelistAnswer[]) {
  return {
    gender: parseGender(answerText(answers, 'gender')),
    ageRange: parseAgeRange(answerText(answers, 'age range')),
    education: parseEducation(answerText(answers, 'education')),
    employment: parseEmployment(answerText(answers, 'employment')),
    householdIncome: parseIncome(answerText(answers, 'household income')),
    householdSize: answerText(answers, 'household size') || undefined,
  }
}

function answerText(answers: ApiPanelistAnswer[], needle: string) {
  const match = answers.find((item) => (item.question_text ?? '').toLowerCase().includes(needle))
  return match?.answer_text?.trim() ?? ''
}

/** Checkbox answers may be stored as one JSON array, one delimited string, or one row per choice. */
function multiAnswer(answers: ApiPanelistAnswer[], needle: string) {
  const values = answers
    .filter((item) => (item.question_text ?? '').toLowerCase().includes(needle))
    .flatMap((item) => {
      const raw = item.answer_text?.trim() ?? ''
      if (!raw) return []
      if (raw.startsWith('[')) {
        try {
          const parsed: unknown = JSON.parse(raw)
          if (Array.isArray(parsed)) return parsed.map((value) => String(value).trim())
        } catch {
          // fall through to delimiter split
        }
      }
      return raw.split(/\s*[,|;]\s*/)
    })
    .filter(Boolean)
  return [...new Set(values)]
}

function parseGender(value: string): Gender | undefined {
  const text = value.toLowerCase()
  if (!text) return undefined
  if (text.includes('non-binary') || text.includes('nonbinary')) return 'non_binary'
  if (text.includes('prefer not')) return 'prefer_not'
  if (text.includes('female')) return 'female'
  if (text.includes('male')) return 'male'
  return undefined
}

function parseAgeRange(value: string): AgeRange | undefined {
  const text = value.trim().toLowerCase()
  if (text.startsWith('18')) return '18-24'
  if (text.startsWith('25')) return '25-34'
  if (text.startsWith('35')) return '35-44'
  if (text.startsWith('45')) return '45-54'
  if (text.startsWith('55')) return '55-64'
  if (text.startsWith('65')) return '65+'
  return undefined
}

function parseEducation(value: string): Education | undefined {
  const text = value.toLowerCase()
  if (text.includes('doctor')) return 'doctorate'
  if (text.includes('master')) return 'masters'
  if (text.includes('bachelor')) return 'bachelors'
  if (text.includes('associate')) return 'associate'
  if (text.includes('college')) return 'some_college'
  if (text.includes('high')) return 'high_school'
  return undefined
}

function parseEmployment(value: string): Employment | undefined {
  const text = value.toLowerCase()
  if (text.includes('home')) return 'homemaker'
  if (text.includes('student')) return 'student'
  if (text.includes('retired')) return 'retired'
  if (text.includes('self')) return 'self_employed'
  if (text.includes('part')) return 'part_time'
  if (text.includes('unemploy')) return 'unemployed'
  if (text.includes('full') || text.includes('employ')) return 'full_time'
  return undefined
}

function parseIncome(value: string): HouseholdIncome | undefined {
  const text = value.toLowerCase().replace(/\s+/g, ' ').trim()
  if (!text) return undefined
  if (text.startsWith('under')) return 'under_25k'
  if (text.startsWith('over')) return '150k_plus'
  if (text.includes('100') && text.includes('150')) return '100k_149k'
  if (text.includes('75') && text.includes('100')) return '75k_99k'
  if (text.includes('50') && text.includes('75')) return '50k_74k'
  if (text.includes('25') && text.includes('50')) return '25k_49k'
  return undefined
}

/** Counts rows per key. With `order`, results follow that sequence; otherwise largest first. */
function countBy<T>(
  rows: T[],
  keyOf: (item: T) => string | undefined,
  labelOf: (key: string) => string,
  order?: readonly string[],
): ChartDatum[] {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const key = keyOf(row)
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const rank = (key: string) => {
    const index = order?.indexOf(key) ?? -1
    return index === -1 ? Number.MAX_SAFE_INTEGER : index
  }
  return [...counts.entries()]
    .sort(([a, av], [b, bv]) => (order ? rank(a) - rank(b) : bv - av))
    .map(([key, value]) => ({ key, label: labelOf(key), value }))
}

const TREND_WINDOW = { day: 30, week: 12, month: 12 } as const
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function bucketStart(date: Date, unit: 'day' | 'week' | 'month') {
  const next = new Date(date.getFullYear(), date.getMonth(), unit === 'month' ? 1 : date.getDate())
  if (unit === 'week') next.setDate(next.getDate() - next.getDay())
  return next
}

function bucketKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function bucketLabel(date: Date, unit: 'day' | 'week' | 'month') {
  if (unit === 'month') return `${MONTHS[date.getMonth()]} '${String(date.getFullYear()).slice(2)}`
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`
}

/** Buckets rows into a gap-filled series ending at the current period (30 days, 12 weeks or 12 months). */
function trendBy(
  rows: Array<Record<string, unknown>> | Panelist[],
  unit: 'day' | 'week' | 'month',
  dateKey = 'registeredAt',
  valueKey?: string,
): TrendPoint[] {
  const buckets = new Map<string, number>()
  for (const row of rows as Array<Record<string, unknown>>) {
    const raw = String(row[dateKey] ?? '')
    if (!raw) continue
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) continue
    const key = bucketKey(bucketStart(date, unit))
    buckets.set(key, (buckets.get(key) ?? 0) + (valueKey ? asNumber(row[valueKey], 0) : 1))
  }
  const points: TrendPoint[] = []
  const cursor = bucketStart(new Date(), unit)
  for (let index = 0; index < TREND_WINDOW[unit]; index += 1) {
    const key = bucketKey(cursor)
    points.unshift({ date: key, label: bucketLabel(cursor, unit), value: buckets.get(key) ?? 0 })
    if (unit === 'month') cursor.setMonth(cursor.getMonth() - 1)
    else cursor.setDate(cursor.getDate() - (unit === 'week' ? 7 : 1))
  }
  return points.some((point) => point.value > 0) ? points : []
}

export function mapSurveyStatus(value?: string): AssignmentStatus {
  if (value === 'complete' || value === 'terminate' || value === 'quota_full') return value
  return 'active'
}

export function mapSurveyAssignment(item: ApiSurveyAssignment): ProjectAssignment {
  return {
    id: asString(item.id),
    projectName: item.survey_name?.trim() || item.survey_url || 'Survey',
    panelistId: asString(item.panelist_id),
    panelistName: item.panelist_name?.trim() || 'Panelist',
    panelistEmail: item.panelist_email ?? '',
    surveyUrl: item.survey_url ?? '',
    assignedAt: toIsoDate(item.created_at),
    status: mapSurveyStatus(item.status),
    rewardPoints: asNumber(item.reward_points),
    completedAt: toIsoDate(item.completed_at),
    remark: item.remark ?? '',
    createdBy: item.created_by == null ? undefined : asString(item.created_by),
    createdByName: item.created_by_name ?? undefined,
    updatedBy: item.updated_by == null ? undefined : asString(item.updated_by),
    updatedByName: item.updated_by_name ?? undefined,
    updatedAt: toIsoDate(item.updated_at) || undefined,
  }
}
