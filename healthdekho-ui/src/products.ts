import api from './api'

export interface AvailableProduct {
  productId: number
  productCode: string
  policyName: string
  policyType: string
  termMonths: number
  sumInsured: number
  premiumFrequency: string
  premiumAmount: number
  minEntryAge: number
  maxEntryAge: number
}

export async function fetchAvailableProducts(): Promise<AvailableProduct[]> {
  const { data } = await api.get<AvailableProduct[]>('/products/available')
  console.log(data)
  return data
}