import { ChevronDown, Download, Upload } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Field } from '@/components/shared/Field'
import { PageHeader } from '@/components/shared/PageHeader'
import { PaginationBar } from '@/components/shared/PaginationBar'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/shared/PageState'
import { VerificationBadge } from '@/components/shared/StatusBadge'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useAssignmentPanelists, useOnboardingQuestions } from '@/hooks/usePanelists'
import { useAssignPanelists, useSurveyTemplateDownload, useSurveyTemplateImport } from '@/hooks/useProjects'
import { getErrorMessage } from '@/lib/errors'
import { formatNumber } from '@/lib/format'
import { fullName } from '@/lib/labels'
import { activeQuestionnaireFilters, toPanelistAnswerQuery, type QuestionnaireFilter } from '@/lib/questionnaireFilter'
import {
  SURVEY_NAME_MAX_LENGTH,
  validatePoints,
  validateSurveyName,
  validateSurveyUrl,
} from '@/lib/validators'
import type { SelectedPanelist } from '@/types'
import type { OnboardingQuestion } from '@/lib/onboardingAnswers'

const PAGE_SIZE = 8

export function AssignedProjectPage() {
  const questions = useOnboardingQuestions()
  const [step, setStep] = useState<'select' | 'review'>('select')
  const [detailsOpen, setDetailsOpen] = useState(true)
  const [surveyName, setSurveyName] = useState('')
  const [surveyUrl, setSurveyUrl] = useState('')
  const [rewardPoints, setRewardPoints] = useState('')
  const [remark, setRemark] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<QuestionnaireFilter[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selected, setSelected] = useState<Map<string, SelectedPanelist>>(new Map())
  const assign = useAssignPanelists(() => {
    setSelected(new Map())
    setStep('select')
  })
  const download = useSurveyTemplateDownload()
  const csvImport = useSurveyTemplateImport()
  const fileInput = useRef<HTMLInputElement>(null)
  const [csvError, setCsvError] = useState('')
  const [csvMessage, setCsvMessage] = useState('')
  const [attempted, setAttempted] = useState(false)
  const debouncedName = useDebouncedValue(name)
  const debouncedEmail = useDebouncedValue(email)
  const debouncedPhone = useDebouncedValue(phone)
  const searchPending = name !== debouncedName || email !== debouncedEmail || phone !== debouncedPhone
  const activeFilters = useMemo(() => activeQuestionnaireFilters(filters), [filters])
  const catalog = questions.data ?? []
  const answerQuery = useMemo(
    () => toPanelistAnswerQuery(activeFilters, questions.data ?? []),
    [activeFilters, questions.data],
  )
  const list = useAssignmentPanelists({
    name: debouncedName,
    email: debouncedEmail,
    phone: debouncedPhone,
    page,
    pageSize: PAGE_SIZE,
    filters: activeFilters,
  })
  const rows = list.data?.data ?? []
  const points = Number(rewardPoints)
  const panelists = [...selected.values()]
  const validation = {
    surveyName: validateSurveyName(surveyName) ?? '',
    surveyUrl: validateSurveyUrl(surveyUrl) ?? '',
    panelists: selected.size ? '' : 'Select at least one panelist.',
    rewardPoints: validatePoints(rewardPoints, 'Reward points') ?? '',
  }
  const canReview = Object.values(validation).every((value) => !value)
  const pageIds = rows.map((item) => item.id)
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const show = (key: keyof typeof validation) => (attempted ? validation[key] : undefined)

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

  function applyFilters(next: QuestionnaireFilter[]) {
    setFilters(activeQuestionnaireFilters(next))
    setPage(1)
    setFiltersOpen(false)
  }

  function clearFilters() {
    setFilters([])
    setPage(1)
  }

  async function downloadCsv() {
    setCsvError('')
    setCsvMessage('')
    try {
      const blob = await download.mutateAsync({
        name: debouncedName,
        email: debouncedEmail,
        phone: debouncedPhone,
        answers: answerQuery,
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'survey-assignment-template.csv'
      link.click()
      URL.revokeObjectURL(url)
      setCsvMessage('The template downloaded. It lists active panelists matching the current search and answer filters, with blank survey columns.')
    } catch (error) {
      setCsvMessage('')
      setCsvError(getErrorMessage(error))
    }
  }

  async function uploadCsv(file: File | undefined) {
    setCsvError('')
    setCsvMessage('')
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv') || file.size === 0) {
      setCsvError('Choose a non-empty CSV file from the survey assignment template.')
      return
    }
    try {
      await csvImport.mutateAsync(file)
      setCsvMessage('The CSV uploaded. Blank rows are skipped. Points stay on each assignment until an admin marks it complete.')
    } catch (error) {
      setCsvMessage('')
      setCsvError(getErrorMessage(error))
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  function goToReview() {
    setAttempted(true)
    if (!canReview) {
      setDetailsOpen(true)
      return
    }
    setStep('review')
  }

  function submit() {
    if (assign.isPending || !canReview) return
    assign.mutate({
      surveyName: surveyName.trim(),
      surveyUrl: surveyUrl.trim(),
      panelistIds: [...new Set(panelists.map((item) => item.id))],
      rewardPoints: points,
      remark: remark.trim() || undefined,
    })
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Assigned Project"
        description="Assign one survey URL and point value to selected panelists, or download a CSV so each panelist can have a different URL."
      />

      <section className="rounded-2xl border bg-card">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          aria-expanded={detailsOpen}
          onClick={() => setDetailsOpen((open) => !open)}
        >
          <span className="font-medium">Assignment Details</span>
          <ChevronDown className={`size-4 shrink-0 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
        </button>
        {detailsOpen ? (
          <div className="space-y-3 border-t px-4 py-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Survey / project name" error={show('surveyName')}>
                <Input
                  value={surveyName}
                  maxLength={SURVEY_NAME_MAX_LENGTH}
                  placeholder="e.g. Brand feedback Q3"
                  onChange={(event) => setSurveyName(event.target.value.slice(0, SURVEY_NAME_MAX_LENGTH))}
                />
              </Field>
              <Field label="Survey URL" error={show('surveyUrl')} hint="Use {panelist_id} if the vendor should receive that id.">
                <Input
                  value={surveyUrl}
                  placeholder="https://surveys.example.com/s/brand?uid={panelist_id}"
                  onChange={(event) => setSurveyUrl(event.target.value)}
                />
              </Field>
              <Field label="Reward points per panelist" error={show('rewardPoints')}>
                <PointsInput value={rewardPoints} placeholder="e.g. 100" onValueChange={setRewardPoints} />
              </Field>
            </div>
            <Field label="Remarks">
              <Textarea
                value={remark}
                placeholder="Internal note for this assignment"
                onChange={(event) => setRemark(event.target.value)}
              />
            </Field>
          </div>
        ) : null}
      </section>

      <section className="space-y-3 rounded-2xl border bg-card p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-medium">Search and Select Panelists</h2>
          <p className="text-sm text-muted-foreground tabular-nums">
            {selected.size} selected · {formatNumber(selected.size * (Number.isFinite(points) ? points : 0))} pts total
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <div className="grid w-full min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
            <Input
              className="w-full"
              value={name}
              placeholder="Name"
              aria-label="Name"
              onChange={(event) => {
                setName(event.target.value)
                setPage(1)
              }}
            />
            <Input
              className="w-full"
              value={email}
              placeholder="Email"
              aria-label="Email"
              inputMode="email"
              onChange={(event) => {
                setEmail(event.target.value)
                setPage(1)
              }}
            />
            <Input
              className="w-full"
              value={phone}
              placeholder="Mobile number"
              aria-label="Mobile number"
              inputMode="tel"
              onChange={(event) => {
                setPhone(event.target.value)
                setPage(1)
              }}
            />
          </div>
          <Button type="button" variant="outline" className="shrink-0 self-end sm:self-auto" onClick={() => setFiltersOpen(true)}>
            Advanced Filters
            {activeFilters.length ? ` (${activeFilters.length})` : ''}
          </Button>
        </div>
        {searchPending ? <p className="text-xs text-muted-foreground">Searching…</p> : null}
        {activeFilters.length ? (
          <p className="text-xs text-muted-foreground">
            {activeFilters.length} questionnaire {activeFilters.length === 1 ? 'filter is' : 'filters are'} applied with AND, before pagination.
          </p>
        ) : null}
        {show('panelists') ? <p className="text-xs text-destructive">{show('panelists')}</p> : null}

        {list.isLoading ? (
          <LoadingSkeleton rows={4} />
        ) : list.isError ? (
          <ErrorState message={getErrorMessage(list.error)} onRetry={() => list.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No panelists found."
            description="The list shows active panelists returned for this search and these answer filters."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border">
            <div className="flex items-center gap-3 border-b bg-secondary/40 px-4 py-2 text-sm">
              <Checkbox
                checked={allOnPageSelected}
                onCheckedChange={(value) => togglePage(value === true)}
                aria-label="Select all on this page"
              />
              <span>Select all on this page</span>
            </div>
            <div className="divide-y">
              {rows.map((panelist) => {
                const name = fullName(panelist.firstName, panelist.lastName) || panelist.email
                return (
                  <label key={panelist.id} className="flex items-start gap-3 px-4 py-3 text-sm md:items-center">
                    <Checkbox
                      checked={selected.has(panelist.id)}
                      onCheckedChange={(value) => toggle({ id: panelist.id, name, email: panelist.email }, value === true)}
                    />
                    <span className="min-w-0 flex-1 font-medium">{name}</span>
                    <span className="hidden text-muted-foreground sm:inline">ID {panelist.id}</span>
                    <span className="truncate text-xs text-muted-foreground">{panelist.email}</span>
                    <span className="hidden text-xs text-muted-foreground lg:inline">{panelist.phone || '—'}</span>
                    <span className="hidden lg:flex">
                      <VerificationBadge verified={panelist.isVerified} />
                    </span>
                  </label>
                )
              })}
            </div>
            <div className="px-3">
              <PaginationBar
                page={list.data?.page ?? page}
                pageSize={list.data?.pageSize ?? PAGE_SIZE}
                total={list.data?.total ?? 0}
                onPageChange={setPage}
              />
            </div>
          </div>
        )}

        {step === 'review' ? (
          <div className="space-y-3 text-sm">
            <div className="grid gap-2 rounded-2xl border bg-secondary/30 p-4 sm:grid-cols-2">
              <p className="sm:col-span-2">
                <span className="text-muted-foreground">Survey / project:</span> {surveyName.trim()}
              </p>
              <p className="break-all sm:col-span-2">
                <span className="text-muted-foreground">Survey URL:</span> {surveyUrl.trim()}
              </p>
              <p>
                <span className="text-muted-foreground">Panelists:</span> {selected.size}
              </p>
              <p>
                <span className="text-muted-foreground">Points each:</span> {formatNumber(points)}
              </p>
              {remark.trim() ? (
                <p className="sm:col-span-2">
                  <span className="text-muted-foreground">Remarks:</span> {remark.trim()}
                </p>
              ) : null}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('select')} disabled={assign.isPending}>
                Back
              </Button>
              <Button onClick={submit} disabled={assign.isPending || !canReview}>
                {assign.isPending ? 'Assigning…' : 'Assign panelists'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button onClick={goToReview}>Review assignment</Button>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border bg-card p-4">
        <h2 className="font-medium">Panelist CSV Import / Export</h2>
        <p className="text-sm text-muted-foreground">
          Download does not use the survey URL or points above. The file includes active panelists matching the current search and questionnaire filters, not only the rows checked in the table. Columns are id, name, email, survey_name, survey_url, and reward_points.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" variant="outline" onClick={() => void downloadCsv()} disabled={download.isPending}>
            <Download className="size-4" />
            {download.isPending ? 'Downloading…' : 'Download CSV'}
          </Button>
          <Button type="button" variant="outline" onClick={() => fileInput.current?.click()} disabled={csvImport.isPending}>
            <Upload className="size-4" />
            {csvImport.isPending ? 'Uploading…' : 'Upload CSV'}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => void uploadCsv(event.target.files?.[0])}
          />
        </div>
        {csvImport.isPending ? <p className="text-xs text-muted-foreground">Uploading the CSV…</p> : null}
        {csvError ? <p className="text-sm text-destructive">{csvError}</p> : null}
        {csvMessage ? <p className="text-sm text-foreground">{csvMessage}</p> : null}
      </section>

      <AdvancedFiltersDialog
        open={filtersOpen}
        catalog={catalog}
        loading={questions.isLoading}
        error={questions.isError ? getErrorMessage(questions.error) : ''}
        onRetry={() => questions.refetch()}
        applied={activeFilters}
        onOpenChange={setFiltersOpen}
        onApply={applyFilters}
        onClear={clearFilters}
      />
    </div>
  )
}

function AdvancedFiltersDialog({
  open,
  catalog,
  loading,
  error,
  onRetry,
  applied,
  onOpenChange,
  onApply,
  onClear,
}: {
  open: boolean
  catalog: OnboardingQuestion[]
  loading: boolean
  error: string
  onRetry: () => void
  applied: QuestionnaireFilter[]
  onOpenChange: (open: boolean) => void
  onApply: (filters: QuestionnaireFilter[]) => void
  onClear: () => void
}) {
  const [draft, setDraft] = useState<QuestionnaireFilter[]>(applied)
  const [questionId, setQuestionId] = useState('')
  const [optionIds, setOptionIds] = useState<string[]>([])
  const [answerText, setAnswerText] = useState('')
  const [optionSearch, setOptionSearch] = useState('')
  const [seenOpen, setSeenOpen] = useState(open)
  if (open !== seenOpen) {
    setSeenOpen(open)
    if (open) setDraft(applied.map((filter) => ({ ...filter, optionIds: [...filter.optionIds] })))
  }
  const chosen = catalog.find((question) => question.id === questionId)
  const visibleOptions = (chosen?.options ?? []).filter((option) =>
    option.label.toLowerCase().includes(optionSearch.trim().toLowerCase()),
  )

  function addFilter() {
    if (!questionId || (!optionIds.length && !answerText.trim())) return
    const next: QuestionnaireFilter = { questionId, optionIds: [...optionIds], text: answerText.trim() }
    setDraft((current) => [...current.filter((item) => item.questionId !== questionId), next])
    setOptionIds([])
    setAnswerText('')
    setOptionSearch('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Advanced Filters</DialogTitle>
          <DialogDescription>
            Questions and options come from the onboarding questionnaire. Every selected answer is required.
          </DialogDescription>
        </DialogHeader>
        {loading ? <LoadingSkeleton rows={3} /> : null}
        {error ? <ErrorState message={error} onRetry={onRetry} /> : null}
        {catalog.length ? (
          <div className="space-y-3">
            <Select
              value={questionId || undefined}
              onValueChange={(value) => {
                setQuestionId(value)
                setOptionIds([])
                setAnswerText('')
                setOptionSearch('')
              }}
            >
              <SelectTrigger className="w-full" aria-label="Questionnaire question">
                <SelectValue placeholder="Choose a question" />
              </SelectTrigger>
              <SelectContent>
                {catalog.map((question) => (
                  <SelectItem key={question.id} value={question.id}>
                    {question.question}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {chosen?.options.length ? (
              <div className="space-y-2">
                <Input
                  value={optionSearch}
                  placeholder="Find an answer option"
                  onChange={(event) => setOptionSearch(event.target.value)}
                />
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border p-2">
                  {visibleOptions.map((option) => (
                    <label key={option.id} className="flex items-center gap-2 px-1 py-1 text-sm">
                      <Checkbox
                        checked={optionIds.includes(option.id)}
                        onCheckedChange={(value) =>
                          setOptionIds((current) => {
                            if (value !== true) return current.filter((id) => id !== option.id)
                            if (chosen.fieldType === 'checkbox') return [...current, option.id]
                            return [option.id]
                          })
                        }
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : chosen ? (
              <Input
                value={answerText}
                placeholder="Exact saved answer"
                onChange={(event) => setAnswerText(event.target.value)}
              />
            ) : null}
            <Button type="button" variant="outline" onClick={addFilter} disabled={!questionId || (!optionIds.length && !answerText.trim())}>
              Add filter
            </Button>
            {draft.length ? (
              <ul className="flex flex-wrap gap-2">
                {draft.map((filter) => {
                  const question = catalog.find((item) => item.id === filter.questionId)
                  const labels = filter.optionIds.map(
                    (id) => question?.options.find((option) => option.id === id)?.label || id,
                  )
                  const value = [...labels, filter.text].filter(Boolean).join(', ')
                  return (
                    <li key={filter.questionId}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setDraft((current) => current.filter((item) => item.questionId !== filter.questionId))}
                      >
                        {question?.question || `Question ${filter.questionId}`}: {value} ×
                      </Button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No questionnaire filters yet.</p>
            )}
          </div>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDraft([])
              onClear()
            }}
          >
            Clear Filters
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              const pending =
                questionId && (optionIds.length || answerText.trim())
                  ? [{ questionId, optionIds: [...optionIds], text: answerText.trim() }]
                  : []
              const merged = [...draft.filter((item) => item.questionId !== questionId), ...pending]
              onApply(merged)
            }}
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
