import { Download } from 'lucide-react'
import { useState } from 'react'
import { DateRangePicker } from '@/components/common/DateRangePicker'
import { DataTable } from '@/components/common/DataTable'
import { FilterToolbar } from '@/components/common/FilterToolbar'
import { SearchField } from '@/components/common/SearchField'
import { PageHeader } from '@/components/shared/PageHeader'
import { SortableHeader } from '@/components/shared/SortableHeader'
import { RequestStatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useListQuery } from '@/hooks/useListQuery'
import { usePanelistOptions } from '@/hooks/usePanelists'
import { useExportRewardHistory, useRewardHistory } from '@/hooks/useRewardHistory'
import { useRewardTypes } from '@/hooks/useRewards'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime, formatNumber } from '@/lib/format'
import { REQUEST_STATUS_LABELS, paymentMethodLabel } from '@/lib/labels'
import type { RewardHistoryQuery, RewardRequestStatus } from '@/types'

const defaultQuery: RewardHistoryQuery = {
  page: 1,
  pageSize: 10,
  sortBy: 'transactionDate',
  sortDir: 'desc',
  status: 'all',
  rewardType: 'all',
}

export function RewardHistoryPage() {
  const { search, setSearch, filters, setFilters, query, reset, setPage, sort } = useListQuery(defaultQuery)
  const list = useRewardHistory(query)
  const types = useRewardTypes()
  const panelists = usePanelistOptions()
  const exportCsv = useExportRewardHistory(query)
  const filtered = Boolean(
    query.search ||
      query.panelistId ||
      query.dateFrom ||
      query.dateTo ||
      (query.status && query.status !== 'all') ||
      (query.rewardType && query.rewardType !== 'all'),
  )
  const [filterOpen, setFilterOpen] = useState(false)
  const rows = list.data?.data ?? []

  function renderFilters() {
    return (
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Select
          value={filters.panelistId ?? 'all'}
          onValueChange={(value) =>
            setFilters((current) => ({ ...current, page: 1, panelistId: value === 'all' ? undefined : value }))
          }
        >
          <SelectTrigger className="w-full" aria-label="Filter by panelist">
            <SelectValue placeholder="Panelist" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All panelists</SelectItem>
            {(panelists.data ?? []).map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.status ?? 'all'}
          onValueChange={(value) =>
            setFilters((current) => ({ ...current, page: 1, status: value as RewardRequestStatus | 'all' }))
          }
        >
          <SelectTrigger className="w-full" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangePicker
          from={filters.dateFrom}
          to={filters.dateTo}
          onApply={({ from, to }) =>
            setFilters((current) => ({ ...current, page: 1, dateFrom: from, dateTo: to }))
          }
          onClear={() =>
            setFilters((current) => ({ ...current, page: 1, dateFrom: undefined, dateTo: undefined }))
          }
        />
        <Select
          value={filters.rewardType ?? 'all'}
          onValueChange={(value) => setFilters((current) => ({ ...current, page: 1, rewardType: value }))}
        >
          <SelectTrigger className="w-full" aria-label="Filter by payout method">
            <SelectValue placeholder="Payout method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All methods</SelectItem>
            {(types.data ?? []).map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Reward History"
        description="Every approved, rejected, and pending redemption in one ledger."
        crumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Reward History' }]}
        actions={
          <Button variant="outline" onClick={() => exportCsv.mutate()} disabled={exportCsv.isPending || !list.data?.total}>
            <Download className="size-4" />
            {exportCsv.isPending ? 'Exporting…' : 'Export CSV'}
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
                placeholder="Search panelist, reward, or request ID"
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
        emptyTitle="No reward history found."
        emptyDescription={filtered ? 'Try a different search or clear the current filters.' : undefined}
        page={list.data?.page}
        pageSize={list.data?.pageSize}
        total={list.data?.total ?? 0}
        onPageChange={setPage}
      >
        <div className="space-y-3 p-4 md:hidden">
          {rows.map((item) => (
            <div key={item.id} className="rounded-2xl border px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{item.panelistName}</p>
                  <p className="text-xs text-muted-foreground">{paymentMethodLabel(item.rewardName)}</p>
                </div>
                <RequestStatusBadge status={item.status} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatDateTime(item.transactionDate)} · {formatNumber(item.points)} pts · {item.requestId}
              </p>
              {item.comment ? <p className="mt-1 text-xs text-muted-foreground">{item.comment}</p> : null}
            </div>
          ))}
        </div>
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Panelist</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>
                  <SortableHeader label="Points" column="points" sortBy={filters.sortBy} sortDir={filters.sortDir} onSort={sort} />
                </TableHead>
                <TableHead>
                  <SortableHeader
                    label="Transaction date"
                    column="transactionDate"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={sort}
                  />
                </TableHead>
                <TableHead>Actioned</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Request ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.panelistName}</p>
                    {item.panelistEmail ? <p className="text-xs text-muted-foreground">{item.panelistEmail}</p> : null}
                  </TableCell>
                  <TableCell>{paymentMethodLabel(item.rewardName)}</TableCell>
                  <TableCell>{formatNumber(item.points)}</TableCell>
                  <TableCell>{formatDateTime(item.transactionDate)}</TableCell>
                  <TableCell>{item.actionDate ? formatDateTime(item.actionDate) : '—'}</TableCell>
                  <TableCell>
                    <RequestStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>{item.requestId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DataTable>
    </div>
  )
}
