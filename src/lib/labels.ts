import type {
  AgeRange,
  AssignmentStatus,
  Education,
  Employment,
  Gender,
  HouseholdIncome,
  PanelistStatus,
  RewardRequestStatus,
} from '@/types'

export const GENDER_LABELS: Record<Gender, string> = {
  female: 'Female',
  male: 'Male',
  non_binary: 'Non-binary',
  prefer_not: 'Prefer not to say',
}

export const AGE_RANGE_LABELS: Record<AgeRange, string> = {
  '18-24': '18–24',
  '25-34': '25–34',
  '35-44': '35–44',
  '45-54': '45–54',
  '55-64': '55–64',
  '65+': '65+',
}

export const EDUCATION_LABELS: Record<Education, string> = {
  high_school: 'High school',
  some_college: 'Some college',
  associate: "Associate's",
  bachelors: "Bachelor's",
  masters: "Master's",
  doctorate: 'Doctorate',
}

export const EMPLOYMENT_LABELS: Record<Employment, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  self_employed: 'Self-employed',
  unemployed: 'Unemployed',
  student: 'Student',
  retired: 'Retired',
  homemaker: 'Homemaker',
}

export const INCOME_LABELS: Record<HouseholdIncome, string> = {
  under_25k: 'Under $25k',
  '25k_49k': '$25k–$50k',
  '50k_74k': '$50k–$75k',
  '75k_99k': '$75k–$100k',
  '100k_149k': '$100k–$150k',
  '150k_plus': 'Over $150k',
}

export const PANELIST_STATUS_LABELS: Record<PanelistStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
}

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  active: 'Active',
  complete: 'Complete',
  terminate: 'Terminated',
  quota_full: 'Quota full',
}

export const REQUEST_STATUS_LABELS: Record<RewardRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

/**
 * Display labels for payment method names from GET /settings `payment_methods`.
 * Filter/API values must remain the raw `name` from payment_methods.
 */
const PAYMENT_METHOD_DISPLAY: Record<string, string> = {
  paypal: 'PayPal',
  uip: 'UPI',
  upi: 'UPI',
  cash: 'Cash',
  'gift card': 'Gift Card',
  'gift_card': 'Gift Card',
  amazon: 'Amazon',
  'amazon pay': 'Amazon Pay',
  flipkart: 'Flipkart',
  myntra: 'Myntra',
  gpay: 'GPay',
  'bank transfer': 'Bank Transfer',
}

export function paymentMethodLabel(name: string) {
  const key = name.trim().toLowerCase()
  return PAYMENT_METHOD_DISPLAY[key] ?? name.trim()
}

export function roleLabel(role?: string | null) {
  if (!role) return 'Administrator'
  return role
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function fullName(firstName: string, lastName: string) {
  return [firstName, lastName].filter(Boolean).join(' ')
}
