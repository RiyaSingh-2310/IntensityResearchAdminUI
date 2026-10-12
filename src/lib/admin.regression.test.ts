import assert from 'node:assert/strict'
import test from 'node:test'

const memoryStore = () => {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
    clear: () => data.clear(),
    key: () => null,
    get length() {
      return data.size
    },
  }
}

const browser = globalThis as typeof globalThis & {
  window: typeof globalThis
  localStorage: ReturnType<typeof memoryStore>
  sessionStorage: ReturnType<typeof memoryStore>
  dispatchEvent: (event: Event) => boolean
}
browser.localStorage = memoryStore()
browser.sessionStorage = memoryStore()
browser.window = browser
browser.dispatchEvent = () => true
import { safeAdminReturnPath } from './access.ts'
import { isHealthcarePharmaceuticals, mapAdditionalProfiles, panelEligibilityNotice } from './additionalProfiles.ts'
import { apiRequest } from './apiClient.ts'
import { mapPanelist } from './mappers.ts'
import { buildOnboardingAnswers, mapOnboardingCatalog, resolvePanelistAnswers } from './onboardingAnswers.ts'
import { toPanelistUpdateBody } from './panelistUpdate.ts'
import { clearSession, readSession, writeSession } from './session.ts'

const catalog = mapOnboardingCatalog({
  steps: [
    {
      step_no: 2,
      questions: [
        {
          id: 27,
          question_text: 'Which industry does your organization primarily operate in?',
          field_type: 'dropdown',
          display_order: 14,
          options: [
            { id: 357, name: '1. Healthcare & Pharmaceuticals' },
            { id: 372, name: 'Hospitals & healthcare providers' },
          ],
        },
        {
          id: 20,
          question_text: 'Which country do you currently live or work in?',
          field_type: 'dropdown',
          display_order: 7,
          options: [{ id: 88, name: 'Algeria' }],
        },
      ],
    },
  ],
})

test('industry and country resolve from option ids when question text is omitted', () => {
  const resolved = resolvePanelistAnswers(
    [
      { question_id: 27, answer_ref_id: 357 },
      { question_id: 20, answer_ref_id: 88 },
    ],
    catalog,
  )
  const panelist = mapPanelist(
    { id: 9, name: 'Jane Doe', email: 'jane@example.com', phone: '9999999999', status: 'active', is_verified: 1 },
    resolved,
  )
  assert.equal(panelist.industry, '1. Healthcare & Pharmaceuticals')
  assert.equal(panelist.country, 'Algeria')
  assert.equal(panelist.email, 'jane@example.com')
  const answers = buildOnboardingAnswers(resolved, catalog)
  assert.equal(answers.find((item) => item.id === '27')?.answer, '1. Healthcare & Pharmaceuticals')
})

test('Healthcare & Pharmaceuticals may include the Healthcare Professional panel', () => {
  assert.equal(isHealthcarePharmaceuticals('1. Healthcare & Pharmaceuticals'), true)
  assert.equal(panelEligibilityNotice('1. Healthcare & Pharmaceuticals', [{ profileType: 'healthcare' }, { profileType: 'b2b' }, { profileType: 'patient' }]), '')
})

test('other industries keep a saved Healthcare Professional panel visible and unchanged', () => {
  assert.equal(isHealthcarePharmaceuticals('Hospitals & healthcare providers'), false)
  assert.equal(isHealthcarePharmaceuticals('Pharmaceuticals'), false)
  const notice = panelEligibilityNotice('Finance', [{ profileType: 'healthcare' }, { profileType: 'patient' }])
  assert.match(notice, /Healthcare Professional Panel/)
  assert.match(notice, /Finance/)
  assert.match(notice, /was not changed/)
  assert.equal(panelEligibilityNotice('Finance', [{ profileType: 'b2b' }, { profileType: 'patient' }]), '')
  assert.equal(panelEligibilityNotice('', [{ profileType: 'healthcare' }]), '')
})

