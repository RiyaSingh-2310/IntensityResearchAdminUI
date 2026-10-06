import { Badge } from '@/components/ui/badge'
import { ASSIGNMENT_STATUS_LABELS, PANELIST_STATUS_LABELS, REQUEST_STATUS_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { AssignmentStatus, PanelistStatus, RewardRequestStatus } from '@/types'

const tones = {
  success: 'border-transparent bg-success-foreground text-success',
  warning: 'border-transparent bg-warning-foreground text-warning',
  danger: 'border-transparent bg-destructive/10 text-destructive',
  info: 'border-transparent bg-info-foreground text-info',
  muted: 'border-transparent bg-muted text-muted-foreground',
  teal: 'border-transparent bg-accent text-teal-foreground',
} as const

export function ToneBadge({
  tone,
  children,
}: {
  tone: keyof typeof tones
  children: string
}) {
  return (
    <Badge variant="outline" className={cn('font-medium', tones[tone])}>
      {children}
    </Badge>
  )
}

export function PanelistStatusBadge({ status }: { status: PanelistStatus }) {
  const tone = status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'muted'
  return <ToneBadge tone={tone}>{PANELIST_STATUS_LABELS[status]}</ToneBadge>
}

export function VerificationBadge({ verified }: { verified: boolean }) {
  return <ToneBadge tone={verified ? 'success' : 'warning'}>{verified ? 'Verified' : 'Unverified'}</ToneBadge>
}

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const tone =
    status === 'complete'
      ? 'success'
      : status === 'terminate'
        ? 'danger'
        : status === 'quota_full'
          ? 'warning'
          : 'info'
  return <ToneBadge tone={tone}>{ASSIGNMENT_STATUS_LABELS[status]}</ToneBadge>
}

export function SurveyRewardBadge({ status }: { status: AssignmentStatus }) {
  const issued = status === 'complete'
  return <ToneBadge tone={issued ? 'success' : 'muted'}>{issued ? 'Credited' : 'Not credited'}</ToneBadge>
}

export function RequestStatusBadge({ status }: { status: RewardRequestStatus }) {
  const tone = status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning'
  return <ToneBadge tone={tone}>{REQUEST_STATUS_LABELS[status]}</ToneBadge>
}
