import { useMemo, useState } from 'react'
import { SearchField } from '@/components/common/SearchField'
import { Field } from '@/components/shared/Field'
import { PaginationBar } from '@/components/shared/PaginationBar'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/shared/PageState'
import { PanelistStatusBadge, VerificationBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePanelistList } from '@/hooks/usePanelists'
import { getErrorMessage } from '@/lib/errors'
import { formatNumber } from '@/lib/format'
import { fullName } from '@/lib/labels'
import {
  SURVEY_NAME_MAX_LENGTH,
  validatePoints,
  validateSurveyName,
  validateSurveyUrl,
} from '@/lib/validators'
import type { AssignPanelistsInput, AssignmentSummary, SelectedPanelist } from '@/types'

export function AssignPanelistsDialog({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  pending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: AssignPanelistsInput) => void
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      {open ? (
        <AssignPanelistsForm pending={pending} onOpenChange={onOpenChange} onSubmit={onSubmit} />
      ) : null}
    </Dialog>
  )
}

function AssignPanelistsForm({
  pending,
  onOpenChange,
  onSubmit,
}: {
  pending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: AssignPanelistsInput) => void
}) {
  const [step, setStep] = useState<'select' | 'review'>('select')
  const [surveyName, setSurveyName] = useState('')
  const [surveyUrl, setSurveyUrl] = useState('')
  const [rewardPoints, setRewardPoints] = useState('')
  const [remark, setRemark] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Map<string, SelectedPanelist>>(new Map())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [attempted, setAttempted] = useState(false)
  const debouncedSearch = useDebouncedValue(search)
  const list = usePanelistList({
    search: debouncedSearch,
    page,
    pageSize: 8,
    status: 'active',
    verifiedOnly: true,
    sortBy: 'registeredAt',
    sortDir: 'desc',
  })
  const rows = list.data?.data ?? []
  const points = Number(rewardPoints)
  const summary = useMemo<AssignmentSummary>(
    () => ({
      surveyName: surveyName.trim(),
      surveyUrl: surveyUrl.trim(),
      panelistCount: selected.size,
      panelists: [...selected.values()],
      rewardPointsPerPanelist: Number.isFinite(points) ? points : 0,
      totalRewardPoints: selected.size * (Number.isFinite(points) ? points : 0),
      remark: remark.trim() || undefined,
    }),
    [points, remark, selected, surveyName, surveyUrl],
  )

  const validation = useMemo(() => {
    return {
      surveyName: validateSurveyName(surveyName) ?? '',
      surveyUrl: validateSurveyUrl(surveyUrl) ?? '',
      panelists: selected.size ? '' : 'Select at least one panelist.',
      rewardPoints: validatePoints(rewardPoints, 'Reward points') ?? '',
    }
  }, [rewardPoints, selected.size, surveyName, surveyUrl])

  const canReview = Object.values(validation).every((value) => !value)

  function toggle(panelist: SelectedPanelist, checked: boolean) {
    setSelected((current) => {
      const next = new Map(current)
      if (checked) next.set(panelist.id, panelist)
      else next.delete(panelist.id)
      return next
    })
  }

  function togglePage(checked: boolean) {
    setSelected((current) => {
      const next = new Map(current)
      for (const panelist of rows) {
        const item = {
          id: panelist.id,
          name: fullName(panelist.firstName, panelist.lastName) || panelist.email,
          email: panelist.email,
        }
        if (checked) next.set(item.id, item)
        else next.delete(item.id)
      }
      return next
    })
  }

  function goToReview() {
    setAttempted(true)
    setErrors(validation)
    if (!canReview) return
    setStep('review')
  }

  function submit() {
    if (pending || !canReview) return
    onSubmit({
      surveyName: summary.surveyName,
      surveyUrl: summary.surveyUrl,
      panelistIds: [...new Set(summary.panelists.map((item) => item.id))],
      rewardPoints: summary.rewardPointsPerPanelist,
      remark: summary.remark,
    })
  }

  const pageIds = rows.map((item) => item.id)
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const show = (key: keyof typeof validation) => (attempted ? errors[key] || validation[key] : undefined)

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle className="font-display">{step === 'select' ? 'Assign a survey' : 'Review assignment'}</DialogTitle>
        <DialogDescription>
          {step === 'select'
            ? 'Set the survey link and reward, then pick active, verified panelists. Points are credited only when you later mark an assignment complete.'
            : 'Check the details below. Each selected panelist gets their own active assignment.'}
        </DialogDescription>
      </DialogHeader>

      {step === 'select' ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Survey name" htmlFor="assign-survey-name" className="sm:col-span-2" error={show('surveyName')}>
              <Input
                id="assign-survey-name"
                value={surveyName}
                maxLength={SURVEY_NAME_MAX_LENGTH}
                placeholder="e.g. Brand feedback Q3"
                onChange={(event) => setSurveyName(event.target.value.slice(0, SURVEY_NAME_MAX_LENGTH))}
              />
            </Field>
            <Field
              label="Survey URL"
              htmlFor="assign-survey-url"
              className="sm:col-span-2"
              error={show('surveyUrl')}
              hint="Include {panelist_id} where the survey vendor expects the panelist ID."
            >
              <Input
                id="assign-survey-url"
                type="url"
                value={surveyUrl}
                placeholder="https://surveys.example.com/s/brand?uid={panelist_id}"
                onChange={(event) => setSurveyUrl(event.target.value)}
              />
            </Field>
            <Field label="Reward points per panelist" htmlFor="assign-points" error={show('rewardPoints')}>
              <PointsInput id="assign-points" value={rewardPoints} placeholder="e.g. 100" onValueChange={setRewardPoints} />
            </Field>
            <div className="flex min-h-9 items-center justify-start text-sm text-muted-foreground sm:justify-end sm:pt-6">
              <span className="tabular rounded-md bg-muted px-2.5 py-1">
                <span className="font-medium text-foreground">{selected.size}</span> selected ·{' '}
                {formatNumber(summary.totalRewardPoints)} pts max
              </span>
            </div>
            <Field label="Remark (optional)" htmlFor="assign-remark" className="sm:col-span-2">
              <Textarea
                id="assign-remark"
                rows={2}
                value={remark}
                placeholder="Internal note for this assignment"
                onChange={(event) => setRemark(event.target.value)}
              />
            </Field>
          </div>

          <SearchField
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="Search panelists by name, email or phone"
            searching={search !== debouncedSearch}
          />
          {show('panelists') ? <p className="text-xs text-destructive">{show('panelists')}</p> : null}

          {list.isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : list.isError ? (
            <ErrorState message={getErrorMessage(list.error)} onRetry={() => list.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState
              title="No eligible panelists found"
              description="Only active, verified panelists are listed. You can verify a panelist from their profile."
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <div className="flex items-center gap-3 border-b bg-muted/50 px-4 py-2 text-sm">
                <Checkbox
                  checked={allOnPageSelected}
                  onCheckedChange={(value) => togglePage(value === true)}
                  aria-label="Select all on this page"
                />
                <span>Select all on this page</span>
              </div>
              <div className="divide-y md:hidden">
                {rows.map((panelist) => {
                  const name = fullName(panelist.firstName, panelist.lastName) || panelist.email
                  return (
                    <label key={panelist.id} className="flex cursor-pointer items-start gap-3 px-4 py-3 text-sm hover:bg-muted/40">
                      <Checkbox
                        checked={selected.has(panelist.id)}
                        onCheckedChange={(value) =>
                          toggle({ id: panelist.id, name, email: panelist.email }, value === true)
                        }
                      />
                      <span>
                        <span className="font-medium">{name}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          ID {panelist.id} · {panelist.email}
                        </span>
                        <span className="mt-1 flex flex-wrap gap-1">
                          <PanelistStatusBadge status={panelist.status} />
                          <VerificationBadge verified={panelist.isVerified} />
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
              <div className="hidden md:block">
                {rows.map((panelist) => {
                  const name = fullName(panelist.firstName, panelist.lastName) || panelist.email
                  return (
                    <label
                      key={panelist.id}
                      className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted/40 has-[[data-state=checked]]:bg-primary/[0.06]"
                    >
                      <Checkbox
                        checked={selected.has(panelist.id)}
                        onCheckedChange={(value) =>
                          toggle({ id: panelist.id, name, email: panelist.email }, value === true)
                        }
                      />
                      <span className="min-w-0 flex-1 font-medium">{name}</span>
                      <span className="hidden text-muted-foreground sm:inline">ID {panelist.id}</span>
                      <span className="truncate text-xs text-muted-foreground">{panelist.email}</span>
                      <span className="hidden items-center gap-1 lg:flex">
                        <VerificationBadge verified={panelist.isVerified} />
                      </span>
                    </label>
                  )
                })}
              </div>
              <div className="border-t px-3">
                <PaginationBar
                  page={list.data?.page ?? page}
                  pageSize={list.data?.pageSize ?? 8}
                  total={list.data?.total ?? 0}
                  onPageChange={setPage}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 text-sm">
          <div className="grid gap-3 rounded-lg border bg-surface/50 p-4 sm:grid-cols-2">
            <p className="sm:col-span-2">
              <span className="text-muted-foreground">Survey:</span> {summary.surveyName}
            </p>
            <p className="sm:col-span-2 break-all">
              <span className="text-muted-foreground">Survey URL:</span>{' '}
              <span className="font-mono text-xs">{summary.surveyUrl}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Selected panelists:</span> {summary.panelistCount}
            </p>
            <p>
              <span className="text-muted-foreground">Points per panelist:</span>{' '}
              {formatNumber(summary.rewardPointsPerPanelist)}
            </p>
            <p>
              <span className="text-muted-foreground">Maximum total points:</span>{' '}
              {formatNumber(summary.totalRewardPoints)}
            </p>
            {summary.remark ? (
              <p className="sm:col-span-2">
                <span className="text-muted-foreground">Remark:</span> {summary.remark}
              </p>
            ) : null}
          </div>
          <ScrollArea className="h-48 rounded-lg border">
            <ul className="divide-y">
              {summary.panelists.map((panelist) => (
                <li key={panelist.id} className="px-4 py-2.5">
                  <p className="font-medium">{panelist.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ID {panelist.id} · {panelist.email}
                  </p>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}

      <DialogFooter>
        {step === 'review' ? (
          <Button variant="outline" onClick={() => setStep('select')} disabled={pending}>
            Back
          </Button>
        ) : (
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
        )}
        {step === 'select' ? (
          <Button onClick={goToReview}>
            Review assignment
          </Button>
        ) : (
          <Button onClick={submit} disabled={pending || !canReview}>
            {pending ? 'Assigning…' : `Assign to ${summary.panelistCount} panelist${summary.panelistCount === 1 ? '' : 's'}`}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  )
}
