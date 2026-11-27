import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../auth/useAuth'
import { AppShell } from '../components/AppShell'
import { AvailableProductsSection } from '../components/AvailableProductsSection'
import { formatCurrency, formatDate } from '../dashboard'
import type { PolicyPage } from '../dashboard'
import { AiRecommendationsSection } from '../components/AiRecommendationsSection'

export function DashboardPage() {
  const { customer } = useAuth()
  const [data, setData] = useState<PolicyPage | null>(null)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchPolicies = useCallback(async (requestedPage: number) => {
    const { data: response } = await api.get<PolicyPage>('/dashboard', {
      params: { page: requestedPage, size: 8 },
    })
    return response
  }, [])

  const loadPolicies = useCallback(async (requestedPage: number) => {
    try {
      const response = await fetchPolicies(requestedPage)
      setData(response)
      setPage(response.page)
    } catch {
      setError('We could not load your policies. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [fetchPolicies])

  useEffect(() => {
    let active = true
    fetchPolicies(page)
      .then((response) => {
        if (!active) return
        setData(response)
        setPage(response.page)
      })
      .catch(() => {
        if (active) setError('We could not load your policies. Please try again.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [fetchPolicies, page])

  return (
    <AppShell>
      <p className="eyebrow">Customer workspace</p>
      <h1>Welcome, {customer?.fullName}</h1>
      <section className="portfolio" aria-labelledby="portfolio-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your coverage</p>
            <h2 id="portfolio-title">Policy overview</h2>
          </div>
          <p className="portfolio-count" aria-live="polite">
            {data ? `${data.totalElements} ${data.totalElements === 1 ? 'policy' : 'policies'}` : ''}
          </p>
        </div>

        {isLoading && (
          <div className="policy-skeleton" role="status" aria-label="Loading your policies">
            <span className="skeleton-line skeleton-title" />
            <span className="skeleton-line" />
            <span className="skeleton-line" />
            <span className="skeleton-line" />
          </div>
        )}

        {!isLoading && error && (
          <div className="dashboard-message error-message" role="alert">
            <div>
              <strong>Your policy overview is unavailable</strong>
              <p>{error}</p>
            </div>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setIsLoading(true)
                setError('')
                void loadPolicies(page)
              }}
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && data?.totalElements === 0 && (
          <div className="empty-state">
            <span className="empty-icon" aria-hidden="true">◇</span>
            <h3>You do not have any registered policies yet</h3>
            <p>Explore our products to find cover that fits your health and financial goals.</p>
            <Link className="primary-link" to="/products">Discover products</Link>
          </div>
        )}

        {!isLoading && !error && data && data.totalElements > 0 && (
          <>
            <div className="table-scroll" tabIndex={0} aria-label="Policy portfolio table, scroll horizontally for all details">
              <table className="policy-table">
                <caption className="sr-only">Registered policies for {customer?.fullName}</caption>
                <thead>
                  <tr>
                    <th scope="col" className="sticky-policy-id">Policy identifier</th>
                    <th scope="col">Product name</th>
                    <th scope="col">Policy type</th>
                    <th scope="col">Term</th>
                    <th scope="col">Start date</th>
                    <th scope="col">Maturity date</th>
                    <th scope="col">Premium frequency</th>
                    <th scope="col" className="currency-column">Premium amount</th>
                    <th scope="col" className="currency-column">Sum insured</th>
                    <th scope="col">Policy status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.policies.map((policy) => (
                    <tr key={policy.policyIdentifier}>
                      <th scope="row" className="sticky-policy-id">{policy.policyIdentifier}</th>
                      <td>{policy.productName}</td>
                      <td>{policy.policyType}</td>
                      <td>{policy.termMonths} months</td>
                      <td><time dateTime={policy.startDate}>{formatDate(policy.startDate)}</time></td>
                      <td><time dateTime={policy.maturityDate}>{formatDate(policy.maturityDate)}</time></td>
                      <td>{policy.premiumFrequency}</td>
                      <td className="currency-column">{formatCurrency(policy.premiumAmount)}</td>
                      <td className="currency-column">{formatCurrency(productSumInsured(policy.sumInsured))}</td>
                      <td>
                        <span className={`status-badge status-${policy.status.toLowerCase()}`}>
                          <span aria-hidden="true">●</span> {policy.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.totalPages > 1 && (
              <nav className="pagination" aria-label="Policy table pagination">
                <button
                  className="secondary-button"
                  type="button"
                  disabled={data.first}
                  onClick={() => {
                    setIsLoading(true)
                    setError('')
                    setPage((current) => Math.max(0, current - 1))
                  }}
                >
                  Previous
                </button>
                <span>Page {data.page + 1} of {data.totalPages}</span>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={data.last}
                  onClick={() => {
                    setIsLoading(true)
                    setError('')
                    setPage((current) => current + 1)
                  }}
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </section>
<br />
<AiRecommendationsSection />

<br />
      <AvailableProductsSection />
    </AppShell>
  )
}

function productSumInsured(amount: number): number {
  return amount
}

export function PaymentPage() {
  return (
    <AppShell>
      <p className="eyebrow">Payments</p>
      <h1>Premium payments</h1>
      <div className="summary-card">
        <p>Payment history and upcoming installments will appear here.</p>
      </div>
    </AppShell>
  )
}

export function ProductDiscoveryPage() {
  return (
    <AppShell>
      <p className="eyebrow">Available cover</p>
      <h1>Product discovery</h1>
      <AvailableProductsSection />
    </AppShell>
  )
}

export function PolicySearchPage() {
  return (
    <AppShell>
      <p className="eyebrow">Owned policies</p>
      <h1>Policy search</h1>
      <div className="summary-card">
        <p>Search your private policy records from this authenticated workspace.</p>
      </div>
    </AppShell>
  )
}