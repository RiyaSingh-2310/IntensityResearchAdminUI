import { Badge } from '@/components/ui/badge'
import { ASSIGNMENT_STATUS_LABELS, PANELIST_STATUS_LABELS, REQUEST_STATUS_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { AssignmentStatus, PanelistStatus, RewardRequestStatus } from '@/types'

const tones = {
  success: 'bg-success-foreground text-success ring-success/25',
  warning: 'bg-warning-foreground text-warning ring-warning/25',
  danger: 'bg-destructive/12 text-destructive ring-destructive/25',
  info: 'bg-info-foreground text-info ring-info/25',
  teal: 'bg-highlight-foreground text-highlight ring-highlight/25',
  muted: 'bg-muted text-muted-foreground ring-border',
} as const

type Tone = keyof typeof tones

export function ToneBadge({ tone, children }: { tone: Tone; children: string }) {
  return (
    <Badge variant="outline" className={cn('gap-1.5 border-transparent font-medium ring-1 ring-inset', tones[tone])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </Badge>
  )
}

export function PanelistStatusBadge({ status }: { status: PanelistStatus }) {
  const tone = status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'muted'
  return <ToneBadge tone={tone}>{PANELIST_STATUS_LABELS[status]}</ToneBadge>
}

export function VerificationBadge({ verified }: { verified: boolean }) {
  return <ToneBadge tone={verified ? 'info' : 'warning'}>{verified ? 'Verified' : 'Unverified'}</ToneBadge>
}

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const tone: Tone =
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
  const tone: Tone = status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning'
  return <ToneBadge tone={tone}>{REQUEST_STATUS_LABELS[status]}</ToneBadge>
}
