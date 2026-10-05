import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notify } from '@/lib/notify'
import { queryKeys } from '@/lib/query'
import { projectService } from '@/services/project.service'
import type { AssignPanelistsInput, AssignmentStatus, ProjectListQuery, UpdateSurveyInput } from '@/types'

export function useProjectList(query: ProjectListQuery) {
  return useQuery({
    queryKey: queryKeys.projects(query),
    queryFn: () => projectService.list(query),
  })
}

export function useSurveyAssignment(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => projectService.get(id),
    enabled: Boolean(id),
  })
}

function invalidateProjects(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['projects'] })
  void queryClient.invalidateQueries({ queryKey: ['panelists'] })
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
}

export function useAssignPanelists(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AssignPanelistsInput) => projectService.assignPanelists(input),
    onSuccess: (rows) => {
      notify.success(
        rows.length === 1 ? 'Survey assigned to 1 panelist.' : `Survey assigned to ${rows.length} panelists.`,
      )
      invalidateProjects(queryClient)
      onSuccess?.()
    },
    onError: (error) => notify.error(error),
  })
}

export function useUpdateProject(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSurveyInput }) =>
      projectService.update(id, input),
    onSuccess: () => {
      notify.success('Assignment updated successfully.')
      invalidateProjects(queryClient)
      onSuccess?.()
    },
    onError: (error) => notify.error(error),
  })
}

export function useCompleteAssignment(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectService.complete(id),
    onSuccess: () => {
      notify.success('Survey marked complete. The survey reward was credited once.')
      invalidateProjects(queryClient)
      onSuccess?.()
    },
    onError: (error) => notify.error(error),
  })
}

export function useUpdateSurveyStatus(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AssignmentStatus }) =>
      projectService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      notify.success(
        variables.status === 'terminate'
          ? 'Assignment terminated.'
          : variables.status === 'quota_full'
            ? 'Assignment marked quota full.'
            : 'Assignment status updated.',
      )
      invalidateProjects(queryClient)
      onSuccess?.()
    },
    onError: (error) => notify.error(error),
  })
}

export function useRemoveProject(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: projectService.remove,
    onSuccess: () => {
      notify.success('Assignment removed.')
      invalidateProjects(queryClient)
      onSuccess?.()
    },
    onError: (error) => notify.error(error),
  })
}
