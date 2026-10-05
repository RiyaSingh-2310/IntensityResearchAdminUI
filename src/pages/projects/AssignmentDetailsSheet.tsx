import { CheckCircle2, ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ErrorState, LoadingSkeleton } from '@/components/shared/PageState'
import { AssignmentStatusBadge, SurveyRewardBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useSurveyAssignment } from '@/hooks/useProjects'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime, formatNumber } from '@/lib/format'
import type { ProjectAssignment } from '@/types'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  )
}

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
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="font-display pr-6">{assignment?.projectName ?? 'Assignment'}</SheetTitle>
          <SheetDescription>{assignmentId ? `Assignment #${assignmentId}` : 'Survey assignment'}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">
          {detail.isLoading ? (
            <div className="py-4">
              <LoadingSkeleton rows={6} />
            </div>
          ) : detail.isError ? (
            <div className="py-4">
              <ErrorState message={getErrorMessage(detail.error)} onRetry={() => detail.refetch()} />
            </div>
          ) : assignment ? (
            <dl className="divide-y">
              <Row label="Status">
                <span className="flex flex-wrap gap-1.5">
                  <AssignmentStatusBadge status={assignment.status} />
                  <SurveyRewardBadge status={assignment.status} />
                </span>
              </Row>
              <Row label="Panelist">
                <Link
                  to={`/admin/panelists/${assignment.panelistId}`}
                  className="font-medium hover:text-primary"
                  onClick={() => onOpenChange(false)}
                >
                  {assignment.panelistName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {assignment.panelistEmail ? `${assignment.panelistEmail} · ` : ''}ID {assignment.panelistId}
                </p>
              </Row>
              <Row label="Reward points">
                <span className="tabular font-medium">{formatNumber(assignment.rewardPoints)}</span>
              </Row>
              <Row label="Survey URL">
                <span className="font-mono text-xs break-all">{assignment.surveyUrl || '—'}</span>
              </Row>
              <Row label="Assigned">{formatDateTime(assignment.assignedAt)}</Row>
              {assignment.completedAt ? <Row label="Completed">{formatDateTime(assignment.completedAt)}</Row> : null}
              {assignment.remark ? <Row label="Remark">{assignment.remark}</Row> : null}
              {assignment.createdByName ? <Row label="Created by">{assignment.createdByName}</Row> : null}
              {assignment.updatedByName ? <Row label="Updated by">{assignment.updatedByName}</Row> : null}
              {assignment.updatedAt ? <Row label="Last updated">{formatDateTime(assignment.updatedAt)}</Row> : null}
            </dl>
          ) : null}
        </div>
        {assignment && (assignment.surveyUrl || assignment.status === 'active') ? (
          <div className="mt-auto flex gap-2 border-t p-4">
            {assignment.surveyUrl ? (
              <Button asChild variant="outline" className="flex-1">
                <a href={assignment.surveyUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  Open survey
                </a>
              </Button>
            ) : null}
            {assignment.status === 'active' && onMarkComplete ? (
              <Button className="flex-1" disabled={completePending} onClick={() => onMarkComplete(assignment)}>
                <CheckCircle2 className="size-4" />
                Mark complete
              </Button>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
