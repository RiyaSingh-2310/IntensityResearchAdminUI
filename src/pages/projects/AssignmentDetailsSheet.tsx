import { ExternalLink } from 'lucide-react'
import { AssignmentStatusBadge, SurveyRewardBadge } from '@/components/shared/StatusBadge'
import { ErrorState, LoadingSkeleton } from '@/components/shared/PageState'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useSurveyAssignment } from '@/hooks/useProjects'
import { getErrorMessage } from '@/lib/errors'
import { formatDate, formatDateTime, formatNumber } from '@/lib/format'
import type { ProjectAssignment } from '@/types'

export function AssignmentDetailsSheet({
  assignmentId,
  onOpenChange,
  onMarkComplete,
  completePending = false,
}: {
  assignmentId: string | null
  onOpenChange: (open: boolean) => void
  onMarkComplete?: (assignment: ProjectAssignment) => void
  completePending?: boolean
}) {
  const detail = useSurveyAssignment(assignmentId ?? '')
  const assignment = detail.data

  return (
    <Sheet open={Boolean(assignmentId)} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{assignment?.projectName ?? 'Assignment'}</SheetTitle>
        </SheetHeader>
        {detail.isLoading ? (
          <div className="p-4">
            <LoadingSkeleton rows={6} />
          </div>
        ) : detail.isError ? (
          <div className="p-4">
            <ErrorState message={getErrorMessage(detail.error)} onRetry={() => detail.refetch()} />
          </div>
        ) : assignment ? (
          <div className="space-y-3 p-4 text-sm">
            <p>
              <span className="text-muted-foreground">Survey ID:</span> {assignment.id}
            </p>
            <p>
              <span className="text-muted-foreground">Survey name:</span> {assignment.projectName}
            </p>
            <p className="break-all">
              <span className="text-muted-foreground">Survey URL:</span> {assignment.surveyUrl}
            </p>
            <p>
              <span className="text-muted-foreground">Panelist:</span> {assignment.panelistName}
            </p>
            <p>
              <span className="text-muted-foreground">Panelist ID:</span> {assignment.panelistId}
            </p>
            {assignment.panelistEmail ? (
              <p>
                <span className="text-muted-foreground">Panelist email:</span> {assignment.panelistEmail}
              </p>
            ) : null}
            <p>
              <span className="text-muted-foreground">Assigned:</span> {formatDateTime(assignment.assignedAt)}
            </p>
            {assignment.completedAt ? (
              <p>
                <span className="text-muted-foreground">Completed:</span> {formatDateTime(assignment.completedAt)}
              </p>
            ) : null}
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Status:</span>
              <AssignmentStatusBadge status={assignment.status} />
            </p>
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Survey reward:</span>
              <SurveyRewardBadge status={assignment.status} />
            </p>
            <p>
              <span className="text-muted-foreground">Reward points:</span> {formatNumber(assignment.rewardPoints)}
            </p>
            {assignment.status === 'complete' ? (
              <p className="text-xs text-muted-foreground">
                Completing this assignment credits the survey reward once. Transaction details are stored by the
                backend and are not returned on this assignment record.
              </p>
            ) : null}
            {assignment.remark ? (
              <p>
                <span className="text-muted-foreground">Remark:</span> {assignment.remark}
              </p>
            ) : null}
            {assignment.createdByName ? (
              <p>
                <span className="text-muted-foreground">Created by:</span> {assignment.createdByName}
              </p>
            ) : null}
            {assignment.updatedByName ? (
              <p>
                <span className="text-muted-foreground">Updated by:</span> {assignment.updatedByName}
              </p>
            ) : null}
            {assignment.updatedAt ? (
              <p>
                <span className="text-muted-foreground">Updated:</span> {formatDate(assignment.updatedAt)}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-2">
              {assignment.status === 'active' && assignment.surveyUrl ? (
                <Button asChild variant="outline">
                  <a href={assignment.surveyUrl} target="_blank" rel="noopener noreferrer">
                    Open survey
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
              ) : null}
              {assignment.status === 'active' && onMarkComplete ? (
                <Button
                  disabled={completePending}
                  onClick={() => !completePending && onMarkComplete(assignment)}
                >
                  Mark completed
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
