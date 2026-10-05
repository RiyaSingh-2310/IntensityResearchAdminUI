import { ApiError } from '@/lib/errors'
import { apiRequest, toSearch } from '@/lib/apiClient'
import { mapSurveyAssignment, paginateRows, sortRows } from '@/lib/mappers'
import { isValidUrl } from '@/lib/validators'
import type {
  AssignPanelistsInput,
  AssignProjectInput,
  AssignmentStatus,
  PaginatedResult,
  ProjectAssignment,
  ProjectListQuery,
  UpdateSurveyInput,
} from '@/types'
import type {
  ApiSurveyAssignment,
  ApiSurveyCreateData,
  ApiSurveyCreateInput,
  ApiSurveyDetailData,
  ApiSurveyListData,
  ApiSurveyUpdateInput,
} from '@/types/api'

export const projectService = {
  async list(query: ProjectListQuery = {}): Promise<PaginatedResult<ProjectAssignment>> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    const sortNeedsFullSet = Boolean(
      query.sortBy && !(query.sortBy === 'assignedAt' && (query.sortDir ?? 'desc') === 'desc'),
    )
    const params = {
      q: query.search,
      status: query.status && query.status !== 'all' ? query.status : undefined,
      panelist_id: query.panelistId ? toNumericId(query.panelistId, 'panelist') : undefined,
    }
    if (sortNeedsFullSet) {
      const rows = await listAllSurveys(params)
      return paginateRows(sortRows(rows, mapSortKey(query.sortBy), query.sortDir), page, pageSize)
    }
    const data = await apiRequest<ApiSurveyListData>(
      `/admin/surveys${toSearch({
        ...params,
        page,
        limit: pageSize,
      })}`,
    )
    const rows = (data.items ?? []).map(mapSurveyAssignment)
    return {
      data: sortRows(rows, mapSortKey(query.sortBy), query.sortDir),
      total: data.total ?? 0,
      page: data.page ?? page,
      pageSize: data.limit ?? pageSize,
    }
  },
  async listForPanelist(panelistId: string): Promise<ProjectAssignment[]> {
    return listAllSurveys({ panelist_id: toNumericId(panelistId, 'panelist') })
  },
  async get(id: string): Promise<ProjectAssignment> {
    const data = await apiRequest<ApiSurveyDetailData>(`/admin/surveys/${toNumericId(id, 'assignment')}`)
    return mapSurveyAssignment(unwrapSurvey(data))
  },
  assign(input: AssignProjectInput): Promise<ProjectAssignment[]> {
    return projectService.assignPanelists({
      surveyName: input.projectName,
      surveyUrl: input.surveyUrl,
      panelistIds: [input.panelistId],
      rewardPoints: input.rewardPoints,
      remark: input.remark,
    })
  },
  async assignPanelists(input: AssignPanelistsInput): Promise<ProjectAssignment[]> {
    const panelistIds = uniqueNumericIds(input.panelistIds)
    if (!panelistIds.length) {
      throw new ApiError('Select at least one panelist.', 422)
    }
    const surveyUrl = input.surveyUrl.trim()
    if (!isValidUrl(surveyUrl)) {
      throw new ApiError('Enter a valid survey URL.', 422)
    }
    if (!Number.isInteger(input.rewardPoints) || input.rewardPoints <= 0) {
      throw new ApiError('Enter a positive whole number of reward points.', 422)
    }

    const body: ApiSurveyCreateInput = {
      survey_url: surveyUrl,
      reward_points: input.rewardPoints,
    }
    if (panelistIds.length === 1) body.panelist_id = panelistIds[0]
    else body.panelist_ids = panelistIds
    const surveyName = input.surveyName.trim()
    if (surveyName) body.survey_name = surveyName
    const remark = input.remark?.trim()
    if (remark) body.remark = remark

    const data = await apiRequest<ApiSurveyCreateData>('/admin/surveys', {
      method: 'POST',
      body,
    })
    return unwrapSurveys(data).map(mapSurveyAssignment)
  },
  async complete(id: string): Promise<ProjectAssignment> {
    const current = await projectService.get(id)
    if (current.status === 'complete') {
      throw new ApiError('This assignment is already complete. Reward points have already been issued.', 409)
    }
    return projectService.updateStatus(id, 'complete')
  },
  updateStatus(id: string, status: AssignmentStatus): Promise<ProjectAssignment> {
    return projectService.update(id, { status })
  },
  async update(id: string, input: UpdateSurveyInput): Promise<ProjectAssignment> {
    const body: ApiSurveyUpdateInput = {}
    if (input.surveyName !== undefined) body.survey_name = input.surveyName.trim()
    if (input.surveyUrl !== undefined) {
      const surveyUrl = input.surveyUrl.trim()
      if (!isValidUrl(surveyUrl)) throw new ApiError('Enter a valid survey URL.', 422)
      body.survey_url = surveyUrl
    }
    if (input.rewardPoints !== undefined) {
      if (!Number.isInteger(input.rewardPoints) || input.rewardPoints <= 0) {
        throw new ApiError('Enter a positive whole number of reward points.', 422)
      }
      body.reward_points = input.rewardPoints
    }
    if (input.status) body.status = input.status
    if (input.remark !== undefined) body.remark = input.remark.trim()

    const data = await apiRequest<ApiSurveyDetailData>(`/admin/surveys/${toNumericId(id, 'assignment')}`, {
      method: 'PUT',
      body,
    })
    return mapSurveyAssignment(unwrapSurvey(data))
  },
  async remove(id: string): Promise<{ ok: boolean }> {
    await apiRequest(`/admin/surveys/${toNumericId(id, 'assignment')}`, { method: 'DELETE' })
    return { ok: true }
  },
}

async function listAllSurveys(query: { q?: string; status?: string; panelist_id?: number }) {
  const rows: ProjectAssignment[] = []
  let page = 1
  let total = Infinity
  while (rows.length < total && page <= 20) {
    const data = await apiRequest<ApiSurveyListData>(
      `/admin/surveys${toSearch({ ...query, page, limit: 100 })}`,
    )
    total = data.total ?? data.items?.length ?? 0
    rows.push(...(data.items ?? []).map(mapSurveyAssignment))
    if (!data.items?.length) break
    page += 1
  }
  return rows
}

function unwrapSurvey(data: ApiSurveyDetailData | ApiSurveyAssignment): ApiSurveyAssignment {
  if ('survey' in data && data.survey) return data.survey
  if ('id' in data && data.id !== undefined) return data
  throw new ApiError('Unexpected survey assignment response.', 500)
}

function unwrapSurveys(data: ApiSurveyCreateData): ApiSurveyAssignment[] {
  if (data.surveys?.length) return data.surveys
  if (data.survey) return [data.survey]
  return []
}

function uniqueNumericIds(ids: string[]) {
  return [...new Set(ids.map((id) => toNumericId(id, 'panelist')))]
}

function toNumericId(id: string, label: string) {
  const value = Number(id)
  if (!Number.isInteger(value) || value <= 0) {
    throw new ApiError(`Invalid ${label} id.`, 422)
  }
  return value
}

function mapSortKey(sortBy?: string) {
  if (sortBy === 'projectName' || sortBy === 'rewardPoints' || sortBy === 'assignedAt') return sortBy
  return sortBy
}
