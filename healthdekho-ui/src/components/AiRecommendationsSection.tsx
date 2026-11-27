import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { formatCurrency } from '../dashboard'
import { getTodayLocalIsoDate } from '../policyRegistration'
import type { AvailableProduct } from '../products'
import {
  extractRecommendationError,
  formatSuitability,
  generateRecommendations,
} from '../recommendations'
import type { PolicyRecommendation } from '../recommendations'

interface AiRecommendationsSectionProps {
  defaultOpen?: boolean
}

const POLICY_TYPE_OPTIONS = [
  { value: '', label: 'Any insurance type' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'TERM_LIFE', label: 'Term Life' },
  { value: 'CRITICAL_ILLNESS', label: 'Critical Illness' },
  { value: 'PERSONAL_ACCIDENT', label: 'Personal Accident' },
  { value: 'SENIOR_CITIZEN', label: 'Senior Citizen' },
]

function formatEnumLabel(value?: string): string {
  return value ? value.replace(/_/g, ' ') : '-'
}

export function AiRecommendationsSection({ defaultOpen = false }: AiRecommendationsSectionProps) {
  const navigate = useNavigate()
  const { customer } = useAuth()
  const customerDob = (customer as { dateOfBirth?: string } | null)?.dateOfBirth ?? ''

  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen)
  const [dateOfBirth, setDateOfBirth] = useState<string>(customerDob)
  const [insuranceGoals, setInsuranceGoals] = useState<string>('')
  const [preferredTerm, setPreferredTerm] = useState<string>('')
  const [preferredPolicyType, setPreferredPolicyType] = useState<string>('')

  const [recommendations, setRecommendations] = useState<PolicyRecommendation[] | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const todayIso = getTodayLocalIsoDate()

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isLoading) return

    setError('')

    const trimmedGoals = insuranceGoals.trim()
    const trimmedTerm = preferredTerm.trim()
    const parsedTerm = trimmedTerm ? Number(trimmedTerm) : null

    if (!dateOfBirth && !trimmedGoals && !trimmedTerm && !preferredPolicyType) {
      setError('Please provide at least one input (Date of Birth, Insurance Goals, Preferred Term, or Insurance Type).')
      return
    }

    if (dateOfBirth && dateOfBirth > todayIso) {
      setError('Date of birth cannot be in the future.')
      return
    }

    if (parsedTerm !== null && (!Number.isInteger(parsedTerm) || parsedTerm <= 0)) {
      setError('Preferred policy term must be a positive number of months.')
      return
    }

    setIsLoading(true)
    try {
      const results = await generateRecommendations({
        dateOfBirth: dateOfBirth || null,
        insuranceGoals: trimmedGoals || null,
        preferredTerm: parsedTerm,
        preferredPolicyType: preferredPolicyType || null,
      })
      setRecommendations(Array.isArray(results) ? results : [])
    } catch (err: unknown) {
      setError(extractRecommendationError(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setDateOfBirth(customerDob)
    setInsuranceGoals('')
    setPreferredTerm('')
    setPreferredPolicyType('')
    setRecommendations(null)
    setError('')
  }

  const handleRegister = (item: PolicyRecommendation) => {
    const selectedProduct: AvailableProduct = {
      productId: item.productId,
      productCode: item.productCode,
      policyName: item.policyName,
      policyType: item.policyType,
      termMonths: item.policyTerm,
      sumInsured: item.sumInsured,
      premiumFrequency: item.premiumFrequency,
      premiumAmount: item.premiumAmount,
      minEntryAge: 0,
      maxEntryAge: 120,
    }

    navigate(`/policies/register/${encodeURIComponent(item.productCode)}`, {
      state: { selectedProduct },
    })
  }

  return (
    <section className="portfolio" aria-labelledby="ai-recommendations-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Spring AI advisor</p>
          <h2 id="ai-recommendations-title">AI policy recommendations</h2>
        </div>
        <button
          type="button"
          className={isOpen ? 'secondary-button' : 'primary-link'}
          aria-expanded={isOpen}
          aria-controls="ai-recommendation-panel"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? 'Hide AI advisor' : 'Get AI recommendations'}
        </button>
      </div>

      {isOpen && (
        <div id="ai-recommendation-panel" className="summary-card">
          <p style={{ marginTop: 0 }}>
            Provide one or more preferences below to receive personalized recommendations from eligible products in our catalog.
          </p>

          <form onSubmit={handleGenerate} noValidate>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <label htmlFor="ai-dob">Date of birth</label>
                <input
                  id="ai-dob"
                  type="date"
                  max={todayIso}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', marginTop: '0.25rem' }}
                />
              </div>

              <div>
                <label htmlFor="ai-policy-type">Insurance type</label>
                <select
                  id="ai-policy-type"
                  value={preferredPolicyType}
                  onChange={(e) => setPreferredPolicyType(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', marginTop: '0.25rem' }}
                >
                  {POLICY_TYPE_OPTIONS.map((option) => (
                    <option key={option.value || 'ANY'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ai-preferred-term">Preferred policy term (months)</label>
                <input
                  id="ai-preferred-term"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="e.g. 60 or 120"
                  value={preferredTerm}
                  onChange={(e) => setPreferredTerm(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', marginTop: '0.25rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="ai-insurance-goals">Insurance goals and preferences</label>
              <textarea
                id="ai-insurance-goals"
                rows={3}
                placeholder="Describe your coverage goals, family protection needs, or budget preferences..."
                value={insuranceGoals}
                onChange={(e) => setInsuranceGoals(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', marginTop: '0.25rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button type="submit" className="primary-link" disabled={isLoading}>
                {isLoading ? 'Generating recommendations...' : 'Generate recommendations'}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleReset}
                disabled={isLoading}
              >
                Reset
              </button>
            </div>
          </form>

          {isLoading && (
            <div
              className="policy-skeleton"
              role="status"
              aria-label="Generating personalized insurance recommendations"
              style={{ marginTop: '1.25rem' }}
            >
              <span className="skeleton-line skeleton-title" />
              <span className="skeleton-line" />
              <span className="skeleton-line" />
            </div>
          )}

          {!isLoading && error && (
            <div
              className="dashboard-message error-message"
              role="alert"
              style={{ marginTop: '1.25rem' }}
            >
              <div>
                <strong>Recommendation request could not be completed</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {!isLoading && !error && recommendations !== null && recommendations.length === 0 && (
            <div className="empty-state" style={{ marginTop: '1.25rem' }}>
              <span className="empty-icon" aria-hidden="true">◇</span>
              <h3>No eligible product recommendations found</h3>
              <p>
                No unowned active insurance products matched your current criteria. Try broadening your preferred term or insurance type.
              </p>
            </div>
          )}

          {!isLoading && !error && recommendations !== null && recommendations.length > 0 && (
            <div
              className="table-scroll"
              tabIndex={0}
              aria-label="AI recommended insurance products table, scroll horizontally for all details"
              style={{ marginTop: '1.5rem' }}
            >
              <table className="policy-table">
                <caption className="sr-only">Personalized AI insurance policy recommendations</caption>
                <thead>
                  <tr>
                    <th scope="col" className="sticky-policy-id">Product code</th>
                    <th scope="col">Policy name</th>
                    <th scope="col">Policy type</th>
                    <th scope="col">Policy term</th>
                    <th scope="col" className="currency-column">Sum insured</th>
                    <th scope="col">Premium frequency</th>
                    <th scope="col" className="currency-column">Premium amount</th>
                    <th scope="col">Recommendation reason</th>
                    <th scope="col">Suitability</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map((item) => (
                    <tr key={item.productCode}>
                      <th scope="row" className="sticky-policy-id">{item.productCode}</th>
                      <td>{item.policyName}</td>
                      <td>{formatEnumLabel(item.policyType)}</td>
                      <td>{item.policyTerm} months</td>
                      <td className="currency-column">{formatCurrency(item.sumInsured)}</td>
                      <td>{formatEnumLabel(item.premiumFrequency)}</td>
                      <td className="currency-column">{formatCurrency(item.premiumAmount)}</td>
                      <td style={{ minWidth: '220px' }}>{item.recommendationReason}</td>
                      <td>
                        <span className="status-badge status-active">
                          {formatSuitability(item.suitability)}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="primary-link"
                          onClick={() => handleRegister(item)}
                        >
                          Register
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  )
}