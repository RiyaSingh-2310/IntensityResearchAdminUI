import type { ReactNode } from 'react'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/shared/PageState'
import { PaginationBar } from '@/components/shared/PaginationBar'
import { Card } from '@/components/ui/card'

export function DataTable({
  toolbar,
  loading,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  page,
  pageSize,
  total,
  onPageChange,
  children,
}: {
  toolbar?: ReactNode
  loading?: boolean
  error?: string
  onRetry?: () => void
  emptyTitle: string
  emptyDescription?: string
  emptyAction?: ReactNode
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  children: ReactNode
}) {
  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-sm">
      {toolbar}
      {loading ? (
        <div className="p-4">
          <LoadingSkeleton rows={6} />
        </div>
      ) : error && onRetry ? (
        <div className="p-4">
          <ErrorState message={error} onRetry={onRetry} />
        </div>
      ) : total === 0 ? (
        <div className="p-4">
          <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
        </div>
      ) : (
        <>
          <div className="min-w-0 overflow-x-auto">{children}</div>
          {page && pageSize && total !== undefined && onPageChange ? (
            <div className="px-4">
              <PaginationBar page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
            </div>
          ) : null}
        </>
      )}
    </Card>
  )
}
