import { ArrowLeft, Coins, ExternalLink, Pencil, Power, PowerOff } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Field } from '@/components/shared/Field'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/shared/PageState'
import {
  AssignmentStatusBadge,
  PanelistStatusBadge,
  RequestStatusBadge,
  VerificationBadge,
} from '@/components/shared/StatusBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { PointsInput } from '@/components/ui/points-input'
import { resolveMediaUrl } from '@/config/api'
import {
  useActivatePanelist,
  useCreditPanelist,
  useDeactivatePanelist,
  usePanelist,
  useUpdatePanelist,
} from '@/hooks/usePanelists'
import { getErrorMessage } from '@/lib/errors'
import { formatDate, formatDateTime, formatNumber, formatPoints } from '@/lib/format'
import {
  AGE_RANGE_LABELS,
  EDUCATION_LABELS,
  EMPLOYMENT_LABELS,
  GENDER_LABELS,
  INCOME_LABELS,
  fullName,
  paymentMethodLabel,
} from '@/lib/labels'
import { validatePoints } from '@/lib/validators'
import { PanelistEditDialog } from './PanelistEditDialog'

const REMARK_MAX_LENGTH = 255

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.7rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-medium break-words">{children}</dd>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border bg-surface/50 px-3.5 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-display tabular mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  )
}

function SectionTitle({ children, description }: { children: ReactNode; description?: string }) {
  return (
    <CardHeader>
      <CardTitle className="font-display text-base font-semibold">{children}</CardTitle>
      {description ? <CardDescription>{description}</CardDescription> : null}
    </CardHeader>
  )
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  )
}

