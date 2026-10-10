import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/shared/PageState'
import { PageHeader } from '@/components/shared/PageHeader'
import {
  AssignmentStatusBadge,
  PanelistStatusBadge,
  RequestStatusBadge,
  VerificationBadge,
} from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PointsInput } from '@/components/ui/points-input'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field } from '@/components/shared/Field'
import { resolveMediaUrl } from '@/config/api'
import {
  useActivatePanelist,
  useCreditPanelist,
  useDeactivatePanelist,
  usePanelist,
  useUpdatePanelist,
} from '@/hooks/usePanelists'
import { getErrorMessage } from '@/lib/errors'
import { formatDate, formatNumber, formatPoints } from '@/lib/format'
import { validatePoints } from '@/lib/validators'
import {
  AGE_RANGE_LABELS,
  EDUCATION_LABELS,
  EMPLOYMENT_LABELS,
  GENDER_LABELS,
  INCOME_LABELS,
  fullName,
  paymentMethodLabel,
} from '@/lib/labels'
import { AdditionalProfilesCard } from './AdditionalProfilesCard'
import { PanelistEditDialog } from './PanelistEditDialog'

const REMARK_MAX_LENGTH = 255

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-sm font-medium break-words">{value}</p>
    </div>
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

  if (detail.isLoading) return <LoadingSkeleton rows={6} />
  if (detail.isError) return <ErrorState message={getErrorMessage(detail.error)} onRetry={() => detail.refetch()} />
  if (!detail.data) return <EmptyState title="Panelist not found." />

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
        description={panelist.email}
        crumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Panelists', to: '/admin/panelists' },
          { label: name },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={openCredit}>
              Credit points
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            {panelist.status === 'active' ? (
              <Button variant="outline" disabled={statusPending} onClick={() => setConfirmDeactivate(true)}>
                Deactivate
              </Button>
            ) : (
              <Button variant="outline" disabled={statusPending} onClick={() => activate.mutate(panelist.id)}>
                {activate.isPending ? 'Activating…' : 'Activate'}
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/admin/panelists">
                <ArrowLeft className="size-4" />
                Back to panelists
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <PanelistStatusBadge status={panelist.status} />
        <VerificationBadge verified={panelist.isVerified} />
        <span className="text-sm text-muted-foreground">Registered {formatDate(panelist.registeredAt)}</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-xl">Personal information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {photo ? (
              <div className="sm:col-span-2">
                <img src={photo} alt="" className="size-16 rounded-full object-cover" />
              </div>
            ) : null}
            <Info label="Name" value={name || '—'} />
            <Info label="Panelist ID" value={panelist.id} />
            <Info label="Email" value={panelist.email} />
            <Info label="Phone" value={panelist.phone || '—'} />
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Account status</p>
              <div className="mt-1">
                <PanelistStatusBadge status={panelist.status} />
              </div>
            </div>
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Verification</p>
              <div className="mt-1">
                <VerificationBadge verified={panelist.isVerified} />
              </div>
            </div>
            <Info label="Onboarding step" value={panelist.onboardingStep || '—'} />
            <Info
              label="Onboarding completed"
              value={panelist.onboardingCompletedAt ? formatDate(panelist.onboardingCompletedAt) : '—'}
            />
            <Info label="Registered" value={formatDate(panelist.registeredAt)} />
            <Info label="Last updated" value={panelist.updatedAt ? formatDate(panelist.updatedAt) : '—'} />
          </CardContent>
          <Separator />
          <CardHeader>
            <CardTitle className="font-display text-xl">Demographics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Info label="Age range" value={panelist.ageRange ? AGE_RANGE_LABELS[panelist.ageRange] : '—'} />
            <Info label="Gender" value={panelist.gender ? GENDER_LABELS[panelist.gender] : '—'} />
            <Info label="Education" value={panelist.education ? EDUCATION_LABELS[panelist.education] : '—'} />
            <Info label="Employment" value={panelist.employment ? EMPLOYMENT_LABELS[panelist.employment] : '—'} />
            <Info label="Household income" value={panelist.householdIncome ? INCOME_LABELS[panelist.householdIncome] : '—'} />
            <Info label="Household size" value={panelist.householdSize || '—'} />
          </CardContent>
        </Card>

        <div className="grid content-start gap-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-xl">Reward summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-secondary px-3 py-3">
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="font-display text-2xl">{formatNumber(panelist.rewardPoints)}</p>
              </div>
              <div className="rounded-2xl bg-secondary px-3 py-3">
                <p className="text-xs text-muted-foreground">Redeemed</p>
                <p className="font-display text-2xl">{formatNumber(panelist.redeemedPoints)}</p>
              </div>
              <div className="rounded-2xl bg-secondary px-3 py-3">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="font-display text-2xl">{formatNumber(panelist.pendingPoints)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-xl">Activity</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Surveys assigned" value={panelist.assignedProjectCount} />
              <Info label="Surveys completed" value={panelist.completedProjectCount} />
              <Info label="Rewards redeemed" value={formatPoints(panelist.redeemedPoints)} />
              <Info label="Pending payout" value={formatPoints(panelist.pendingPoints)} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-4 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-xl">Survey preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Info label="Shopping preference" value={panelist.surveyPreferences.shoppingPreference} />
          <Info label="Typical spend" value={panelist.surveyPreferences.typicalSpend} />
          <Info label="Research participation" value={panelist.surveyPreferences.researchParticipation} />
          <Info
            label="Preferred categories"
            value={panelist.surveyPreferences.preferredCategories.join(', ') || '—'}
          />
        </CardContent>
      </Card>

      <AdditionalProfilesCard panelistId={panelist.id} />

      <Card className="mt-4 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-xl">Onboarding answers</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {panelist.onboardingAnswers.length === 0 ? (
            <div className="sm:col-span-2">
              <EmptyState title="No onboarding answers returned." />
            </div>
          ) : (
            panelist.onboardingAnswers.map((item) => (
              <Info key={item.id || item.question} label={item.question || 'Answer'} value={item.answer || '—'} />
            ))
          )}
        </CardContent>
      </Card>

      <Card className="mt-4 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-xl">Assigned surveys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {panelist.assignments.length === 0 ? (
            <EmptyState title="No surveys assigned." description="Assign a survey from Assigned Projects." />
          ) : (
            panelist.assignments.map((assignment) => (
              <div key={assignment.id} className="flex flex-col gap-2 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{assignment.projectName}</p>
                  <p className="text-xs text-muted-foreground">
                    Assigned {formatDate(assignment.assignedAt)} · {formatPoints(assignment.rewardPoints)}
                    {assignment.completedAt ? ` · Completed ${formatDate(assignment.completedAt)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <AssignmentStatusBadge status={assignment.status} />
                  {assignment.surveyUrl ? (
                    <Button asChild size="sm" variant="outline">
                      <a href={assignment.surveyUrl} target="_blank" rel="noopener noreferrer">
                        Open Survey
                        <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="mt-4 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-xl">Recent rewards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {panelist.recentRewards.length === 0 ? (
            <EmptyState title="No reward activity yet." />
          ) : (
            panelist.recentRewards.slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{paymentMethodLabel(item.rewardName)}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.requestId} · {formatDate(item.transactionDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <p>{formatPoints(item.points)}</p>
                  <RequestStatusBadge status={item.status} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

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
        description={`${name} will be marked inactive until reactivated.`}
        confirmLabel="Deactivate"
        destructive
        pending={deactivate.isPending}
        onConfirm={() => deactivate.mutate(panelist.id)}
      />

      <Dialog open={creditOpen} onOpenChange={(open) => !credit.isPending && setCreditOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitCredit} noValidate className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Credit points</DialogTitle>
              <DialogDescription>Manually add points to this panelist’s balance.</DialogDescription>
            </DialogHeader>
            <Field label="Points" error={pointsError}>
              <PointsInput
                value={points}
                placeholder="e.g. 100"
                disabled={credit.isPending}
                onValueChange={(value) => {
                  setPoints(value)
                  setPointsError(undefined)
                }}
              />
            </Field>
            <Field label="Remark">
              <Input
                value={remark}
                maxLength={REMARK_MAX_LENGTH}
                placeholder="Manual credit"
                disabled={credit.isPending}
                onChange={(event) => setRemark(event.target.value)}
              />
            </Field>
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
