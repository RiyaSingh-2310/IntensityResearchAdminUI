import { asFlag, asNumber, asString, toIsoDate } from '@/lib/mappers'

export interface ProfileShowWhen {
  questionKey: string
  optionKeys: string[]
}

export interface ProfileOption {
  key: string
  text: string
  group: string
  isOther: boolean
}

export interface ProfileQuestion {
  id: string
  questionKey: string
  questionText: string
  helpText: string
  fieldType: string
  required: boolean
  displayOrder: number
  showWhen: ProfileShowWhen | null
  options: ProfileOption[]
}

export interface ProfileAnswer {
  questionKey: string
  questionText: string
  displayOrder: number
  optionKeys: string[]
  optionTexts: string[]
  answerText: string
}

export interface AdditionalProfile {
  id: string
  panelistId: string
  profileType: string
  title: string
  reference: string
  createdAt: string
  updatedAt: string
  metadata: { label: string; value: string }[]
  answers: ProfileAnswer[]
  questions: ProfileQuestion[]
}

export interface RenderedProfileField {
  id: string
  label: string
  helpText: string
  value: string
  order: number
  wide: boolean
}

const PROFILE_LIST_KEYS = ['profiles', 'additional_profiles', 'items', 'additionalProfiles']
const ANSWER_LIST_KEYS = ['answers', 'responses', 'questionnaire']
const RESERVED_PROFILE_KEYS = new Set([
  'id',
  'user_id',
  'panelist_id',
  'profile_type',
  'profileType',
  'profile_label',
  'profileLabel',
  'label',
  'name',
  'title',
  'answers',
  'responses',
  'questionnaire',
  'questions',
  'created_at',
  'updated_at',
  'deleted_at',
])

export function mapAdditionalProfiles(data: unknown, panelistId: string): AdditionalProfile[] {
  return extractList(data, PROFILE_LIST_KEYS)
    .map((item) => mapProfile(item, panelistId))
    .filter((profile): profile is AdditionalProfile => profile !== null)
}

export function mapProfileQuestions(data: unknown): ProfileQuestion[] {
  const record = asRecord(data)
  const list = Array.isArray(data)
    ? data
    : extractList(record?.questions ?? record, ['questions', 'items'])
  return list
    .map((item, index) => mapQuestion(item, index))
    .filter((question): question is ProfileQuestion => question !== null)
    .sort(byOrder)
}

export function renderProfileFields(
  profile: AdditionalProfile,
  catalog: ProfileQuestion[] = [],
): RenderedProfileField[] {
  const questions = mergeQuestions(catalog, profile.questions)
  const answers = new Map(profile.answers.map((answer) => [answer.questionKey, answer]))
  const selectedKeys = selectedOptionKeys(profile.answers, questions)
  const rendered: RenderedProfileField[] = []
  const seen = new Set<string>()

  for (const question of [...questions].sort(byOrder)) {
    const key = question.questionKey
    if (!key || seen.has(key)) continue
    const answer = answers.get(key)
    if (!isQuestionVisible(question, selectedKeys, Boolean(answer && hasAnswerContent(answer)))) continue
    seen.add(key)
    rendered.push(renderQuestion(question, answer))
  }

  for (const answer of profile.answers) {
    if (!answer.questionKey || seen.has(answer.questionKey) || !hasAnswerContent(answer)) continue
    seen.add(answer.questionKey)
    rendered.push({
      id: answer.questionKey,
      label: answer.questionText || humanizeKey(answer.questionKey),
      helpText: '',
      value: formatAnswerValue(answer, undefined),
      order: answer.displayOrder || rendered.length + 1,
      wide: isWide(answer.answerText, answer.optionTexts),
    })
  }

  return rendered.sort(byOrder)
}

function mapProfile(value: unknown, panelistId: string): AdditionalProfile | null {
  const record = asRecord(value)
  if (!record) return null
  const owner = record.user_id ?? record.panelist_id
  if (owner !== undefined && owner !== null && owner !== '' && asString(owner) !== panelistId) return null

  const id = asString(record.id)
  const profileType = asString(record.profile_type ?? record.profileType).trim().toLowerCase()
  if (!id || !profileType) return null

  const label = asString(record.profile_label ?? record.profileLabel ?? record.label ?? record.title ?? record.name)
  return {
    id,
    panelistId,
    profileType,
    title: profileTitle(profileType, label),
    reference: `${profileType}-#${id}`,
    createdAt: toIsoDate(asString(record.created_at) || null),
    updatedAt: toIsoDate(asString(record.updated_at) || null),
    metadata: profileMetadata(record),
    answers: extractAnswers(record),
    questions: mapProfileQuestions(record.questions ?? []),
  }
}

