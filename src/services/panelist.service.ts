import { mapAdditionalProfiles, mapProfileQuestions } from '@/lib/additionalProfiles'
import { apiRequest, toSearch } from '@/lib/apiClient'
import { mapWithConcurrency } from '@/lib/async'
import { ApiError } from '@/lib/errors'
import {
  joinName,
  mapPanelist,
  mapPanelistDetail,
  mapRewardRequest,
  paginateRows,
  sortRows,
} from '@/lib/mappers'
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
    const [detail, requestData, assignments] = await Promise.all([
      apiRequest<ApiPanelistDetailData>(`/admin/panelists/${id}`),
      apiRequest<ApiRewardRequestListData>('/admin/reward-requests'),
      projectService.listForPanelist(id),
    ])
    const requests = (requestData.requests ?? []).map(mapRewardRequest)
    return mapPanelistDetail(detail.panelist, detail.answers ?? [], requests, assignments)
  },
  async update(id: string, input: UpdatePanelistInput): Promise<void> {
    await apiRequest(`/admin/panelists/${id}`, {
      method: 'PUT',
      body: {
        name: joinName(input.firstName, input.lastName),
        phone: input.phone,
        status: input.status,
        is_verified: input.isVerified ? 1 : 0,
      },
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
  const enriched = await mapWithConcurrency(subset, 6, async (item) => {
    try {
      const detail = await apiRequest<ApiPanelistDetailData>(`/admin/panelists/${item.id}`)
      return mapPanelist(detail.panelist, detail.answers ?? [])
    } catch {
      return item
    }
  })
  return { rows: enriched, scanned: subset.length }
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
