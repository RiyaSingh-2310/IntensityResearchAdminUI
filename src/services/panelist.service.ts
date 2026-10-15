import { mapAdditionalProfiles, mapProfileQuestions } from '@/lib/additionalProfiles'
import { apiRequest, toSearch } from '@/lib/apiClient'
import { buildOnboardingAnswers, mapOnboardingCatalog, resolvePanelistAnswers, type OnboardingQuestion } from '@/lib/onboardingAnswers'
import { activeQuestionnaireFilters, toPanelistAnswerQuery, type QuestionnaireFilter } from '@/lib/questionnaireFilter'
import { mapWithConcurrency } from '@/lib/async'
import { ApiError } from '@/lib/errors'
import {
  mapPanelist,
  mapPanelistDetail,
  mapRewardRequest,
  paginateRows,
  sortRows,
} from '@/lib/mappers'
import { toPanelistUpdateBody } from '@/lib/panelistUpdate'
import { projectService } from '@/services/project.service'
import type {
  LookupOption,
  PaginatedResult,
  Panelist,
  PanelistDetail,
  PanelistListQuery,
  UpdatePanelistInput,
} from '@/types'
import type { ApiPanelistDetailData, ApiPanelistListData, ApiRewardRequestListData } from '@/types/api'

export const panelistService = {
  async list(query: PanelistListQuery = {}): Promise<PaginatedResult<Panelist>> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    const sortNeedsFullSet = Boolean(
      query.sortBy && !(query.sortBy === 'registeredAt' && (query.sortDir ?? 'desc') === 'desc'),
    )
    const extraFilters = Boolean(
      query.verifiedOnly ||
        sortNeedsFullSet ||
        (query.gender && query.gender !== 'all') ||
        (query.ageRange && query.ageRange !== 'all') ||
        query.registeredFrom ||
        query.registeredTo,
    )

    if (extraFilters) {
      const rows = await listAllPanelists(
        query.search,
        query.status === 'inactive' ? 'inactive' : query.status === 'active' ? 'active' : undefined,
      )
      const needsDemographics =
        (query.gender && query.gender !== 'all') || (query.ageRange && query.ageRange !== 'all')
      const enriched = needsDemographics ? await enrichPanelists(rows) : { rows, scanned: rows.length }
      const filtered = applyClientFilters(enriched.rows, query)
      const result = paginateRows(sortRows(filtered, mapSortKey(query.sortBy), query.sortDir), page, pageSize)
      return enriched.scanned < rows.length
        ? {
            ...result,
            notice: `Gender and age filters use onboarding answers, so only the ${enriched.scanned.toLocaleString('en-US')} most recent of ${rows.length.toLocaleString('en-US')} panelists were checked. Narrow the search to include others.`,
          }
        : result
    }

    const data = await apiRequest<ApiPanelistListData>(
      `/admin/panelists${toSearch({
        q: query.search,
        status: query.status === 'active' || query.status === 'inactive' ? query.status : undefined,
        page,
        limit: pageSize,
      })}`,
    )
    return {
      data: sortRows(
        (data.items ?? []).map((item) => mapPanelist(item)),
        mapSortKey(query.sortBy),
        query.sortDir,
      ),
      total: data.total ?? 0,
      page: data.page ?? page,
      pageSize: data.limit ?? pageSize,
    }
  },
  async options(): Promise<LookupOption[]> {
    const rows = await listAllPanelists()
    return rows.map((item) => ({
      value: item.id,
      label: [item.firstName, item.lastName].filter(Boolean).join(' ') || item.email,
    }))
  },
  async get(id: string): Promise<PanelistDetail> {
    const [detail, requestData, assignments, catalog] = await Promise.all([
      apiRequest<ApiPanelistDetailData>(`/admin/panelists/${id}`),
      apiRequest<ApiRewardRequestListData>('/admin/reward-requests'),
      projectService.listForPanelist(id),
      loadOnboardingCatalog(),
    ])
    const requests = (requestData.requests ?? []).map(mapRewardRequest)
    const answers = resolvePanelistAnswers(detail.answers ?? [], catalog)
    return mapPanelistDetail(
      detail.panelist,
      answers,
      requests,
      assignments,
      buildOnboardingAnswers(answers, catalog),
    )
  },
  async update(id: string, input: UpdatePanelistInput): Promise<void> {
    await apiRequest(`/admin/panelists/${id}`, {
      method: 'PUT',
      body: toPanelistUpdateBody(input),
    })
  },
  async activate(id: string) {
    await apiRequest(`/admin/panelists/${id}`, {
      method: 'PUT',
      body: { status: 'active' },
    })
  },
  async deactivate(id: string) {
    await apiRequest(`/admin/panelists/${id}`, {
      method: 'PUT',
      body: { status: 'inactive' },
    })
  },
  async additionalProfiles(id: string) {
    const data = await apiRequest<unknown>(`/admin/panelists/${id}/additional-profiles`)
    return mapAdditionalProfiles(data, id)
  },
  async profileQuestions(profileType: string) {
    const data = await apiRequest<unknown>(`/profile-questions${toSearch({ profile_type: profileType })}`, {
      auth: false,
    })
    return mapProfileQuestions(data)
  },
  async onboardingQuestions() {
    return fetchOnboardingCatalog()
  },
  /**
   * GET /admin/panelists applies `q` (name, email, or phone), `status`, and `answers` before `page` and `limit`.
   * `answers` is a JSON array; the API combines every object with AND.
   */
  async listForAssignment(query: {
    search?: string
    page?: number
    pageSize?: number
    filters?: QuestionnaireFilter[]
  }): Promise<PaginatedResult<Panelist>> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 8
    const filters = activeQuestionnaireFilters(query.filters ?? [])
    const catalog = filters.length ? await fetchOnboardingCatalog() : []
    const answers = toPanelistAnswerQuery(filters, catalog)
    const data = await apiRequest<ApiPanelistListData>(
      `/admin/panelists${toSearch({
        q: query.search,
        status: 'active',
        page,
        limit: pageSize,
        answers: answers.length ? JSON.stringify(answers) : undefined,
      })}`,
    )
    return {
      data: (data.items ?? []).map((item) => mapPanelist(item)),
      total: data.total ?? 0,
      page: data.page ?? page,
      pageSize: data.limit ?? pageSize,
    }
  },
  async credit(id: string, points: number, remark?: string) {
    if (!Number.isInteger(points) || points <= 0) {
      throw new ApiError('Enter a positive number of points.', 422)
    }
    await apiRequest('/admin/rewards/credit', {
      method: 'POST',
      body: {
        user_id: Number(id),
        reward_points: points,
        remark: remark || 'Manual credit',
        reward_type: 'manual',
      },
    })
  },
}