function extractAnswers(record: Record<string, unknown>): ProfileAnswer[] {
  const explicit = firstList(record, ANSWER_LIST_KEYS)
  const fromQuestions = Array.isArray(record.questions) ? record.questions : []
  const merged = new Map<string, ProfileAnswer>()
  ;[...fromQuestions, ...explicit].forEach((item, index) => {
    const answer = mapAnswer(item, index)
    if (!answer || !hasAnswerContent(answer)) return
    const current = merged.get(answer.questionKey)
    merged.set(answer.questionKey, current ? mergeAnswer(current, answer) : answer)
  })
  return [...merged.values()]
}

function mergeAnswer(current: ProfileAnswer, next: ProfileAnswer): ProfileAnswer {
  return {
    questionKey: current.questionKey,
    questionText: next.questionText || current.questionText,
    displayOrder: next.displayOrder || current.displayOrder,
    optionKeys: uniqueStrings([...current.optionKeys, ...next.optionKeys]),
    optionTexts: uniqueStrings([...current.optionTexts, ...next.optionTexts]),
    answerText: next.answerText || current.answerText,
  }
}

function mapAnswer(value: unknown, index: number): ProfileAnswer | null {
  const record = asRecord(value)
  if (!record) return null
  const nested = asRecord(record.answer) ?? asRecord(record.response) ?? {}
  const questionKey = asString(
    record.question_key ?? record.questionKey ?? nested.question_key ?? record.key,
  ).trim()
  const optionKeys = uniqueStrings([
    ...stringList(record.option_keys ?? record.optionKeys ?? nested.option_keys ?? nested.optionKeys),
    ...stringList(record.option_key ?? record.optionKey ?? nested.option_key ?? nested.optionKey),
    ...chosenOptionKeys(record.options),
    ...chosenOptionKeys(nested.options),
  ])
  const optionTexts = uniqueStrings([
    ...stringList(record.option_texts ?? record.optionTexts ?? nested.option_texts ?? nested.optionTexts),
    ...stringList(record.option_text ?? record.optionText ?? nested.option_text ?? nested.optionText),
    ...selectedOptionTexts(record.options),
    ...selectedOptionTexts(nested.options),
  ])
  const answerText = firstText(
    record.answer_text,
    nested.answer_text,
    record.answerText,
    nested.answerText,
    typeof record.answer === 'string' || typeof record.answer === 'number' ? record.answer : undefined,
    record.value,
    nested.value,
  )
  if (!questionKey && !answerText && optionKeys.length === 0 && optionTexts.length === 0) return null
  return {
    questionKey: questionKey || `answer-${index + 1}`,
    questionText: asString(record.question_text ?? record.questionText ?? nested.question_text).trim(),
    displayOrder: asNumber(record.display_order ?? record.displayOrder, index + 1),
    optionKeys,
    optionTexts,
    answerText,
  }
}

function mapQuestion(value: unknown, index: number): ProfileQuestion | null {
  const record = asRecord(value)
  if (!record) return null
  const questionKey = asString(record.question_key ?? record.questionKey).trim()
  const questionText = asString(record.question_text ?? record.questionText).trim()
  if (!questionKey && !questionText) return null
  const showWhen = mapShowWhen(record.show_when ?? record.showWhen)
  return {
    id: asString(record.id || questionKey || index + 1),
    questionKey,
    questionText,
    helpText: asString(record.help_text ?? record.helpText).trim(),
    fieldType: asString(record.field_type ?? record.fieldType).trim(),
    required: asFlag(record.is_required ?? record.required),
    displayOrder: asNumber(record.display_order ?? record.displayOrder, index + 1),
    showWhen,
    options: (Array.isArray(record.options) ? record.options : [])
      .map(mapOption)
      .filter((option): option is ProfileOption => option !== null),
  }
}

