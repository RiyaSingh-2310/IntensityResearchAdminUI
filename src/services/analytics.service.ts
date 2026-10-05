import { apiRequest, toSearch } from '@/lib/apiClient'
import { buildDashboard, buildPanelistAnalytics, buildRewardAnalytics, mapPanelist, mapRewardRequest } from '@/lib/mappers'
import { enrichPanelists } from '@/services/panelist.service'
import type { DashboardAnalytics, PanelistAnalytics, RewardAnalytics } from '@/types'
import type { ApiPanelistListData, ApiRewardRequestListData, ApiSurveyListData } from '@/types/api'

async function loadSummaries() {
  const [panelists, requestData, activeSurveys] = await Promise.all([
    listPanelists(),
    apiRequest<ApiRewardRequestListData>('/admin/reward-requests'),
    apiRequest<ApiSurveyListData>(`/admin/surveys${toSearch({ status: 'active', page: 1, limit: 1 })}`),
  ])
  const requests = (requestData.requests ?? []).map(mapRewardRequest)
  return {
    panelists: panelists.rows,
    requests,
    total: panelists.total,
    activeProjects: activeSurveys.total ?? 0,
  }
}

async function listPanelists() {
  const rows: ReturnType<typeof mapPanelist>[] = []
  let page = 1
  let total = Infinity
  while (rows.length < total && page <= 20) {
    const data = await apiRequest<ApiPanelistListData>(`/admin/panelists${toSearch({ page, limit: 100 })}`)
    total = data.total ?? data.items?.length ?? 0
    rows.push(...(data.items ?? []).map((item) => mapPanelist(item)))
    if (!data.items?.length) break
    page += 1
  }
  return { rows, total: Number.isFinite(total) ? total : rows.length }
}

export const analyticsService = {
  async dashboard(): Promise<DashboardAnalytics> {
    const { panelists, requests, total, activeProjects } = await loadSummaries()
    return { ...buildDashboard(panelists, requests), totalPanelists: total, activeProjects }
  },
  async panelists(): Promise<PanelistAnalytics> {
    const { panelists, total } = await loadSummaries()
    const enriched = await enrichPanelists(panelists)
    const analytics = buildPanelistAnalytics(enriched.rows, total)
    // Registration trend only needs list data, so it always covers every panelist.
    const full = buildPanelistAnalytics(panelists, total)
    return { ...analytics, registrationTrend: full.registrationTrend }
  },
  async rewards(): Promise<RewardAnalytics> {
    const { panelists, requests } = await loadSummaries()
    return buildRewardAnalytics(requests, panelists)
  },
}