export const PROFILE_SCAN_LIMIT = 500

/** Demographics only exist on GET /admin/panelists/{id}, so each panelist needs its own request. */
export async function enrichPanelists(rows: Panelist[], limit = PROFILE_SCAN_LIMIT) {
  const subset = [...rows].sort((a, b) => b.registeredAt.localeCompare(a.registeredAt)).slice(0, limit)
  const catalog = await loadOnboardingCatalog()
  const enriched = await mapWithConcurrency(subset, 6, async (item) => {
    try {
      const detail = await apiRequest<ApiPanelistDetailData>(`/admin/panelists/${item.id}`)
      return mapPanelist(detail.panelist, resolvePanelistAnswers(detail.answers ?? [], catalog))
    } catch {
      return item
    }
  })
  return { rows: enriched, scanned: subset.length }
}

let catalogTask: Promise<OnboardingQuestion[]> | null = null

function fetchOnboardingCatalog() {
  catalogTask ??= apiRequest<unknown>('/questions', { auth: false })
    .then(mapOnboardingCatalog)
    .catch((error: unknown) => {
      catalogTask = null
      return Promise.reject(error)
    })
  return catalogTask
}

function loadOnboardingCatalog() {
  return fetchOnboardingCatalog().catch(() => [] as OnboardingQuestion[])
}

export async function listAllPanelists(search?: string, status?: string) {
  const rows: Panelist[] = []
  let page = 1
  let total = Infinity
  while (rows.length < total && page <= 20) {
    const data = await apiRequest<ApiPanelistListData>(
      `/admin/panelists${toSearch({ q: search, status, page, limit: 100 })}`,
    )
    total = data.total ?? data.items?.length ?? 0
    rows.push(...(data.items ?? []).map((item) => mapPanelist(item)))
    if (!data.items?.length) break
    page += 1
  }
  return rows
}

function applyClientFilters(rows: Panelist[], query: PanelistListQuery) {
  return rows.filter((item) => {
    if (query.verifiedOnly && !item.isVerified) return false
    if (query.status && query.status !== 'all' && item.status !== query.status) return false
    if (query.gender && query.gender !== 'all' && item.gender !== query.gender) return false
    if (query.ageRange && query.ageRange !== 'all' && item.ageRange !== query.ageRange) return false
    if (query.registeredFrom && item.registeredAt.slice(0, 10) < query.registeredFrom) return false
    if (query.registeredTo && item.registeredAt.slice(0, 10) > query.registeredTo) return false
    if (query.search) {
      const haystack = `${item.firstName} ${item.lastName} ${item.email} ${item.phone}`.toLowerCase()
      if (!haystack.includes(query.search.toLowerCase())) return false
    }
    return true
  })
}

function mapSortKey(sortBy?: string) {
  if (sortBy === 'lastName' || sortBy === 'rewardPoints' || sortBy === 'registeredAt') return sortBy
  return sortBy
}
