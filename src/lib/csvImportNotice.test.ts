import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CSV_IMPORT_IMPORTANT_MS,
  CSV_IMPORT_VALIDATION_MS,
  FILL_SURVEY_DETAILS,
  consolidateImportErrors,
  friendlyImportError,
  importNoticeDuration,
} from './csvImportNotice.ts'

describe('csv import notices', () => {
  it('maps a blank assignment file to one short validation message', () => {
    assert.equal(
      friendlyImportError(
        'No survey rows to assign. Fill survey_url and reward_points for each panelist you want to assign.',
      ),
      FILL_SURVEY_DETAILS,
    )
  })

  it('uses one message when several files fail for the same reason', () => {
    const notice = consolidateImportErrors([
      { fileName: 'a.csv', message: 'No survey rows to assign. Fill survey_url and reward_points.' },
      { fileName: 'b.csv', message: 'No survey rows to assign. Fill survey_url and reward_points.' },
    ])
    assert.equal(notice, FILL_SURVEY_DETAILS)
    assert.equal(notice.includes('.csv'), false)
  })

  it('keeps distinct errors in one notice and names a file only when its error is unique', () => {
    const notice = consolidateImportErrors([
      { fileName: 'blank.csv', message: 'No survey rows to assign. Fill survey_url and reward_points.' },
      { fileName: 'notes.txt', message: 'Use a .csv file.' },
    ])
    assert.equal(notice, `${FILL_SURVEY_DETAILS} notes.txt: Use a .csv file.`)
  })

  it('hides raw JSON and long technical responses', () => {
    assert.equal(
      friendlyImportError('{"message":"SQLSTATE[HY000]: stack trace at import.php"}'),
      'The file could not be imported. Check the CSV and try again.',
    )
  })

  it('uses 5 seconds for the standard validation message and 10 seconds for mixed or server failures', () => {
    assert.equal(importNoticeDuration(FILL_SURVEY_DETAILS), CSV_IMPORT_VALIDATION_MS)
    assert.equal(importNoticeDuration(FILL_SURVEY_DETAILS, true), CSV_IMPORT_IMPORTANT_MS)
    assert.equal(
      importNoticeDuration('Unable to reach the server. Check your connection and try again.'),
      CSV_IMPORT_IMPORTANT_MS,
    )
    assert.equal(CSV_IMPORT_VALIDATION_MS, 5000)
    assert.equal(CSV_IMPORT_IMPORTANT_MS, 10000)
  })
})
