import { asNumber, asString } from '@/lib/mappers'
import type { ApiPanelistAnswer } from '@/types/api'
import type { OnboardingAnswer } from '@/types'

export interface OnboardingQuestion {
  id: string
  question: string
  fieldType: string
  stepNo: number
  displayOrder: number
  options: { id: string; label: string }[]
}

export function mapOnboardingCatalog(data: unknown): OnboardingQuestion[] {
  const record = asRecord(data)
  const steps = Array.isArray(record?.steps) ? record.steps : []
  const questions: OnboardingQuestion[] = []
  for (const step of steps) {
    const stepRecord = asRecord(step)
    const list = Array.isArray(stepRecord?.questions) ? stepRecord.questions : []
    for (const item of list) {
      const question = asRecord(item)
      if (!question) continue
      const text = asString(question.question_text).trim()
      const id = asString(question.id)
      if (!id && !text) continue
      questions.push({
        id,
        question: text,
        fieldType: asString(question.field_type).trim() || 'text',
        stepNo: asNumber(question.step_no ?? stepRecord?.step_no),
        displayOrder: asNumber(question.display_order, questions.length + 1),
        options: (Array.isArray(question.options) ? question.options : []).flatMap((option) => {
          const row = asRecord(option)
          if (!row) return []
          const label = asString(row.name ?? row.option_text ?? row.label).trim()
          const optionId = asString(row.id)
          if (!optionId && !label) return []
          return [{ id: optionId || label, label: label || optionId }]
        }),
      })
    }
  }
  return questions
}

/** Fill answer_text from dropdown/radio/checkbox option ids when the API omits the label. */
export function resolvePanelistAnswers(
  answers: ApiPanelistAnswer[],
  catalog: OnboardingQuestion[],
): ApiPanelistAnswer[] {
  const byId = new Map(catalog.map((question) => [question.id, question]))
  return answers.map((answer) => {
    const question = byId.get(asString(answer.question_id))
    const text = resolvedLabel(answer, question)
    if (!text || text === (answer.answer_text ?? '').trim()) return answer
    return { ...answer, answer_text: text }
  })
}

export function buildOnboardingAnswers(
  answers: ApiPanelistAnswer[],
  catalog: OnboardingQuestion[],
): OnboardingAnswer[] {
  const byId = new Map(catalog.map((question) => [question.id, question]))
  const groups = new Map<string, ApiPanelistAnswer[]>()
  const order: string[] = []
  for (const answer of answers) {
    const key = asString(answer.question_id) || (answer.question_text ?? '').trim() || asString(answer.id)
    if (!key) continue
    if (!groups.has(key)) {
      groups.set(key, [])
      order.push(key)
    }
    groups.get(key)?.push(answer)
  }

  return order
    .map((key) => {
      const rows = groups.get(key) ?? []
      const question = byId.get(asString(rows[0]?.question_id)) ?? byId.get(key)
      const selectedIds = unique(
        rows.flatMap((row) => refIds(row)).filter((id) => !question || question.options.some((option) => option.id === id)),
      )
      const labels = unique([
        ...selectedIds.flatMap((id) => {
          const option = question?.options.find((item) => item.id === id)
          return option ? [option.label] : []
        }),
        ...rows.flatMap((row) => splitAnswerText(row.answer_text)),
      ])
      const matchedIds = unique([
        ...selectedIds,
        ...labels.flatMap((label) => {
          const option = question?.options.find((item) => item.label.toLowerCase() === label.toLowerCase())
          return option ? [option.id] : []
        }),
      ])
      const text = labels.join(', ')
      const title = question?.question || (rows[0]?.question_text ?? '').trim()
      if (!title && !text) return null
      return {
        id: question?.id || key,
        question: title || 'Answer',
        answer: text,
        fieldType: question?.fieldType || 'text',
        options: question?.options ?? [],
        selectedIds: matchedIds,
      }
    })
    .filter((item): item is OnboardingAnswer => item !== null)
    .sort((left, right) => questionRank(left.id, catalog) - questionRank(right.id, catalog))
}

function resolvedLabel(answer: ApiPanelistAnswer, question?: OnboardingQuestion) {
  const names = unique(
    refIds(answer).flatMap((id) => {
      const option = question?.options.find((item) => item.id === id)
      return option ? [option.label] : []
    }),
  )
  const text = (answer.answer_text ?? '').trim()
  if (names.length && text && !names.some((name) => name.toLowerCase() === text.toLowerCase())) {
    return unique([...names, ...splitAnswerText(text)]).join(', ')
  }
  if (names.length) return names.join(', ')
  return text
}

function refIds(answer: ApiPanelistAnswer) {
  return [answer.answer_ref_id, ...(answer.answer_ref_ids ?? [])]
    .filter((id) => id !== null && id !== undefined && String(id).trim() !== '')
    .map((id) => String(id))
}

function splitAnswerText(value?: string | null) {
  const text = value?.trim() ?? ''
  if (!text) return []
  if (text.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(text)
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean)
    } catch {
      // Keep the original text when it is not a JSON list.
    }
  }
  if (/[,|;]/.test(text)) return text.split(/\s*[,|;]\s*/).filter(Boolean)
  return [text]
}

function questionRank(id: string, catalog: OnboardingQuestion[]) {
  const index = catalog.findIndex((question) => question.id === id)
  if (index === -1) return Number.MAX_SAFE_INTEGER
  const question = catalog[index]
  return question.stepNo * 1000 + question.displayOrder
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function asRecord(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}
