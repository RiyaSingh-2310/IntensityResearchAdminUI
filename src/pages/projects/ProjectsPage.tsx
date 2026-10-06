import { ExternalLink, Plus } from 'lucide-react'
import { useState } from 'react'
import { DataTable } from '@/components/common/DataTable'
import { FilterToolbar } from '@/components/common/FilterToolbar'
import { RowActions } from '@/components/common/RowActions'
import { SearchField } from '@/components/common/SearchField'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { SortableHeader } from '@/components/shared/SortableHeader'
import { AssignmentStatusBadge, SurveyRewardBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useListQuery } from '@/hooks/useListQuery'
import {
  useAssignPanelists,
  useCompleteAssignment,
  useProjectList,
  useRemoveProject,
  useUpdateProject,
  useUpdateSurveyStatus,
} from '@/hooks/useProjects'
import { getErrorMessage } from '@/lib/errors'
import { formatDate, formatNumber } from '@/lib/format'
import { digitsOnly } from '@/lib/validators'
import { ASSIGNMENT_STATUS_LABELS } from '@/lib/labels'
import type { AssignmentStatus, ProjectAssignment, ProjectListQuery } from '@/types'
import { AssignPanelistsDialog } from './AssignPanelistsDialog'
import { AssignProjectDialog } from './AssignProjectDialog'
import { AssignmentDetailsSheet } from './AssignmentDetailsSheet'

const defaultQuery: ProjectListQuery = {
  page: 1,
  pageSize: 10,
  sortBy: 'assignedAt',
  sortDir: 'desc',
  status: 'all',
}