test('additional profiles use official panel labels and drop another panelist', () => {
  const profiles = mapAdditionalProfiles(
    {
      profiles: [
        { id: 2, user_id: 9, profile_type: 'healthcare', profile_label: 'Healthcare Professional Panel' },
        { id: 3, user_id: 9, profile_type: 'patient', profile_label: 'Patient Panel' },
        { id: 4, user_id: 8, profile_type: 'b2b', profile_label: 'B2B Panel' },
      ],
    },
    '9',
  )
  assert.deepEqual(
    profiles.map((profile) => profile.title),
    ['Healthcare Professional Panel', 'Patient Panel'],
  )
  assert.equal(profiles.every((profile) => profile.panelistId === '9'), true)
})

test('panelist update payload cannot change email, country, industry, or another id', () => {
  const body = toPanelistUpdateBody({
    firstName: 'Jane',
    lastName: 'Doe',
    phone: '9999999999',
    status: 'active',
    isVerified: true,
  })
  assert.deepEqual(body, {
    name: 'Jane Doe',
    phone: '9999999999',
    status: 'active',
    is_verified: 1,
  })
  assert.equal('email' in body, false)
  assert.equal('country' in body, false)
  assert.equal('industry' in body, false)
  assert.equal('id' in body, false)
})

test('post-login return path stays inside the admin app', () => {
  assert.equal(safeAdminReturnPath('/admin/panelists/9'), '/admin/panelists/9')
  assert.equal(safeAdminReturnPath('/admin/login'), '/admin/dashboard')
  assert.equal(safeAdminReturnPath('/admin/forgot-password'), '/admin/dashboard')
  assert.equal(safeAdminReturnPath('https://evil.example'), '/admin/dashboard')
  assert.equal(safeAdminReturnPath('//evil.example'), '/admin/dashboard')
  assert.equal(safeAdminReturnPath('/panelists'), '/admin/dashboard')
})

test('expired or invalid sessions are not treated as signed in', () => {
  clearSession()
  assert.equal(readSession(), null)
  writeSession({
    token: 'test-token',
    expiresAt: Date.now() - 1000,
    remember: true,
    user: { id: '1', name: 'Admin', email: 'admin@example.com', role: 'Administrator' },
  })
  assert.equal(readSession(), null)
  writeSession({
    token: 'test-token',
    expiresAt: Date.now() + 60_000,
    remember: false,
    user: { id: '1', name: 'Admin', email: 'admin@example.com', role: 'Administrator' },
  })
  assert.equal(readSession()?.user.email, 'admin@example.com')
  assert.equal(globalThis.localStorage.getItem('ir_admin_session'), null)
  clearSession()
  assert.equal(readSession(), null)
})

test('a 401 on a protected request clears the local session and does not call the network with another user', async () => {
  clearSession()
  writeSession({
    token: 'test-token',
    expiresAt: Date.now() + 60_000,
    remember: true,
    user: { id: '1', name: 'Admin', email: 'admin@example.com', role: 'Administrator' },
  })
  const original = globalThis.fetch
  let requested = ''
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requested = String(input)
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer test-token')
    assert.equal(init?.method ?? 'GET', 'GET')
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }) as typeof fetch
  try {
    await assert.rejects(() => apiRequest('/admin/panelists/9'), /session has expired/i)
    assert.match(requested, /\/admin\/panelists\/9$/)
    assert.equal(readSession(), null)
  } finally {
    globalThis.fetch = original
    clearSession()
  }
})

test('unauthenticated admin list is rejected and public health stays read-only', async () => {
  const health = await fetch('https://intensityresearch.com/intensityapi/health')
  assert.equal(health.status, 200)
  const denied = await fetch('https://intensityresearch.com/intensityapi/admin/panelists')
  assert.equal(denied.status, 401)
  const caregiver = await fetch('https://intensityresearch.com/intensityapi/profile-questions?profile_type=caregiver')
  assert.equal(caregiver.status, 422)
})
