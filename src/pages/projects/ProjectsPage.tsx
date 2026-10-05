import { Ban, CheckCircle2, ExternalLink, Eye, Pencil, Plus, Trash2, UsersRound } from 'lucide-react'
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
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
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
  const completeBusy = complete.isPending
  const statusBusy = updateStatus.isPending

  function actions(item: ProjectAssignment) {
    const active = item.status === 'active'
    return (
      <RowActions>
        <DropdownMenuItem onClick={() => setViewingId(item.id)}>
          <Eye className="size-4" />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setEditing(item)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        {item.surveyUrl ? (
          <DropdownMenuItem asChild>
            <a href={item.surveyUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Open survey link
            </a>
          </DropdownMenuItem>
        ) : null}
        {active ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={completeBusy} onClick={() => setCompleting(item)}>
              <CheckCircle2 className="size-4" />
              Mark complete
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={statusBusy}
              onClick={() => setStatusChange({ assignment: item, status: 'quota_full' })}
            >
              <UsersRound className="size-4" />
              Mark quota full
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={statusBusy}
              onClick={() => setStatusChange({ assignment: item, status: 'terminate' })}
            >
              <Ban className="size-4" />
              Terminate
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled={remove.isPending} onClick={() => setRemoving(item)}>
          <Trash2 className="size-4" />
          Remove
        </DropdownMenuItem>
      </RowActions>
    )
  }

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
        title="Survey Assignments"
        description="Assign survey links to panelists. Marking an assignment complete credits its reward points once."
        crumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Survey Assignments' }]}
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
                placeholder="Search survey, URL, panelist or email"
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
        emptyTitle="No survey assignments found"
        emptyDescription="Assign a survey link and reward points to one or more panelists, or adjust the filters."
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
        <div className="divide-y md:hidden">
          {rows.map((item) => (
            <div key={item.id} className="flex items-start gap-3 px-4 py-3.5">
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setViewingId(item.id)}>
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{item.projectName}</p>
                  <AssignmentStatusBadge status={item.status} />
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.panelistName} · {item.panelistEmail || `ID ${item.panelistId}`}
                </p>
                <p className="tabular mt-1.5 text-xs text-muted-foreground">
                  {formatNumber(item.rewardPoints)} pts · Assigned {formatDate(item.assignedAt)}
                </p>
              </button>
              {actions(item)}
            </div>
          ))}
        </div>
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader
                    label="Survey"
                    column="projectName"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={sort}
                  />
                </TableHead>
                <TableHead>Panelist</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <SortableHeader
                    label="Points"
                    column="rewardPoints"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={sort}
                  />
                </TableHead>
                <TableHead>
                  <SortableHeader
                    label="Assigned"
                    column="assignedAt"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={sort}
                  />
                </TableHead>
                <TableHead>Completed</TableHead>
                <TableHead className="w-12 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-[18rem]">
                    <button
                      type="button"
                      className="block max-w-full truncate text-left font-medium hover:text-primary"
                      onClick={() => setViewingId(item.id)}
                    >
                      {item.projectName}
                    </button>
                    <p className="truncate text-xs text-muted-foreground" title={item.surveyUrl}>
                      {item.surveyUrl}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p>{item.panelistName}</p>
                    <p className="text-xs text-muted-foreground">{item.panelistEmail || `ID ${item.panelistId}`}</p>
                  </TableCell>
                  <TableCell>
                    <AssignmentStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{formatNumber(item.rewardPoints)}</p>
                    <div className="mt-1">
                      <SurveyRewardBadge status={item.status} />
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(item.assignedAt)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.completedAt ? formatDate(item.completedAt) : '—'}
                  </TableCell>
                  <TableCell className="text-right">{actions(item)}</TableCell>
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
        title="Mark this survey complete?"
        description={
          completing ? (
            <>
              <span className="block">
                {completing.panelistName} will be credited{' '}
                <span className="font-semibold text-foreground">{formatNumber(completing.rewardPoints)} points</span>{' '}
                for “{completing.projectName}”.
              </span>
              <span className="mt-2 block">
                The API credits a completed survey only once, so this can’t be used to award points again.
              </span>
            </>
          ) : undefined
        }
        confirmLabel="Mark complete"
        pending={completeBusy}
        onConfirm={() => {
          if (!completing || completeBusy || completing.status !== 'active') return
          complete.mutate(completing.id)
        }}
      />

      <ConfirmDialog
        open={Boolean(statusChange)}
        onOpenChange={(open) => !open && !statusBusy && setStatusChange(null)}
        title={statusChange?.status === 'terminate' ? 'Terminate this assignment?' : 'Mark this assignment quota full?'}
        description={
          statusChange
            ? `${statusChange.assignment.panelistName} · ${statusChange.assignment.projectName}. No reward points will be credited.`
            : undefined
        }
        confirmLabel={statusChange?.status === 'terminate' ? 'Terminate' : 'Mark quota full'}
        destructive={statusChange?.status === 'terminate'}
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
            ? `“${removing.projectName}” will be permanently removed for ${removing.panelistName}. This can’t be undone.`
            : 'This survey assignment will be permanently removed.'
        }
        confirmLabel="Remove"
        destructive
        pending={remove.isPending}
        onConfirm={() => removing && !remove.isPending && remove.mutate(removing.id)}
      />
    </div>
  )
}
