import { Eye, Info, Pencil, Power, PowerOff } from 'lucide-react'
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
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
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

  function actions(panelist: Panelist) {
    return (
      <RowActions>
        <DropdownMenuItem asChild>
          <Link to={`/admin/panelists/${panelist.id}`}>
            <Eye className="size-4" />
            View profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setEditing(panelist)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {panelist.status === 'active' ? (
          <DropdownMenuItem variant="destructive" disabled={statusPending} onClick={() => setDeactivating(panelist)}>
            <PowerOff className="size-4" />
            Deactivate
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled={statusPending} onClick={() => activate.mutate(panelist.id)}>
            <Power className="size-4" />
            Activate
          </DropdownMenuItem>
        )}
      </RowActions>
    )
  }

  return (
    <div>
      <PageHeader
        title="Panelists"
        description="Search, filter and manage panel members, their verification and account status."
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
        emptyTitle="No panelists found"
        emptyDescription="Try a different search or clear the current filters."
        page={list.data?.page}
        pageSize={list.data?.pageSize}
        total={list.data?.total ?? 0}
        onPageChange={setPage}
      >
        {list.data?.notice ? (
          <div className="flex gap-2.5 border-b bg-info-foreground/50 px-4 py-2.5 text-xs leading-5 text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0 text-info" />
            {list.data.notice}
          </div>
        ) : null}
        <div className="divide-y md:hidden">
          {rows.map((panelist) => (
            <div key={panelist.id} className="flex items-start gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <Link to={`/admin/panelists/${panelist.id}`} className="block truncate font-medium hover:text-primary">
                  {fullName(panelist.firstName, panelist.lastName) || panelist.email}
                </Link>
                <p className="truncate text-xs text-muted-foreground">{panelist.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <PanelistStatusBadge status={panelist.status} />
                  <VerificationBadge verified={panelist.isVerified} />
                </div>
                <p className="tabular mt-2 text-xs text-muted-foreground">
                  Joined {formatDate(panelist.registeredAt)} · {formatNumber(panelist.rewardPoints)} pts
                </p>
              </div>
              {actions(panelist)}
            </div>
          ))}
        </div>
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader label="Panelist" column="lastName" sortBy={filters.sortBy} sortDir={filters.sortDir} onSort={sort} />
                </TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>
                  <SortableHeader
                    label="Registered"
                    column="registeredAt"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={sort}
                  />
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>
                  <SortableHeader
                    label="Points"
                    column="rewardPoints"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={sort}
                  />
                </TableHead>
                <TableHead className="w-12 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((panelist) => (
                <TableRow key={panelist.id}>
                  <TableCell>
                    <Link to={`/admin/panelists/${panelist.id}`} className="font-medium hover:text-primary">
                      {fullName(panelist.firstName, panelist.lastName) || '—'}
                    </Link>
                    <p className="text-xs text-muted-foreground">{panelist.email}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {panelist.gender ? GENDER_LABELS[panelist.gender] : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {panelist.ageRange ? AGE_RANGE_LABELS[panelist.ageRange] : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(panelist.registeredAt)}</TableCell>
                  <TableCell>
                    <PanelistStatusBadge status={panelist.status} />
                  </TableCell>
                  <TableCell>
                    <VerificationBadge verified={panelist.isVerified} />
                  </TableCell>
                  <TableCell className="font-medium">{formatNumber(panelist.rewardPoints)}</TableCell>
                  <TableCell className="text-right">{actions(panelist)}</TableCell>
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
        description={`${deactivating ? fullName(deactivating.firstName, deactivating.lastName) || deactivating.email : 'This panelist'} will be marked inactive. You can reactivate them at any time.`}
        confirmLabel="Deactivate"
        destructive
        pending={deactivate.isPending}
        onConfirm={() => deactivating && deactivate.mutate(deactivating.id)}
      />
    </div>
  )
}