export function PanelistDetailPage() {
  const { id = '' } = useParams()
  const detail = usePanelist(id)
  const [creditOpen, setCreditOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [points, setPoints] = useState('')
  const [remark, setRemark] = useState('')
  const [pointsError, setPointsError] = useState<string>()
  const credit = useCreditPanelist(() => setCreditOpen(false))
  const update = useUpdatePanelist(() => setEditOpen(false))
  const activate = useActivatePanelist()
  const deactivate = useDeactivatePanelist(() => setConfirmDeactivate(false))

  if (detail.isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton rows={2} />
        <LoadingSkeleton rows={6} />
      </div>
    )
  }
  if (detail.isError) return <ErrorState message={getErrorMessage(detail.error)} onRetry={() => detail.refetch()} />
  if (!detail.data) {
    return (
      <EmptyState
        title="Panelist not found"
        description="This panelist may have been removed."
        action={
          <Button asChild variant="outline">
            <Link to="/admin/panelists">Back to panelists</Link>
          </Button>
        }
      />
    )
  }

  const panelist = detail.data
  const name = fullName(panelist.firstName, panelist.lastName) || panelist.email
  const photo = resolveMediaUrl(panelist.photo)
  const statusPending = activate.isPending || deactivate.isPending

  function openCredit() {
    setPoints('')
    setRemark('')
    setPointsError(undefined)
    setCreditOpen(true)
  }

  function submitCredit(event: FormEvent) {
    event.preventDefault()
    const error = validatePoints(points)
    setPointsError(error)
    if (error || credit.isPending) return
    credit.mutate({ id: panelist.id, points: Number(points), remark: remark.trim() || undefined })
  }

  return (
    <div>
      <PageHeader
        title={name}
        crumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Panelists', to: '/admin/panelists' },
          { label: name },
        ]}
        actions={
          <>
            <Button asChild variant="ghost">
              <Link to="/admin/panelists">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Edit
            </Button>
            {panelist.status === 'active' ? (
              <Button variant="outline" disabled={statusPending} onClick={() => setConfirmDeactivate(true)}>
                <PowerOff className="size-4" />
                Deactivate
              </Button>
            ) : (
              <Button variant="outline" disabled={statusPending} onClick={() => activate.mutate(panelist.id)}>
                <Power className="size-4" />
                {activate.isPending ? 'Activating…' : 'Activate'}
              </Button>
            )}
            <Button onClick={openCredit}>
              <Coins className="size-4" />
              Credit points
            </Button>
          </>
        }
      />

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar className="size-16 ring-2 ring-border">
            {photo ? <AvatarImage src={photo} alt="" className="object-cover" /> : null}
            <AvatarFallback className="bg-gradient-to-br from-primary to-highlight text-lg font-semibold text-white">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-muted-foreground">{panelist.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <PanelistStatusBadge status={panelist.status} />
              <VerificationBadge verified={panelist.isVerified} />
              <span className="text-xs text-muted-foreground">
                Panelist #{panelist.id} · Joined {formatDate(panelist.registeredAt)}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:w-[26rem]">
            <Stat label="Available" value={formatNumber(panelist.rewardPoints)} tone="text-foreground" />
            <Stat label="Pending payout" value={formatNumber(panelist.pendingPoints)} tone="text-warning" />
            <Stat label="Redeemed" value={formatNumber(panelist.redeemedPoints)} tone="text-success" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="min-w-0 space-y-6">
          <Card>
            <SectionTitle>Profile</SectionTitle>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Info label="Name">{name}</Info>
                <Info label="Email">{panelist.email || '—'}</Info>
                <Info label="Phone">{panelist.phone || '—'}</Info>
                <Info label="Onboarding step">{panelist.onboardingStep || '—'}</Info>
                <Info label="Onboarding completed">
                  {panelist.onboardingCompletedAt ? formatDate(panelist.onboardingCompletedAt) : 'Not completed'}
                </Info>
                <Info label="Last updated">{panelist.updatedAt ? formatDateTime(panelist.updatedAt) : '—'}</Info>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <SectionTitle description="Taken from the panelist's onboarding answers.">Demographics</SectionTitle>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Info label="Age range">{panelist.ageRange ? AGE_RANGE_LABELS[panelist.ageRange] : '—'}</Info>
                <Info label="Gender">{panelist.gender ? GENDER_LABELS[panelist.gender] : '—'}</Info>
                <Info label="Household size">{panelist.householdSize || '—'}</Info>
                <Info label="Education">{panelist.education ? EDUCATION_LABELS[panelist.education] : '—'}</Info>
                <Info label="Employment">{panelist.employment ? EMPLOYMENT_LABELS[panelist.employment] : '—'}</Info>
                <Info label="Household income">
                  {panelist.householdIncome ? INCOME_LABELS[panelist.householdIncome] : '—'}
                </Info>
                <Info label="Shopping method">{panelist.surveyPreferences.shoppingPreference}</Info>
                <Info label="Monthly budget">{panelist.surveyPreferences.typicalSpend}</Info>
                <Info label="Survey frequency">{panelist.surveyPreferences.researchParticipation}</Info>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <SectionTitle description="Every answer returned for this panelist.">Onboarding answers</SectionTitle>
            <CardContent>
              {panelist.onboardingAnswers.length === 0 ? (
                <EmptyState title="No onboarding answers" description="This panelist hasn't answered any questions yet." />
              ) : (
                <dl className="divide-y">
                  {panelist.onboardingAnswers.map((item) => (
                    <div
                      key={item.id || item.question}
                      className="grid gap-1 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-4"
                    >
                      <dt className="text-sm text-muted-foreground">{item.question || 'Question'}</dt>
                      <dd className="text-sm font-medium break-words">{item.answer || '—'}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <SectionTitle
              description={`${formatNumber(panelist.assignedProjectCount)} assigned · ${formatNumber(panelist.completedProjectCount)} completed`}
            >
              Survey assignments
            </SectionTitle>
            <CardContent>
              {panelist.assignments.length === 0 ? (
                <EmptyState
                  title="No surveys assigned"
                  description="Assign one from Survey Assignments."
                  action={
                    <Button asChild variant="outline" size="sm">
                      <Link to="/admin/projects">Go to Survey Assignments</Link>
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y">
                  {panelist.assignments.map((assignment) => (
                    <li key={assignment.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{assignment.projectName}</p>
                        <p className="tabular mt-0.5 text-xs text-muted-foreground">
                          {formatPoints(assignment.rewardPoints)} · Assigned {formatDate(assignment.assignedAt)}
                          {assignment.completedAt ? ` · Completed ${formatDate(assignment.completedAt)}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <AssignmentStatusBadge status={assignment.status} />
                        {assignment.surveyUrl ? (
                          <Button asChild size="icon-sm" variant="ghost">
                            <a
                              href={assignment.surveyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Open ${assignment.projectName}`}
                            >
                              <ExternalLink className="size-3.5" />
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <SectionTitle description="Payout requests submitted by this panelist.">Reward requests</SectionTitle>
            <CardContent>
              {panelist.recentRewards.length === 0 ? (
                <EmptyState title="No reward requests" description="This panelist hasn't requested a payout yet." />
              ) : (
                <ul className="divide-y">
                  {panelist.recentRewards.slice(0, 8).map((item) => (
                    <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{paymentMethodLabel(item.rewardName)}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span className="font-mono">{item.requestId}</span> · {formatDate(item.transactionDate)}
                        </p>
                      </div>
                      <span className="tabular text-sm font-medium">{formatPoints(item.points)}</span>
                      <RequestStatusBadge status={item.status} />
                    </li>
                  ))}
                </ul>
              )}
              {panelist.recentRewards.length > 8 ? (
                <Button asChild variant="link" className="mt-2 h-auto px-0">
                  <Link to="/admin/reward-history">View all in Reward History</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <PanelistEditDialog
        open={editOpen}
        panelist={panelist}
        pending={update.isPending}
        onOpenChange={setEditOpen}
        onSubmit={(input) => update.mutate({ id: panelist.id, input })}
      />

      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={(open) => !deactivate.isPending && setConfirmDeactivate(open)}
        title="Deactivate this panelist?"
        description={`${name} will be marked inactive. You can reactivate them at any time.`}
        confirmLabel="Deactivate"
        destructive
        pending={deactivate.isPending}
        onConfirm={() => deactivate.mutate(panelist.id)}
      />

      <Dialog open={creditOpen} onOpenChange={(open) => !credit.isPending && setCreditOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitCredit} noValidate className="grid gap-5">
            <DialogHeader>
              <DialogTitle className="font-display">Credit points</DialogTitle>
              <DialogDescription>
                Manually add points to {name}’s balance. Current balance: {formatPoints(panelist.rewardPoints)}.
              </DialogDescription>
            </DialogHeader>
            <fieldset disabled={credit.isPending} className="grid gap-4">
              <Field label="Points" htmlFor="credit-points" error={pointsError}>
                <PointsInput
                  id="credit-points"
                  value={points}
                  placeholder="e.g. 100"
                  autoFocus
                  aria-invalid={Boolean(pointsError)}
                  onValueChange={(value) => {
                    setPoints(value)
                    setPointsError(undefined)
                  }}
                />
              </Field>
              <Field label="Remark (optional)" htmlFor="credit-remark" hint="Saved with the transaction.">
                <Input
                  id="credit-remark"
                  value={remark}
                  maxLength={REMARK_MAX_LENGTH}
                  placeholder="Manual credit"
                  onChange={(event) => setRemark(event.target.value)}
                />
              </Field>
            </fieldset>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={credit.isPending} onClick={() => setCreditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={credit.isPending}>
                {credit.isPending ? 'Crediting…' : 'Credit points'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
