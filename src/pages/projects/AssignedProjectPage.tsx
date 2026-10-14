import { useMemo, useState } from 'react'
import { SearchField } from '@/components/common/SearchField'
import { Field } from '@/components/shared/Field'
import { PageHeader } from '@/components/shared/PageHeader'
import { PaginationBar } from '@/components/shared/PaginationBar'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/shared/PageState'
import { VerificationBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { PointsInput } from '@/components/ui/points-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useAssignmentPanelists, useOnboardingQuestions } from '@/hooks/usePanelists'
import { useAssignPanelists } from '@/hooks/useProjects'
import { getErrorMessage } from '@/lib/errors'
import { formatNumber } from '@/lib/format'
import { fullName } from '@/lib/labels'
import { activeQuestionnaireFilters, type QuestionnaireFilter } from '@/lib/questionnaireFilter'
import {
  SURVEY_NAME_MAX_LENGTH,
  validatePoints,
  validateSurveyName,
  validateSurveyUrl,
} from '@/lib/validators'
import type { SelectedPanelist } from '@/types'

const PAGE_SIZE = 8

export function AssignedProjectPage() {
  const questions = useOnboardingQuestions()
  const [step, setStep] = useState<'select' | 'review'>('select')
  const [surveyName, setSurveyName] = useState('')
  const [surveyUrl, setSurveyUrl] = useState('')
  const [rewardPoints, setRewardPoints] = useState('')
  const [remark, setRemark] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<QuestionnaireFilter[]>([])
  const [questionId, setQuestionId] = useState('')
  const [optionIds, setOptionIds] = useState<string[]>([])
  const [answerText, setAnswerText] = useState('')
  const [optionSearch, setOptionSearch] = useState('')
  const [selected, setSelected] = useState<Map<string, SelectedPanelist>>(new Map())
  const assign = useAssignPanelists(() => {
    setSelected(new Map())
    setStep('select')
  })
  const [attempted, setAttempted] = useState(false)
  const debouncedSearch = useDebouncedValue(search)
  const activeFilters = useMemo(() => activeQuestionnaireFilters(filters), [filters])
  const list = useAssignmentPanelists({
    search: debouncedSearch,
    page,
    pageSize: PAGE_SIZE,
    filters: activeFilters,
  })
  const rows = list.data?.data ?? []
  const catalog = questions.data ?? []
  const chosenQuestion = catalog.find((question) => question.id === questionId)
  const visibleOptions = (chosenQuestion?.options ?? []).filter((option) =>
    option.label.toLowerCase().includes(optionSearch.trim().toLowerCase()),
  )
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

  function addFilter() {
    if (!questionId) return
    const next: QuestionnaireFilter = {
      questionId,
      optionIds: [...optionIds],
      text: answerText.trim(),
    }
    if (!next.optionIds.length && !next.text) return
    setFilters((current) => [...current.filter((item) => item.questionId !== questionId), next])
    setPage(1)
    setOptionIds([])
    setAnswerText('')
    setOptionSearch('')
  }

  function goToReview() {
    setAttempted(true)
    if (!canReview) return
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
    <div>
      <PageHeader
        title="Assigned Project"
        description="Search active panelists by name or email, narrow them by saved onboarding answers, then assign one survey URL and reward point value."
      />

      {step === 'review' ? (
        <div className="space-y-4 text-sm">
          <div className="grid gap-3 rounded-2xl border bg-secondary/30 p-4 sm:grid-cols-2">
            <p className="sm:col-span-2">
              <span className="text-muted-foreground">Survey / project:</span> {surveyName.trim()}
            </p>
            <p className="break-all sm:col-span-2">
              <span className="text-muted-foreground">Survey URL:</span> {surveyUrl.trim()}
            </p>
            <p>
              <span className="text-muted-foreground">Selected panelists:</span> {selected.size}
            </p>
            <p>
              <span className="text-muted-foreground">Points per panelist:</span> {formatNumber(points)}
            </p>
            <p>
              <span className="text-muted-foreground">Total potential points:</span>{' '}
              {formatNumber(selected.size * (Number.isFinite(points) ? points : 0))}
            </p>
            {remark.trim() ? (
              <p className="sm:col-span-2">
                <span className="text-muted-foreground">Remark:</span> {remark.trim()}
              </p>
            ) : null}
          </div>
          <ul className="divide-y rounded-2xl border">
            {panelists.map((panelist) => (
              <li key={panelist.id} className="px-4 py-2.5">
                <p className="font-medium">{panelist.name}</p>
                <p className="text-xs text-muted-foreground">
                  ID {panelist.id} · {panelist.email}
                </p>
              </li>
            ))}
          </ul>
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
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Survey / project name" className="sm:col-span-2" error={show('surveyName')}>
              <Input
                value={surveyName}
                maxLength={SURVEY_NAME_MAX_LENGTH}
                placeholder="e.g. Brand feedback Q3"
                onChange={(event) => setSurveyName(event.target.value.slice(0, SURVEY_NAME_MAX_LENGTH))}
              />
            </Field>
            <Field
              label="Survey URL"
              className="sm:col-span-2"
              error={show('surveyUrl')}
              hint="One URL is sent for every selected panelist. Use {panelist_id} if the vendor should receive that id."
            >
              <Input
                value={surveyUrl}
                placeholder="https://surveys.example.com/s/brand?uid={panelist_id}"
                onChange={(event) => setSurveyUrl(event.target.value)}
              />
            </Field>
            <Field label="Reward points per panelist" error={show('rewardPoints')}>
              <PointsInput value={rewardPoints} placeholder="e.g. 100" onValueChange={setRewardPoints} />
            </Field>
            <div className="flex min-h-9 items-center text-sm text-muted-foreground sm:justify-end sm:pt-6">
              <span className="tabular-nums">
                {selected.size} selected · {formatNumber(selected.size * (Number.isFinite(points) ? points : 0))} pts total
              </span>
            </div>
            <Field label="Remark (optional)" className="sm:col-span-2">
              <Textarea value={remark} placeholder="Internal note for this assignment" onChange={(event) => setRemark(event.target.value)} />
            </Field>
          </div>

          <SearchField
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="Search panelists by name or email"
            searching={search !== debouncedSearch}
          />

          <div className="space-y-3 rounded-2xl border p-4">
            <p className="text-sm font-medium">Questionnaire answers</p>
            <p className="text-xs text-muted-foreground">
              Questions and options come from GET /questions. Each selected answer is sent to GET /admin/panelists as an answers filter, and the API applies them with AND before pagination.
            </p>
            {questions.isLoading ? <LoadingSkeleton rows={2} /> : null}
            {questions.isError ? (
              <ErrorState message={getErrorMessage(questions.error)} onRetry={() => questions.refetch()} />
            ) : null}
            {catalog.length ? (
              <div className="grid gap-3">
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
                {chosenQuestion?.options.length ? (
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
                                if (chosenQuestion.fieldType === 'checkbox') return [...current, option.id]
                                return [option.id]
                              })
                            }
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                      {visibleOptions.length === 0 ? (
                        <p className="px-1 py-2 text-xs text-muted-foreground">No options match that search.</p>
                      ) : null}
                    </div>
                  </div>
                ) : chosenQuestion ? (
                  <Input
                    value={answerText}
                    placeholder="Exact saved answer"
                    onChange={(event) => setAnswerText(event.target.value)}
                  />
                ) : null}
                <div>
                  <Button type="button" variant="outline" onClick={addFilter} disabled={!questionId || (!optionIds.length && !answerText.trim())}>
                    Add answer filter
                  </Button>
                </div>
              </div>
            ) : null}
            {activeFilters.length ? (
              <ul className="flex flex-wrap gap-2">
                {activeFilters.map((filter) => {
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
                        onClick={() => {
                          setFilters((current) => current.filter((item) => item.questionId !== filter.questionId))
                          setPage(1)
                        }}
                      >
                        {question?.question || `Question ${filter.questionId}`}: {value} ×
                      </Button>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>

          {show('panelists') ? <p className="text-xs text-destructive">{show('panelists')}</p> : null}
          {list.data?.notice ? <p className="text-xs text-muted-foreground">{list.data.notice}</p> : null}

          {list.isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : list.isError ? (
            <ErrorState message={getErrorMessage(list.error)} onRetry={() => list.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState
              title="No eligible panelists found."
              description="The list shows active panelists returned by the panelist API for this search and these answer filters."
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

          <div className="flex justify-end">
            <Button onClick={goToReview}>Review assignment</Button>
          </div>
        </div>
      )}
    </div>
  )
}
