export const CSV_IMPORT_VALIDATION_MS = 5_000
export const CSV_IMPORT_IMPORTANT_MS = 10_000

export const FILL_SURVEY_DETAILS = 'Please fill Survey URL and Reward Points.'

const SHARED_VALIDATION = new Set([
  FILL_SURVEY_DETAILS,
  'Please fill Survey URL.',
  'Please fill Reward Points.',
  'Choose at least one CSV file.',
  'The CSV is missing a required column.',
])

export type ImportFailure = { fileName: string; message: string }

export function friendlyImportError(raw: string) {
  const text = raw.replace(/\s+/g, ' ').trim()
  const lower = text.toLowerCase()
  if (!text || text.startsWith('{') || text.startsWith('[')) {
    return 'The file could not be imported. Check the CSV and try again.'
  }
  if (/stack trace|exception|sqlstate|\.php|at \w+\(|traceback/i.test(text) || text.length > 180) {
    return 'The file could not be imported. Check the CSV and try again.'
  }
  const missingUrl = lower.includes('survey_url') || lower.includes('survey url')
  const missingPoints = lower.includes('reward_points') || lower.includes('reward point')
  if (lower.includes('no survey rows') || (missingUrl && missingPoints)) return FILL_SURVEY_DETAILS
  if (missingUrl) return 'Please fill Survey URL.'
  if (missingPoints) return 'Please fill Reward Points.'
  return text
}

/** One notice for the batch. Filenames are included only when a message applies to a single file among different errors. */
export function consolidateImportErrors(failures: ImportFailure[]) {
  const groups = new Map<string, string[]>()
  for (const failure of failures) {
    const message = friendlyImportError(failure.message)
    if (!message) continue
    const names = groups.get(message) ?? []
    names.push(failure.fileName)
    groups.set(message, names)
  }
  if (!groups.size) return ''
  if (groups.size === 1) return [...groups.keys()][0]
  return [...groups.entries()]
    .map(([message, names]) =>
      names.length === 1 && !SHARED_VALIDATION.has(message) ? `${names[0]}: ${message}` : message,
    )
    .join(' ')
}

export function importNoticeDuration(message: string, mixed = false) {
  if (mixed || /server|unable to reach|could not be imported/i.test(message)) return CSV_IMPORT_IMPORTANT_MS
  if (SHARED_VALIDATION.has(message) || /^\d+ files? uploaded\.$/.test(message) || message.length <= 80) {
    return CSV_IMPORT_VALIDATION_MS
  }
  return CSV_IMPORT_IMPORTANT_MS
}
