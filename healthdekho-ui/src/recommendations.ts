import axios from 'axios'
import api from './api'

export interface RecommendationRequest {
  dateOfBirth: string | null
  insuranceGoals: string | null
  preferredTerm: number | null
  preferredPolicyType: string | null
}

export interface PolicyRecommendation {
  productCode: string
  policyName: string
  policyType: string
  policyTerm: number
  sumInsured: number
  premiumFrequency: string
  premiumAmount: number
  recommendationReason: string
  suitability: number
  productId: number
}

export function formatSuitability(value: number | string | null | undefined): string {
  const numeric = typeof value === 'string' ? Number(value) : value
  if (numeric === null || numeric === undefined || Number.isNaN(numeric)) {
    return '-'
  }
  const percentage = numeric <= 1 && numeric > 0 ? numeric * 100 : numeric
  return `${Number(percentage.toFixed(1))}%`
}

export function extractRecommendationError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    const data = err.response?.data as { message?: string; error?: string } | undefined
    if (data?.message) {
      return data.message
    }
    if (status === 400) {
      return 'Please check your recommendation preferences and try again.'
    }
    if (status && status >= 500) {
      return 'The AI recommendation service is temporarily unavailable. Please try again shortly.'
    }
  }
  return 'Unable to generate recommendations right now. Please try again.'
}

export async function generateRecommendations(
  payload: RecommendationRequest
): Promise<PolicyRecommendation[]> {
  const { data } = await api.post<PolicyRecommendation[]>(
    '/recommendations/generate',
    payload
  )
  return data
}