function mapOption(value: unknown): ProfileOption | null {
  const record = asRecord(value)
  if (!record) return null
  const key = asString(record.option_key ?? record.optionKey).trim()
  const text = asString(record.option_text ?? record.optionText).trim()
  if (!key && !text) return null
  return {
    key,
    text: text || humanizeKey(key),
    group: asString(record.group_label ?? record.groupLabel).trim(),
    isOther: asFlag(record.is_other ?? record.isOther),
  }
}

function mapShowWhen(value: unknown): ProfileShowWhen | null {
  const record = asRecord(value)
  if (!record) return null
  const questionKey = asString(record.question_key ?? record.questionKey).trim()
  const optionKeys = uniqueStrings([
    ...stringList(record.option_keys ?? record.optionKeys),
    ...stringList(record.option_key ?? record.optionKey),
  ])
  if (!questionKey || optionKeys.length === 0) return null
  return { questionKey, optionKeys }
}

function mergeQuestions(catalog: ProfileQuestion[], embedded: ProfileQuestion[]) {
  const byKey = new Map<string, ProfileQuestion>()
  for (const question of [...embedded, ...catalog]) {
    if (!question.questionKey) continue
    const current = byKey.get(question.questionKey)
    byKey.set(question.questionKey, current ? { ...current, ...question, options: question.options.length ? question.options : current.options, showWhen: question.showWhen ?? current.showWhen, helpText: question.helpText || current.helpText, questionText: question.questionText || current.questionText } : question)
  }
  return [...byKey.values()]
}

function renderQuestion(question: ProfileQuestion, answer: ProfileAnswer | undefined): RenderedProfileField {
  const value = answer ? formatAnswerValue(answer, question) : '—'
  return {
    id: question.questionKey || question.id,
    label: question.questionText || answer?.questionText || humanizeKey(question.questionKey),
    helpText: question.helpText,
    value,
    order: question.displayOrder,
    wide: question.fieldType === 'multi' || question.fieldType === 'text' || isWide(value, []),
  }
}

function formatAnswerValue(answer: ProfileAnswer, question: ProfileQuestion | undefined) {
  const selections = resolveSelections(answer, question)
  const grouped = formatSelections(selections)
  const extra = answer.answerText && !selections.some((item) => item.text === answer.answerText) ? answer.answerText : ''
  if (grouped && extra) return `${grouped}\n${extra}`
  return grouped || extra || '—'
}

function resolveSelections(answer: ProfileAnswer, question: ProfileQuestion | undefined) {
  const options = question?.options ?? []
  const byKey = new Map(options.filter((option) => option.key).map((option) => [option.key, option]))
  if (answer.optionKeys.length) {
    return answer.optionKeys.map((key) => {
      const option = byKey.get(key)
      return { text: option?.text || humanizeKey(key), group: option?.group || '' }
    })
  }
  if (answer.optionTexts.length) {
    return answer.optionTexts.map((text) => {
      const option = options.find((item) => item.text.toLowerCase() === text.toLowerCase())
      return { text, group: option?.group || '' }
    })
  }
  return []
}

function formatSelections(selections: { text: string; group: string }[]) {
  if (!selections.length) return ''
  const groups = new Map<string, string[]>()
  for (const selection of selections) {
    const bucket = groups.get(selection.group) ?? []
    if (!bucket.includes(selection.text)) bucket.push(selection.text)
    groups.set(selection.group, bucket)
  }
  if (groups.size === 1 && groups.has('')) return groups.get('')?.join(', ') ?? ''
  return [...groups.entries()]
    .map(([group, texts]) => (group ? `${group}\n${texts.join(', ')}` : texts.join(', ')))
    .join('\n\n')
}

function selectedOptionKeys(answers: ProfileAnswer[], questions: ProfileQuestion[]) {
  const byQuestion = new Map<string, Set<string>>()
  const catalogs = new Map(questions.map((question) => [question.questionKey, question]))
  for (const answer of answers) {
    const keys = new Set(answer.optionKeys)
    const catalog = catalogs.get(answer.questionKey)
    if (catalog) {
      for (const text of answer.optionTexts) {
        const match = catalog.options.find((option) => option.text.toLowerCase() === text.toLowerCase())
        if (match?.key) keys.add(match.key)
      }
    }
    byQuestion.set(answer.questionKey, keys)
  }
  return byQuestion
}

