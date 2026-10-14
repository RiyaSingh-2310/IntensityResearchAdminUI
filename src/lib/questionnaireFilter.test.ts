import assert from 'node:assert/strict'
import test from 'node:test'
import { buildOnboardingAnswers, mapOnboardingCatalog, resolvePanelistAnswers } from './onboardingAnswers.ts'
import { matchesQuestionnaire, toPanelistAnswerQuery, type QuestionnaireFilter } from './questionnaireFilter.ts'

const catalog = mapOnboardingCatalog({
  steps: [
    {
      step_name: 'Demographics',
      step_no: 2,
      questions: [
        {
          id: 1,
          question_text: 'What is your age range?',
          field_type: 'dropdown',
          display_order: 1,
          options: [
            { id: 5, name: '18-24' },
            { id: 6, name: '25-34' },
          ],
        },
        {
          id: 5,
          question_text: 'What is your education level?',
          field_type: 'dropdown',
          display_order: 5,
          options: [
            { id: 20, name: 'High School' },
            { id: 23, name: "Bachelor's Degree" },
          ],
        },
      ],
    },
    {
      step_name: 'Lifestyle',
      step_no: 3,
      questions: [
        {
          id: 16,
          question_text: 'Shopping interest categories',
          field_type: 'checkbox',
          display_order: 5,
          options: [
            { id: 40, name: 'Fashion & Apparel' },
            { id: 42, name: 'Health & Beauty' },
          ],
        },
      ],
    },
  ],
})

function answers(rows: { question_id: number; answer_ref_id?: number; answer_ref_ids?: number[]; answer_text?: string }[]) {
  return buildOnboardingAnswers(resolvePanelistAnswers(rows, catalog), catalog)
}

test('questionnaire filters match age, education, and lifestyle option ids together', () => {
  const saved = answers([
    { question_id: 1, answer_ref_id: 6 },
    { question_id: 5, answer_ref_id: 23 },
    { question_id: 16, answer_ref_ids: [40, 42] },
  ])
  const filters: QuestionnaireFilter[] = [
    { questionId: '1', optionIds: ['6'], text: '' },
    { questionId: '5', optionIds: ['23'], text: '' },
    { questionId: '16', optionIds: ['42'], text: '' },
  ]
  assert.equal(matchesQuestionnaire(saved, filters), true)
  assert.equal(matchesQuestionnaire(saved, [{ questionId: '1', optionIds: ['5'], text: '' }]), false)
})

test('a panelist without that question does not match, and blank filters do not exclude anyone', () => {
  const saved = answers([{ question_id: 1, answer_ref_id: 5 }])
  assert.equal(matchesQuestionnaire(saved, [{ questionId: '5', optionIds: ['23'], text: '' }]), false)
  assert.equal(matchesQuestionnaire(saved, [{ questionId: '1', optionIds: [], text: '   ' }]), true)
})

test('unauthenticated panelist list with answer filters is rejected and not missing', async () => {
  const answers = encodeURIComponent(JSON.stringify([{ question_id: 1, answer: '25-34' }]))
  const response = await fetch(
    `https://intensityresearch.com/intensityapi/admin/panelists?status=active&page=1&limit=8&answers=${answers}`,
  )
  assert.equal(response.status, 401)
})

test('live GET /questions includes age, education, and lifestyle questions', async () => {
  const response = await fetch('https://intensityresearch.com/intensityapi/questions')
  assert.equal(response.status, 200)
  const body: unknown = await response.json()
  const data = body && typeof body === 'object' && 'data' in body ? body.data : body
  const live = mapOnboardingCatalog(data)
  const texts = live.map((question) => question.question)
  assert.ok(texts.includes('What is your age range?'))
  assert.ok(texts.includes('What is your education level?'))
  assert.ok(live.some((question) => question.question === 'Shopping interest categories' && question.options.length > 0))
})

test('text filters use the saved answer, not another panelist answer', () => {
  const saved = answers([{ question_id: 1, answer_text: '25-34' }])
  assert.equal(matchesQuestionnaire(saved, [{ questionId: '1', optionIds: [], text: '25-34' }]), true)
  assert.equal(matchesQuestionnaire(saved, [{ questionId: '1', optionIds: [], text: '65+' }]), false)
})

test('answer query uses documented AND objects and keeps option labels', () => {
  const query = toPanelistAnswerQuery(
    [
      { questionId: '1', optionIds: ['6'], text: '' },
      { questionId: '5', optionIds: ['23'], text: '' },
      { questionId: '21', optionIds: [], text: 'California' },
    ],
    catalog,
  )
  assert.deepEqual(query, [
    { question_id: 1, answer_ref_id: 6, answer: '25-34' },
    { question_id: 5, answer_ref_id: 23, answer: "Bachelor's Degree" },
    { question_id: 21, answer: 'California' },
  ])
})
