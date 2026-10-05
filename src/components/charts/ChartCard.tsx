import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/PageState'

export function ChartCard({
  title,
  description,
  loading,
  empty,
  action,
  children,
}: {
  title: string
  description?: string
  loading?: boolean
  empty?: boolean
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="font-display text-base font-semibold">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : empty ? (
          <EmptyState
            title="No data yet"
            description="This chart fills in once the API returns matching records."
          />
        ) : (
          <div className="h-64 min-h-52">{children}</div>
        )}
      </CardContent>
    </Card>
  )
}
