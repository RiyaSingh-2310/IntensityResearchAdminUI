import type { OnboardingAnswer } from '@/types'

/** A saved onboarding answer constraint. Option ids come from GET /questions. */
export interface QuestionnaireFilter {
  questionId: string
  optionIds: string[]
  text: string
}

export function activeQuestionnaireFilters(filters: QuestionnaireFilter[]) {
  return filters.filter(
    (filter) => filter.questionId && (filter.optionIds.length > 0 || filter.text.trim().length > 0),
  )
}

export interface PanelistAnswerQuery {
  question_id: number
  answer?: string
  answer_ref_id?: number
}

/**
 * Documented GET /admin/panelists `answers` value.
 * Each selected option or exact text is its own object, and the API combines them with AND.
 */
export function toPanelistAnswerQuery(
  filters: QuestionnaireFilter[],
  questions: { id: string; options: { id: string; label: string }[] }[] = [],
): PanelistAnswerQuery[] {
  return activeQuestionnaireFilters(filters).flatMap((filter): PanelistAnswerQuery[] => {
    const questionId = Number(filter.questionId)
    if (!Number.isInteger(questionId) || questionId <= 0) return []
    const question = questions.find((item) => item.id === filter.questionId)
    if (filter.optionIds.length) {
      return filter.optionIds.flatMap((optionId): PanelistAnswerQuery[] => {
        const answerRefId = Number(optionId)
        if (!Number.isInteger(answerRefId) || answerRefId <= 0) return []
        const label = question?.options.find((option) => option.id === optionId)?.label.trim()
        return [
          {
            question_id: questionId,
            answer_ref_id: answerRefId,
            ...(label ? { answer: label } : {}),
          },
        ]
      })
    }
    const text = filter.text.trim()
    return text ? [{ question_id: questionId, answer: text }] : []
  })
}

/** Every active filter must match. Multiple options on one question are all required. */
export function matchesQuestionnaire(answers: OnboardingAnswer[], filters: QuestionnaireFilter[]) {
  return activeQuestionnaireFilters(filters).every((filter) => {
    const answer = answers.find((item) => item.id === filter.questionId)
    if (!answer) return false
    const text = filter.text.trim().toLowerCase()
    if (text && answer.answer.trim().toLowerCase() !== text) return false
    if (!filter.optionIds.length) return true
    const selected = new Set(answer.selectedIds)
    const parts = new Set(
      answer.answer
        .split(',')
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean),
    )
    return filter.optionIds.every((id) => {
      if (selected.has(id)) return true
      const label = answer.options.find((option) => option.id === id)?.label.toLowerCase()
      return Boolean(label && parts.has(label))
    })
  })
}
