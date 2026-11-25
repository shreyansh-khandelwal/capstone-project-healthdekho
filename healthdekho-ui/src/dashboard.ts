export type Policy = {
  policyIdentifier: string
  productName: string
  policyType: string
  termMonths: number
  startDate: string
  maturityDate: string
  premiumFrequency: string
  premiumAmount: number
  sumInsured: number
  status: string
}

export type PolicyPage = {
  policies: Policy[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}
