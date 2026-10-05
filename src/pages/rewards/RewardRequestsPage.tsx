import { Check, Eye, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { DataTable } from '@/components/common/DataTable'
import { FilterToolbar } from '@/components/common/FilterToolbar'
import { RowActions } from '@/components/common/RowActions'
import { SearchField } from '@/components/common/SearchField'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { SortableHeader } from '@/components/shared/SortableHeader'
import { RequestStatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-3 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  )
}

export function RewardRequestsPage() {
  const { search, setSearch, filters, setFilters, query, reset, setPage, sort } = useListQuery(defaultQuery)
  const list = useRewardRequestList(query)
  const [filterOpen, setFilterOpen] = useState(false)
  const [viewing, setViewing] = useState<RewardRequest | null>(null)
  const [decision, setDecision] = useState<Decision | null>(null)
  const [comment, setComment] = useState('')
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
        title: decision.action === 'approve' ? 'Approve this payout?' : 'Reject this payout?',
        description: `${decision.request.panelistName} requested ${formatNumber(decision.request.points)} points via ${paymentMethodLabel(decision.request.rewardName)}.`,
        confirmLabel: decision.action === 'approve' ? 'Approve request' : 'Reject request',
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

  function actions(item: RewardRequest) {
    return (
      <RowActions>
        <DropdownMenuItem onClick={() => setViewing(item)}>
          <Eye className="size-4" />
          View details
        </DropdownMenuItem>
        {item.status === 'pending' ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={mutate.isPending} onClick={() => openDecision(item, 'approve')}>
              <Check className="size-4" />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={mutate.isPending}
              onClick={() => openDecision(item, 'reject')}
            >
              <X className="size-4" />
              Reject
            </DropdownMenuItem>
          </>
        ) : null}
      </RowActions>
    )
  }

  return (
    <div>
      <PageHeader
        title="Reward Requests"
        description="Review and action payout requests submitted by panelists."
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
                placeholder="Search request ID, panelist, email or method"
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
        emptyTitle="No reward requests found"
        emptyDescription="Try a different status or search term."
        page={list.data?.page}
        pageSize={list.data?.pageSize}
        total={list.data?.total ?? 0}
        onPageChange={setPage}
      >
        <div className="divide-y md:hidden">
          {rows.map((item) => (
            <div key={item.id} className="flex items-start gap-3 px-4 py-3.5">
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setViewing(item)}>
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{item.panelistName}</p>
                  <RequestStatusBadge status={item.status} />
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.panelistEmail || item.requestId}</p>
                <p className="tabular mt-1.5 text-xs text-muted-foreground">
                  {formatNumber(item.points)} pts · {paymentMethodLabel(item.rewardName)} ·{' '}
                  {formatDateTime(item.requestedAt)}
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
                <TableHead>Request</TableHead>
                <TableHead>Panelist</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>
                  <SortableHeader
                    label="Points"
                    column="points"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={sort}
                  />
                </TableHead>
                <TableHead>
                  <SortableHeader
                    label="Requested"
                    column="requestedAt"
                    sortBy={filters.sortBy}
                    sortDir={filters.sortDir}
                    onSort={sort}
                  />
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.requestId}</TableCell>
                  <TableCell>
                    <p className="font-medium">{item.panelistName}</p>
                    {item.panelistEmail ? (
                      <p className="text-xs text-muted-foreground">{item.panelistEmail}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>{paymentMethodLabel(item.rewardName)}</TableCell>
                  <TableCell className="font-medium">{formatNumber(item.points)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(item.requestedAt)}</TableCell>
                  <TableCell>
                    <RequestStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right">{actions(item)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DataTable>

      <Sheet open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle className="font-display flex items-center gap-2">
              {viewing?.requestId}
              {viewing ? <RequestStatusBadge status={viewing.status} /> : null}
            </SheetTitle>
            <SheetDescription>Payout request details</SheetDescription>
          </SheetHeader>
          {viewing ? (
            <div className="flex-1 overflow-y-auto px-4">
              <dl className="divide-y">
                <DetailRow label="Panelist">
                  <p className="font-medium">{viewing.panelistName}</p>
                  {viewing.panelistEmail ? (
                    <p className="text-xs text-muted-foreground">{viewing.panelistEmail}</p>
                  ) : null}
                </DetailRow>
                <DetailRow label="Points requested">
                  <span className="tabular font-medium">{formatNumber(viewing.points)}</span>
                </DetailRow>
                {viewing.panelistBalance !== undefined ? (
                  <DetailRow label="Current balance">
                    <span className="tabular">{formatNumber(viewing.panelistBalance)} pts</span>
                  </DetailRow>
                ) : null}
                <DetailRow label="Payout method">{paymentMethodLabel(viewing.rewardName)}</DetailRow>
                <DetailRow label="Requested">{formatDateTime(viewing.requestedAt)}</DetailRow>
                {viewing.remark ? <DetailRow label="Panelist remark">{viewing.remark}</DetailRow> : null}
                {viewing.actionBy ? <DetailRow label="Actioned by">{viewing.actionBy}</DetailRow> : null}
                {viewing.actionDate ? (
                  <DetailRow label="Actioned on">{formatDateTime(viewing.actionDate)}</DetailRow>
                ) : null}
                {viewing.comment ? <DetailRow label="Admin comment">{viewing.comment}</DetailRow> : null}
              </dl>
            </div>
          ) : null}
          {viewing?.status === 'pending' ? (
            <div className="mt-auto flex gap-2 border-t p-4">
              <Button
                variant="outline"
                className="flex-1 text-destructive hover:text-destructive"
                disabled={mutate.isPending}
                onClick={() => openDecision(viewing, 'reject')}
              >
                <X className="size-4" />
                Reject
              </Button>
              <Button className="flex-1" disabled={mutate.isPending} onClick={() => openDecision(viewing, 'approve')}>
                <Check className="size-4" />
                Approve
              </Button>
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
        onConfirm={() =>
          decision && mutate.mutate({ id: decision.request.id, action: decision.action, comment })
        }
      >
        <div className="space-y-1.5">
          <Label htmlFor="decision-comment">
            Comment <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="decision-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={
              decision?.action === 'reject' ? 'Let the panelist know why the request was rejected' : 'Add a note for the record'
            }
            rows={3}
            disabled={mutate.isPending}
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}
