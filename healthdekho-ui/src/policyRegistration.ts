import axios from 'axios'
import api from './api'

export interface PolicyRegistrationRequest {
  productCode: string
  startDate: string
}

export interface PolicyRegistrationResponse {
  policyNumber: string
  policyName: string
  startDate: string
  maturityDate: string
  premiumAmount: number
  sumInsured: number
  status: string
}

export interface RegistrationValidationResult {
  isValid: boolean
  errors: string[]
}

const FREQUENCY_MONTHS: Record<string, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  HALF_YEARLY: 6,
  YEARLY: 12,
}

export function getTodayLocalIsoDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Mirrors java.time.LocalDate.plusMonths(termMonths) without UTC timezone drift.
 */
export function calculateMaturityDate(startDateIso: string, termMonths: number): string {
  if (!startDateIso || !/^\d{4}-\d{2}-\d{2}$/.test(startDateIso) || termMonths <= 0) {
    return ''
  }

  const [yearStr, monthStr, dayStr] = startDateIso.split('-')
  const year = Number(yearStr)
  const monthIndex = Number(monthStr) - 1
  const day = Number(dayStr)

  const totalMonths = monthIndex + termMonths
  const targetYear = year + Math.floor(totalMonths / 12)
  const targetMonth = totalMonths % 12
  const maxDayInMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
  const clampedDay = Math.min(day, maxDayInMonth)

  return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`
}

export function calculateInstallmentCount(termMonths: number, premiumFrequency: string): number {
  const stepMonths = FREQUENCY_MONTHS[premiumFrequency?.toUpperCase()] ?? 12
  return Math.max(1, Math.round(termMonths / stepMonths))
}

export function calculateTotalPremiumPayable(
  premiumAmount: number,
  premiumFrequency: string,
  termMonths: number
): number {
  if (premiumAmount <= 0 || termMonths <= 0) {
    return 0
  }
  const installments = calculateInstallmentCount(termMonths, premiumFrequency)
  // Compute in integer paise/cents to prevent floating-point drift
  return (Math.round(premiumAmount * 100) * installments) / 100
}

export function calculateAgeAtDate(dateOfBirthIso?: string, referenceDateIso?: string): number | null {
  if (!dateOfBirthIso || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirthIso)) {
    return null
  }
  const refIso = referenceDateIso && /^\d{4}-\d{2}-\d{2}$/.test(referenceDateIso)
    ? referenceDateIso
    : getTodayLocalIsoDate()

  const [dobY, dobM, dobD] = dateOfBirthIso.split('-').map(Number)
  const [refY, refM, refD] = refIso.split('-').map(Number)

  let age = refY - dobY
  if (refM < dobM || (refM === dobM && refD < dobD)) {
    age -= 1
  }
  return age
}

export function extractApiErrorMessage(err: unknown): {
  message: string
  fieldErrors: Record<string, string>
} {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    const data = err.response?.data as
      | {
          message?: string
          error?: string
          fieldErrors?: Record<string, string>
          errors?: Record<string, string>
        }
      | undefined

    const fieldErrors = data?.fieldErrors ?? data?.errors ?? {}

    if (data?.message) {
      return { message: data.message, fieldErrors }
    }
    if (status === 409) {
      return {
        message: 'You have already registered for this insurance product.',
        fieldErrors,
      }
    }
    if (status === 400) {
      return {
        message: 'Please review the highlighted registration details and try again.',
        fieldErrors,
      }
    }
    if (status && status >= 500) {
      return {
        message: 'A server or database error occurred while registering your policy. Please try again later.',
        fieldErrors,
      }
    }
  }

  return {
    message: 'Unable to complete policy registration. Please check your connection and try again.',
    fieldErrors: {},
  }
}

export async function registerPolicy(
  payload: PolicyRegistrationRequest
): Promise<PolicyRegistrationResponse> {
  const { data } = await api.post<PolicyRegistrationResponse>('/policies/register', payload)
  return data
}