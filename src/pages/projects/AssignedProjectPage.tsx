import { Download, Minus, Plus, Upload, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { SearchField } from '@/components/common/SearchField'
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
import { toast } from 'sonner'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useAssignmentPanelists, useOnboardingQuestions } from '@/hooks/usePanelists'
import { useAssignPanelists, useSurveyTemplateDownload, useSurveyTemplateImport } from '@/hooks/useProjects'
import {
  consolidateImportErrors,
  FILL_SURVEY_DETAILS,
  friendlyImportError,
  importNoticeDuration,
} from '@/lib/csvImportNotice'
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
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [surveyName, setSurveyName] = useState('')
  const [surveyUrl, setSurveyUrl] = useState('')
  const [rewardPoints, setRewardPoints] = useState('')
  const [remark, setRemark] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<QuestionnaireFilter[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selected, setSelected] = useState<Map<string, SelectedPanelist>>(new Map())
  const assign = useAssignPanelists(() => {
    setSelected(new Map())
    setStep('select')
  })
  const filteredDownload = useSurveyTemplateDownload()
  const csvImport = useSurveyTemplateImport()
  const fileInput = useRef<HTMLInputElement>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [csvFiles, setCsvFiles] = useState<SelectedCsv[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [exportError, setExportError] = useState('')
  const [attempted, setAttempted] = useState(false)
  const debouncedSearch = useDebouncedValue(search)
  const activeFilters = useMemo(() => activeQuestionnaireFilters(filters), [filters])
  const catalog = questions.data ?? []
  const answerQuery = useMemo(
    () => toPanelistAnswerQuery(activeFilters, questions.data ?? []),
    [activeFilters, questions.data],
  )
  const list = useAssignmentPanelists({
    search: debouncedSearch,
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

  async function saveCsv(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  async function downloadFiltered() {
    setExportError('')
    try {
      const blob = await filteredDownload.mutateAsync({
        search: debouncedSearch.trim() || undefined,
        answers: answerQuery,
      })
      await saveCsv(blob, 'filtered-panelists.csv')
    } catch (error) {
      setExportError(getErrorMessage(error))
    }
  }

  async function addCsvFiles(list: FileList | null) {
    if (!list?.length) return
    const picked = await Promise.all(
      [...list].map(async (file) => ({
        key: `${file.name}:${file.size}:${file.lastModified}`,
        file,
        problem: await csvProblem(file),
      })),
    )
    setCsvFiles((current) => {
      const keys = new Set(current.map((item) => item.key))
      return [...current, ...picked.filter((item) => !keys.has(item.key))]
    })
    dismissImportNotices()
    if (fileInput.current) fileInput.current.value = ''
  }

  async function uploadCsv() {
    const ready = csvFiles.filter((item) => !item.problem)
    const invalid = csvFiles.filter((item) => item.problem)
    dismissImportNotices()
    if (!ready.length) {
      showImportNotice(
        'error',
        consolidateImportErrors(
          invalid.length
            ? invalid.map((item) => ({ fileName: item.file.name, message: item.problem }))
            : [{ fileName: '', message: 'Choose at least one CSV file.' }],
        ),
      )
      return
    }
    setUploading(true)
    const failures: { key: string; fileName: string; message: string }[] = invalid.map((item) => ({
      key: item.key,
      fileName: item.file.name,
      message: item.problem,
    }))
    const failedKeys = new Set(invalid.map((item) => item.key))
    let uploaded = 0
    for (let index = 0; index < ready.length; index += 1) {
      const item = ready[index]
      setUploadProgress(`Uploading ${index + 1} of ${ready.length}: ${item.file.name}`)
      try {
        await csvImport.mutateAsync(item.file)
        uploaded += 1
      } catch (error) {
        failedKeys.add(item.key)
        failures.push({ key: item.key, fileName: item.file.name, message: getErrorMessage(error) })
      }
    }
    setUploading(false)
    setUploadProgress('')
    const notice = consolidateImportErrors(failures)
    const mixed = uploaded > 0 && failures.length > 0
    if (uploaded > 0) {
      showImportNotice('success', `${uploaded} ${uploaded === 1 ? 'file' : 'files'} uploaded.`, mixed)
    }
    if (notice) showImportNotice('error', notice, mixed)
    if (failures.length) {
      const distinct = new Set(failures.map((failure) => friendlyImportError(failure.message)))
      setCsvFiles((current) =>
        current
          .filter((item) => failedKeys.has(item.key))
          .map((item) => {
            if (distinct.size < 2) return { ...item, problem: '' }
            const failure = failures.find((entry) => entry.key === item.key)
            return failure ? { ...item, problem: friendlyImportError(failure.message) } : item
          }),
      )
      return
    }
    setCsvFiles([])
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
        description="Assign a survey manually to selected panelists, or import a CSV where each panelist has their own URL and points."
      />

      <section className="rounded-2xl border bg-card p-4">
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border bg-card">
          <button
            type="button"
            className="flex h-12 w-full items-center justify-between gap-3 px-4 text-left"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((open) => !open)}
          >
            <span className="font-medium">Assignment Details</span>
            {detailsOpen ? <Minus className="size-4 shrink-0" /> : <Plus className="size-4 shrink-0" />}
          </button>
          {detailsOpen ? (
            <div className="space-y-3 border-t px-4 py-4">
              <div className="grid gap-3">
                <Field label="Survey / project name" error={show('surveyName')}>
                  <Input
                    value={surveyName}
                    maxLength={SURVEY_NAME_MAX_LENGTH}
                    placeholder="e.g. Brand feedback Q3"
                    onChange={(event) => setSurveyName(event.target.value.slice(0, SURVEY_NAME_MAX_LENGTH))}
                  />
                </Field>
                <Field label="Survey URL" error={show('surveyUrl')} hint="Use {panelist_id} if the vendor should receive that ID.">
                  <Input
                    value={surveyUrl}
                    placeholder="https://surveys.example.com/s/brand?uid={panelist_id}"
                    onChange={(event) => setSurveyUrl(event.target.value)}
                  />
                </Field>
                <Field label="Reward points per panelist" error={show('rewardPoints')} hint="One URL is sent for every selected panelist.">
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

        <section className="overflow-hidden rounded-2xl border border-primary/30 bg-primary/5">
          <button
            type="button"
            className="flex h-12 w-full items-center justify-between gap-3 px-4 text-left"
            aria-expanded={bulkOpen}
            onClick={() => setBulkOpen((open) => !open)}
          >
            <span className="font-medium">Bulk Assignment (CSV)</span>
            {bulkOpen ? <Minus className="size-4 shrink-0" /> : <Plus className="size-4 shrink-0" />}
          </button>
          {bulkOpen ? (
            <div className="space-y-3 border-t border-primary/20 px-4 py-4">
              <p className="text-xs text-muted-foreground">
                Each file is uploaded separately. Fill id, survey_url, and reward_points. Blank rows are skipped. Points are not credited until an assignment is marked complete.
              </p>
              <Button type="button" variant="outline" className="h-9 w-full" onClick={() => fileInput.current?.click()} disabled={uploading}>
                Import CSV
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept=".csv,text/csv"
                multiple
                className="sr-only"
                aria-label="Import CSV"
                onChange={(event) => void addCsvFiles(event.target.files)}
              />
              {csvFiles.length ? (
                <ul className="space-y-2">
                  {csvFiles.map((item) => (
                    <li key={item.key} className="flex items-start justify-between gap-2 rounded-xl border bg-background px-3 py-2 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{item.file.name}</span>
                        {item.problem ? <span className="text-xs text-destructive">{item.problem}</span> : null}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Remove ${item.file.name}`}
                        disabled={uploading}
                        onClick={() => setCsvFiles((current) => current.filter((entry) => entry.key !== item.key))}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No files selected.</p>
              )}
              <Button type="button" className="h-9 w-full" onClick={() => void uploadCsv()} disabled={!csvFiles.length || uploading}>
                <Upload className="size-4" />
                {uploading ? 'Uploading…' : 'Upload CSV'}
              </Button>
              {uploadProgress ? <p className="text-xs text-muted-foreground">{uploadProgress}</p> : null}
            </div>
          ) : null}
        </section>
      </div>
      </section>

      <section className="w-full space-y-3 rounded-2xl border bg-card p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-medium">Search and Select Panelists</h2>
          <p className="text-sm text-muted-foreground tabular-nums">
            {selected.size} selected · {formatNumber(selected.size * (Number.isFinite(points) ? points : 0))} pts total
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1">
          <SearchField
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="Name, Email, Mobile Number"
            searching={search !== debouncedSearch}
          />
          </div>
          <Button type="button" variant="outline" className="h-9 shrink-0" onClick={() => setFiltersOpen(true)}>
            Advanced Filters
            {activeFilters.length ? ` (${activeFilters.length})` : ''}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 shrink-0"
            onClick={() => void downloadFiltered()}
            disabled={filteredDownload.isPending}
          >
            <Download className="size-4" />
            {filteredDownload.isPending ? 'Downloading…' : 'Download CSV'}
          </Button>
        </div>
        {exportError ? <p className="text-sm text-destructive">{exportError}</p> : null}
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

type SelectedCsv = { key: string; file: File; problem: string }

const TEMPLATE_COLUMNS = ['id', 'survey_url', 'reward_points']

async function csvProblem(file: File) {
  if (!file.name.toLowerCase().endsWith('.csv')) return 'Use a .csv file.'
  if (file.size === 0) return 'This file is empty.'
  const header = (await file.slice(0, 4096).text()).split(/\r?\n/, 1)[0] ?? ''
  const columns = header.split(',').map((part) => part.trim().replace(/^"|"$/g, '').toLowerCase())
  const missing = TEMPLATE_COLUMNS.filter((name) => !columns.includes(name))
  if (missing.includes('survey_url') && missing.includes('reward_points')) return FILL_SURVEY_DETAILS
  if (missing.includes('survey_url')) return 'Please fill Survey URL.'
  if (missing.includes('reward_points')) return 'Please fill Reward Points.'
  if (missing.length) return 'The CSV is missing a required column.'
  return ''
}

function dismissImportNotices() {
  toast.dismiss('csv-import-success')
  toast.dismiss('csv-import-error')
}

function showImportNotice(kind: 'success' | 'error', message: string, mixed = false) {
  if (!message) return
  const id = kind === 'success' ? 'csv-import-success' : 'csv-import-error'
  toast[kind](message, { id, duration: importNoticeDuration(message, mixed) })
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
