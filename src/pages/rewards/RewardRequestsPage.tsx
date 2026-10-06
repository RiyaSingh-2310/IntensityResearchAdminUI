import { useState } from 'react'
import { DataTable } from '@/components/common/DataTable'
import { FilterToolbar } from '@/components/common/FilterToolbar'
import { RowActions } from '@/components/common/RowActions'
import { SearchField } from '@/components/common/SearchField'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Field } from '@/components/shared/Field'
import { PageHeader } from '@/components/shared/PageHeader'
import { SortableHeader } from '@/components/shared/SortableHeader'
import { RequestStatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useListQuery } from '@/hooks/useListQuery'
import { useRewardRequestAction, useRewardRequestList } from '@/hooks/useRewardRequests'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime, formatNumber } from '@/lib/format'
import { REQUEST_STATUS_LABELS, paymentMethodLabel } from '@/lib/labels'
import type { RewardRequest, RewardRequestListQuery, RewardRequestStatus } from '@/types'

const defaultQuery: RewardRequestListQuery = {
  page: 1,
  pageSize: 10,
  sortBy: 'requestedAt',
  sortDir: 'desc',
  status: 'all',
}

type Decision = { request: RewardRequest; action: 'approve' | 'reject' }

export function RewardRequestsPage() {
  const { search, setSearch, filters, setFilters, query, reset, sort, setPage } = useListQuery(defaultQuery)
  const list = useRewardRequestList(query)
  const [filterOpen, setFilterOpen] = useState(false)
  const [viewing, setViewing] = useState<RewardRequest | null>(null)
  const [decision, setDecision] = useState<Decision | null>(null)
  const [comment, setComment] = useState('')
  const filtered = Boolean(query.search || (query.status && query.status !== 'all'))
  const mutate = useRewardRequestAction(() => {
    setDecision(null)
    setViewing(null)
  })
  const rows = list.data?.data ?? []

  function openDecision(request: RewardRequest, action: Decision['action']) {
    setComment('')
    setDecision({ request, action })
  }

  const copy = decision
    ? {
        title:
          decision.action === 'approve' ? 'Approve this request?' : 'Reject this request?',
        description: `${decision.request.panelistName} requested ${paymentMethodLabel(decision.request.rewardName)} for ${formatNumber(decision.request.points)} points.`,
        confirmLabel: decision.action === 'approve' ? 'Approve' : 'Reject',
      }
    : null

  function renderFilters() {
    return (
      <Select
        value={filters.status ?? 'all'}
        onValueChange={(value) =>
          setFilters((current) => ({ ...current, page: 1, status: value as RewardRequestStatus | 'all' }))
        }
      >
        <SelectTrigger className="w-full lg:w-48" aria-label="Filter by status">
          <SelectValue />
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
    )
  }

  return (
    <div>
      <PageHeader
        title="Reward Requests"
        description="Approve or reject redemptions before points leave the ledger."
        crumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Reward Requests' }]}
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
                placeholder="Search request, panelist, or reward"
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
        emptyTitle={filtered ? 'No matching reward requests.' : 'No reward requests available.'}
        emptyDescription={filtered ? 'Try a different search or clear the current filters.' : undefined}
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
              onClick={() => setViewing(item)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{item.requestId}</p>
                  <p className="text-xs text-muted-foreground">{item.panelistName}</p>
                </div>
                <RequestStatusBadge status={item.status} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {paymentMethodLabel(item.rewardName)} · {formatNumber(item.points)} pts
              </p>
            </button>
          ))}
        </div>
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Panelist</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>
                  <SortableHeader label="Points" column="points" sortBy={filters.sortBy} sortDir={filters.sortDir} onSort={sort} />
                </TableHead>
                <TableHead>
                  <SortableHeader
                    label="Request date"
                    column="requestedAt"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={sort}
                  />
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <TableRow key={item.id} className={item.status === 'pending' ? 'bg-warning-foreground/40' : undefined}>
                  <TableCell className="font-medium">{item.requestId}</TableCell>
                  <TableCell>
                    <p>{item.panelistName}</p>
                    {item.panelistEmail ? <p className="text-xs text-muted-foreground">{item.panelistEmail}</p> : null}
                  </TableCell>
                  <TableCell>{paymentMethodLabel(item.rewardName)}</TableCell>
                  <TableCell>{formatNumber(item.points)}</TableCell>
                  <TableCell>{formatDateTime(item.requestedAt)}</TableCell>
                  <TableCell>
                    <RequestStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions>
                      <DropdownMenuItem onClick={() => setViewing(item)}>View request</DropdownMenuItem>
                      {item.status === 'pending' ? (
                        <>
                          <DropdownMenuItem disabled={mutate.isPending} onClick={() => openDecision(item, 'approve')}>
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={mutate.isPending} onClick={() => openDecision(item, 'reject')}>
                            Reject
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </RowActions>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DataTable>

      <Sheet open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{viewing?.requestId}</SheetTitle>
          </SheetHeader>
          {viewing ? (
            <div className="space-y-3 p-4 text-sm">
              <p><span className="text-muted-foreground">Panelist:</span> {viewing.panelistName}</p>
              {viewing.panelistEmail ? (
                <p><span className="text-muted-foreground">Email:</span> {viewing.panelistEmail}</p>
              ) : null}
              <p><span className="text-muted-foreground">Reward:</span> {paymentMethodLabel(viewing.rewardName)}</p>
              <p><span className="text-muted-foreground">Points:</span> {formatNumber(viewing.points)}</p>
              {viewing.panelistBalance !== undefined ? (
                <p><span className="text-muted-foreground">Current balance:</span> {formatNumber(viewing.panelistBalance)} pts</p>
              ) : null}
              <p><span className="text-muted-foreground">Requested:</span> {formatDateTime(viewing.requestedAt)}</p>
              <p className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <RequestStatusBadge status={viewing.status} />
              </p>
              {viewing.remark ? <p><span className="text-muted-foreground">Panelist remark:</span> {viewing.remark}</p> : null}
              {viewing.actionBy ? <p><span className="text-muted-foreground">Actioned by:</span> {viewing.actionBy}</p> : null}
              {viewing.actionDate ? (
                <p><span className="text-muted-foreground">Actioned on:</span> {formatDateTime(viewing.actionDate)}</p>
              ) : null}
              {viewing.comment ? <p className="leading-6"><span className="text-muted-foreground">Admin comment:</span> {viewing.comment}</p> : null}
              {viewing.status === 'pending' ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button disabled={mutate.isPending} onClick={() => openDecision(viewing, 'approve')}>
                    Approve
                  </Button>
                  <Button variant="outline" disabled={mutate.isPending} onClick={() => openDecision(viewing, 'reject')}>
                    Reject
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={Boolean(decision)}
        onOpenChange={(open) => !open && !mutate.isPending && setDecision(null)}
        title={copy?.title ?? ''}
        description={copy?.description}
        confirmLabel={copy?.confirmLabel}
        destructive={decision?.action === 'reject'}
        pending={mutate.isPending}
        onConfirm={() => decision && mutate.mutate({ id: decision.request.id, action: decision.action, comment })}
      >
        <Field label="Comment (optional)">
          <Textarea
            value={comment}
            rows={3}
            disabled={mutate.isPending}
            placeholder={decision?.action === 'reject' ? 'Reason for rejecting this request' : 'Note for the record'}
            onChange={(event) => setComment(event.target.value)}
          />
        </Field>
      </ConfirmDialog>
    </div>
  )
}
