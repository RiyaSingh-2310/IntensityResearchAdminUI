import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable } from '@/components/common/DataTable'
import { DateRangePicker } from '@/components/common/DateRangePicker'
import { FilterToolbar } from '@/components/common/FilterToolbar'
import { RowActions } from '@/components/common/RowActions'
import { SearchField } from '@/components/common/SearchField'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { SortableHeader } from '@/components/shared/SortableHeader'
import { PanelistStatusBadge, VerificationBadge } from '@/components/shared/StatusBadge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import {
  useActivatePanelist,
  useDeactivatePanelist,
  usePanelistList,
  useUpdatePanelist,
} from '@/hooks/usePanelists'
import { useListQuery } from '@/hooks/useListQuery'
import { getErrorMessage } from '@/lib/errors'
import { formatDate, formatNumber } from '@/lib/format'
import { AGE_RANGE_LABELS, GENDER_LABELS, PANELIST_STATUS_LABELS, fullName } from '@/lib/labels'
import type { AgeRange, Gender, Panelist, PanelistListQuery, PanelistStatus } from '@/types'
import { PanelistEditDialog } from './PanelistEditDialog'

const defaultQuery: PanelistListQuery = {
  page: 1,
  pageSize: 10,
  sortBy: 'registeredAt',
  sortDir: 'desc',
  status: 'all',
  gender: 'all',
  ageRange: 'all',
}

export function PanelistsPage() {
  const { search, setSearch, filters, setFilters, query, reset, sort, setPage } = useListQuery(defaultQuery)
  const list = usePanelistList(query)
  const [filterOpen, setFilterOpen] = useState(false)
  const [editing, setEditing] = useState<Panelist | null>(null)
  const [deactivating, setDeactivating] = useState<Panelist | null>(null)
  const update = useUpdatePanelist(() => setEditing(null))
  const activate = useActivatePanelist()
  const deactivate = useDeactivatePanelist(() => setDeactivating(null))

  function renderFilters() {
    return (
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Select
          value={filters.status ?? 'all'}
          onValueChange={(value) =>
            setFilters((current) => ({ ...current, page: 1, status: value as PanelistStatus | 'all' }))
          }
        >
          <SelectTrigger className="w-full" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(PANELIST_STATUS_LABELS)
              .filter(([value]) => value !== 'pending')
              .map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.gender ?? 'all'}
          onValueChange={(value) =>
            setFilters((current) => ({ ...current, page: 1, gender: value as Gender | 'all' }))
          }
        >
          <SelectTrigger className="w-full" aria-label="Filter by gender">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All genders</SelectItem>
            {Object.entries(GENDER_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.ageRange ?? 'all'}
          onValueChange={(value) =>
            setFilters((current) => ({ ...current, page: 1, ageRange: value as AgeRange | 'all' }))
          }
        >
          <SelectTrigger className="w-full" aria-label="Filter by age range">
            <SelectValue placeholder="Age range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ages</SelectItem>
            {Object.entries(AGE_RANGE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangePicker
          from={filters.registeredFrom}
          to={filters.registeredTo}
          onApply={({ from, to }) =>
            setFilters((current) => ({
              ...current,
              page: 1,
              registeredFrom: from,
              registeredTo: to,
            }))
          }
          onClear={() =>
            setFilters((current) => ({
              ...current,
              page: 1,
              registeredFrom: undefined,
              registeredTo: undefined,
            }))
          }
        />
      </div>
    )
  }

  const rows = list.data?.data ?? []
  const statusPending = activate.isPending || deactivate.isPending

  return (
    <div>
      <PageHeader
        title="Panelists"
        description="Search, filter, and manage the research panel."
        crumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Panelists' }]}
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
                placeholder="Search name, email or phone"
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
        emptyTitle="No panelists found."
        emptyDescription="Try a different search or clear the current filters."
        page={list.data?.page}
        pageSize={list.data?.pageSize}
        total={list.data?.total ?? 0}
        onPageChange={setPage}
      >
        {list.data?.notice ? (
          <p className="border-b px-4 py-3 text-xs text-muted-foreground">{list.data.notice}</p>
        ) : null}
        <div className="space-y-3 p-4 md:hidden">
          {rows.map((panelist) => (
            <div key={panelist.id} className="rounded-2xl border px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/admin/panelists/${panelist.id}`} className="font-medium hover:text-primary">
                    {fullName(panelist.firstName, panelist.lastName) || panelist.email}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{panelist.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <PanelistStatusBadge status={panelist.status} />
                  <VerificationBadge verified={panelist.isVerified} />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatDate(panelist.registeredAt)} · {formatNumber(panelist.rewardPoints)} pts
              </p>
            </div>
          ))}
        </div>
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader label="Name" column="lastName" sortBy={filters.sortBy} sortDir={filters.sortDir} onSort={sort} />
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Age Range</TableHead>
                <TableHead>
                  <SortableHeader
                    label="Registration Date"
                    column="registeredAt"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={sort}
                  />
                </TableHead>
                <TableHead>Account status</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>
                  <SortableHeader
                    label="Reward Points"
                    column="rewardPoints"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={sort}
                  />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((panelist) => (
                <TableRow key={panelist.id}>
                  <TableCell className="font-medium">
                    <Link to={`/admin/panelists/${panelist.id}`} className="hover:text-primary">
                      {fullName(panelist.firstName, panelist.lastName) || '—'}
                    </Link>
                  </TableCell>
                  <TableCell>{panelist.email}</TableCell>
                  <TableCell>{panelist.gender ? GENDER_LABELS[panelist.gender] : '—'}</TableCell>
                  <TableCell>{panelist.ageRange ? AGE_RANGE_LABELS[panelist.ageRange] : '—'}</TableCell>
                  <TableCell>{formatDate(panelist.registeredAt)}</TableCell>
                  <TableCell>
                    <PanelistStatusBadge status={panelist.status} />
                  </TableCell>
                  <TableCell>
                    <VerificationBadge verified={panelist.isVerified} />
                  </TableCell>
                  <TableCell>{formatNumber(panelist.rewardPoints)}</TableCell>
                  <TableCell className="text-right">
                    <RowActions>
                      <DropdownMenuItem asChild>
                        <Link to={`/admin/panelists/${panelist.id}`}>View</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditing(panelist)}>Edit</DropdownMenuItem>
                      {panelist.status === 'active' ? (
                        <DropdownMenuItem disabled={statusPending} onClick={() => setDeactivating(panelist)}>
                          Deactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem disabled={statusPending} onClick={() => activate.mutate(panelist.id)}>
                          Activate
                        </DropdownMenuItem>
                      )}
                    </RowActions>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DataTable>

      <PanelistEditDialog
        open={Boolean(editing)}
        panelist={editing}
        pending={update.isPending}
        onOpenChange={(open) => !open && setEditing(null)}
        onSubmit={(input) => editing && update.mutate({ id: editing.id, input })}
      />

      <ConfirmDialog
        open={Boolean(deactivating)}
        onOpenChange={(open) => !open && !deactivate.isPending && setDeactivating(null)}
        title="Deactivate this panelist?"
        description={`${deactivating ? fullName(deactivating.firstName, deactivating.lastName) || deactivating.email : 'This member'} will be marked inactive until reactivated.`}
        confirmLabel="Deactivate"
        destructive
        pending={deactivate.isPending}
        onConfirm={() => deactivating && deactivate.mutate(deactivating.id)}
      />
    </div>
  )
}