export function ProjectsPage() {
  const { search, setSearch, filters, setFilters, query, reset, sort, setPage } = useListQuery(defaultQuery)
  const list = useProjectList(query)
  const [filterOpen, setFilterOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<ProjectAssignment | null>(null)
  const [completing, setCompleting] = useState<ProjectAssignment | null>(null)
  const [statusChange, setStatusChange] = useState<{
    assignment: ProjectAssignment
    status: Extract<AssignmentStatus, 'terminate' | 'quota_full'>
  } | null>(null)
  const [removing, setRemoving] = useState<ProjectAssignment | null>(null)
  const assign = useAssignPanelists(() => setAssignOpen(false))
  const update = useUpdateProject(() => setEditing(null))
  const complete = useCompleteAssignment(() => setCompleting(null))
  const updateStatus = useUpdateSurveyStatus(() => setStatusChange(null))
  const remove = useRemoveProject(() => setRemoving(null))
  const rows = list.data?.data ?? []
  const filtered = Boolean(query.search || query.panelistId || (query.status && query.status !== 'all'))
  const completeBusy = complete.isPending
  const statusBusy = updateStatus.isPending

  function renderFilters() {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          value={filters.status ?? 'all'}
          onValueChange={(value) =>
            setFilters((current) => ({ ...current, page: 1, status: value as AssignmentStatus | 'all' }))
          }
        >
          <SelectTrigger className="w-full" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(ASSIGNMENT_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          inputMode="numeric"
          placeholder="Panelist ID"
          aria-label="Filter by panelist ID"
          value={filters.panelistId ?? ''}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              page: 1,
              panelistId: digitsOnly(event.target.value, 12) || undefined,
            }))
          }
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Assigned Projects"
        description="Assign survey URLs to panelists, then mark complete to credit reward points once."
        crumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Assigned Projects' }]}
        actions={
          <Button onClick={() => setAssignOpen(true)}>
            <Plus className="size-4" />
            Assign panelists
          </Button>
        }
      />

      <DataTable
        toolbar={
          <FilterToolbar
            search={
              <SearchField
                value={search}
                onChange={(value) => {
                  setSearch(value)
                  setFilters((current) => ({ ...current, page: 1 }))
                }}
                placeholder="Search survey, URL, panelist, or email"
                searching={search !== query.search}
              />
            }
            renderFilters={renderFilters}
            mobileOpen={filterOpen}
            onMobileOpenChange={setFilterOpen}
            onClear={reset}
          />
        }
        loading={list.isLoading}
        error={list.isError ? getErrorMessage(list.error) : undefined}
        onRetry={() => list.refetch()}
        emptyTitle={filtered ? 'No matching assignments.' : 'No survey assignments yet.'}
        emptyDescription={
          filtered
            ? 'Try a different search or clear the current filters.'
            : 'Assign a survey URL and reward points to one or more panelists. Completing an assignment credits those points once.'
        }
        emptyAction={
          <Button onClick={() => setAssignOpen(true)}>
            <Plus className="size-4" />
            Assign panelists
          </Button>
        }
        page={list.data?.page}
        pageSize={list.data?.pageSize}
        total={list.data?.total ?? 0}
        onPageChange={setPage}
      >
        <div className="space-y-3 p-4 md:hidden">
          {rows.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full rounded-2xl border px-4 py-3 text-left"
              onClick={() => setViewingId(item.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.projectName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.panelistName} · {item.panelistEmail || `ID ${item.panelistId}`}
                  </p>
                </div>
                <AssignmentStatusBadge status={item.status} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatDate(item.assignedAt)} · {formatNumber(item.rewardPoints)} pts
              </p>
            </button>
          ))}
        </div>
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader
                    label="Survey / project"
                    column="projectName"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={sort}
                  />
                </TableHead>
                <TableHead>Panelist</TableHead>
                <TableHead>Panelist ID</TableHead>
                <TableHead className="hidden lg:table-cell">Survey URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reward points</TableHead>
                <TableHead>Survey reward</TableHead>
                <TableHead>Assigned date</TableHead>
                <TableHead>Completed date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.projectName}</TableCell>
                  <TableCell>
                    <div>
                      <p>{item.panelistName}</p>
                      <p className="text-xs text-muted-foreground">{item.panelistEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>{item.panelistId}</TableCell>
                  <TableCell className="hidden max-w-[220px] truncate lg:table-cell" title={item.surveyUrl}>
                    {item.surveyUrl}
                  </TableCell>
                  <TableCell>
                    <AssignmentStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>{formatNumber(item.rewardPoints)}</TableCell>
                  <TableCell>
                    <SurveyRewardBadge status={item.status} />
                  </TableCell>
                  <TableCell>{formatDate(item.assignedAt)}</TableCell>
                  <TableCell>{item.completedAt ? formatDate(item.completedAt) : '—'}</TableCell>
                  <TableCell className="text-right">
                    <RowActions>
                      <DropdownMenuItem onClick={() => setViewingId(item.id)}>View</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditing(item)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAssignOpen(true)}>Assign</DropdownMenuItem>
                      {item.status === 'active' ? (
                        <DropdownMenuItem
                          disabled={completeBusy}
                          onClick={() => !completeBusy && setCompleting(item)}
                        >
                          Mark completed
                        </DropdownMenuItem>
                      ) : null}
                      {item.status === 'complete' ? (
                        <DropdownMenuItem onClick={() => setViewingId(item.id)}>View reward details</DropdownMenuItem>
                      ) : null}
                      {item.status === 'active' ? (
                        <DropdownMenuItem
                          disabled={statusBusy}
                          onClick={() => !statusBusy && setStatusChange({ assignment: item, status: 'terminate' })}
                        >
                          Terminate
                        </DropdownMenuItem>
                      ) : null}
                      {item.status === 'active' ? (
                        <DropdownMenuItem
                          disabled={statusBusy}
                          onClick={() => !statusBusy && setStatusChange({ assignment: item, status: 'quota_full' })}
                        >
                          Quota full
                        </DropdownMenuItem>
                      ) : null}
                      {item.status === 'active' && item.surveyUrl ? (
                        <DropdownMenuItem asChild>
                          <a href={item.surveyUrl} target="_blank" rel="noopener noreferrer">
                            Open URL
                            <ExternalLink className="size-3.5" />
                          </a>
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem onClick={() => setRemoving(item)}>Remove</DropdownMenuItem>
                    </RowActions>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DataTable>

      <AssignmentDetailsSheet
        assignmentId={viewingId}
        completePending={completeBusy}
        onOpenChange={(open) => !open && setViewingId(null)}
        onMarkComplete={(assignment) => {
          if (completeBusy || assignment.status !== 'active') return
          setCompleting(assignment)
        }}
      />

      <AssignPanelistsDialog
        open={assignOpen}
        pending={assign.isPending}
        onOpenChange={setAssignOpen}
        onSubmit={(input) => {
          if (assign.isPending) return
          assign.mutate(input)
        }}
      />

      <AssignProjectDialog
        open={Boolean(editing)}
        assignment={editing}
        pending={update.isPending}
        onOpenChange={(open) => !open && setEditing(null)}
        onSubmit={(input) => editing && !update.isPending && update.mutate({ id: editing.id, input })}
      />

      <ConfirmDialog
        open={Boolean(completing)}
        onOpenChange={(open) => !open && !completeBusy && setCompleting(null)}
        title="Mark this survey completed?"
        description={
          completing ? (
            <>
              <span className="block">Panelist: {completing.panelistName}</span>
              <span className="block">Email: {completing.panelistEmail || '—'}</span>
              <span className="block">Survey: {completing.projectName}</span>
              <span className="block">Survey ID: {completing.id}</span>
              <span className="block">Current status: {ASSIGNMENT_STATUS_LABELS[completing.status]}</span>
              <span className="block">Reward points: {formatNumber(completing.rewardPoints)}</span>
              <span className="mt-2 block">
                Marking this survey as completed will trigger the configured survey reward. The reward is credited
                once by the completion API and is not sent as a separate credit.
              </span>
            </>
          ) : undefined
        }
        confirmLabel="Mark completed"
        pending={completeBusy}
        onConfirm={() => {
          if (!completing || completeBusy || completing.status !== 'active') return
          complete.mutate(completing.id)
        }}
      />

      <ConfirmDialog
        open={Boolean(statusChange)}
        onOpenChange={(open) => !open && !statusBusy && setStatusChange(null)}
        title={
          statusChange?.status === 'terminate' ? 'Terminate this assignment?' : 'Mark this assignment quota full?'
        }
        description={
          statusChange
            ? `${statusChange.assignment.panelistName} · ${statusChange.assignment.projectName}. Reward points will not be credited.`
            : undefined
        }
        confirmLabel={statusChange?.status === 'terminate' ? 'Terminate' : 'Quota full'}
        pending={statusBusy}
        onConfirm={() => {
          if (!statusChange || statusBusy) return
          updateStatus.mutate({ id: statusChange.assignment.id, status: statusChange.status })
        }}
      />

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && !remove.isPending && setRemoving(null)}
        title="Remove this assignment?"
        description={
          removing
            ? `${removing.projectName} for ${removing.panelistName} (survey ID ${removing.id}) will be removed.`
            : 'This survey assignment will be removed.'
        }
        confirmLabel="Remove"
        destructive
        pending={remove.isPending}
        onConfirm={() => removing && !remove.isPending && remove.mutate(removing.id)}
      />
    </div>
  )
}