function isQuestionVisible(question: ProfileQuestion, selected: Map<string, Set<string>>, hasAnswer: boolean) {
  if (!question.showWhen) return true
  if (hasAnswer) return true
  const chosen = selected.get(question.showWhen.questionKey)
  if (!chosen) return false
  return question.showWhen.optionKeys.some((key) => chosen.has(key))
}

function hasAnswerContent(answer: ProfileAnswer) {
  return Boolean(answer.answerText || answer.optionKeys.length || answer.optionTexts.length)
}

function profileTitle(profileType: string, label: string) {
  const cleaned = label.trim()
  if (cleaned) {
    if (/profile$/i.test(cleaned)) return cleaned
    if (/panel$/i.test(cleaned)) return cleaned.replace(/panel$/i, 'Profile').replace(/\s+/g, ' ').trim()
    return cleaned
  }
  return `${humanizeKey(profileType)} Profile`
}

function chosenOptionKeys(options: unknown) {
  return (Array.isArray(options) ? options : [])
    .map(asRecord)
    .filter((option): option is Record<string, unknown> => option !== null && optionChosen(option))
    .map((option) => asString(option.option_key ?? option.optionKey).trim())
    .filter(Boolean)
}

function selectedOptionTexts(options: unknown) {
  return (Array.isArray(options) ? options : [])
    .map(asRecord)
    .filter((option): option is Record<string, unknown> => option !== null && optionChosen(option))
    .map((option) => asString(option.option_text ?? option.optionText).trim())
    .filter(Boolean)
}

function optionChosen(option: Record<string, unknown>) {
  return asFlag(option.selected ?? option.is_selected ?? option.checked ?? option.is_checked)
}

function firstList(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const list = toList(record[key])
    if (list.length) return list
  }
  return []
}

function extractList(data: unknown, keys: string[]) {
  if (Array.isArray(data)) return data
  const record = asRecord(data)
  if (!record) return []
  for (const key of keys) {
    const list = toList(record[key])
    if (list.length) return list
  }
  if (record.id !== undefined && (record.profile_type !== undefined || record.profileType !== undefined)) return [record]
  return []
}

function toList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  const record = asRecord(value)
  if (!record) return []
  for (const key of ['items', 'data', 'answers', 'questions', 'rows']) {
    if (Array.isArray(record[key])) return record[key]
  }
  return []
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => stringList(item))
  if (value && typeof value === 'object') {
    const record = asRecord(value)
    if (!record) return []
    const text = asString(record.option_key ?? record.optionKey ?? record.option_text ?? record.optionText ?? record.value).trim()
    return text ? [text] : []
  }
  const text = asString(value).trim()
  return text ? [text] : []
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (value === null || value === undefined || typeof value === 'object') continue
    const text = asString(value).trim()
    if (text) return text
  }
  return ''
}

function humanizeKey(value: string) {
  if (value.toLowerCase() === 'b2b') return 'B2B'
  const text = value.replace(/[_-]+/g, ' ').trim()
  if (!text) return 'Profile'
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function isWide(value: string, options: string[]) {
  return value.length > 80 || value.includes('\n') || options.length > 3
}

function byOrder<T extends { displayOrder?: number; order?: number }>(left: T, right: T) {
  return (left.displayOrder ?? left.order ?? 0) - (right.displayOrder ?? right.order ?? 0)
}

function asRecord(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function profileMetadata(record: Record<string, unknown>) {
  const createdAt = toIsoDate(asString(record.created_at) || null)
  const updatedAt = toIsoDate(asString(record.updated_at) || null)
  const fields = [
    createdAt ? { label: 'Created', value: createdAt } : null,
    updatedAt ? { label: 'Updated', value: updatedAt } : null,
  ].filter((item): item is { label: string; value: string } => item !== null)

  for (const [key, value] of Object.entries(record)) {
    if (RESERVED_PROFILE_KEYS.has(key)) continue
    if (value === null || value === undefined || value === '') continue
    if (typeof value === 'object') continue
    const text = asString(value).trim()
    if (!text) continue
    fields.push({ label: humanizeKey(key), value: text })
  }
  return fields
}
