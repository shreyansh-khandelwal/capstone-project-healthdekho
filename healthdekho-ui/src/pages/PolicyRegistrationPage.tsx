import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { AppShell } from '../components/AppShell'
import { formatCurrency, formatDate } from '../dashboard'
import { fetchAvailableProducts } from '../products'
import type { AvailableProduct } from '../products'
import {
  calculateAgeAtDate,
  calculateInstallmentCount,
  calculateMaturityDate,
  calculateTotalPremiumPayable,
  extractApiErrorMessage,
  getTodayLocalIsoDate,
  registerPolicy,
} from '../policyRegistration'
import type { PolicyRegistrationResponse } from '../policyRegistration'

interface CustomerProfileFields {
  fullName?: string
  email?: string
  dateOfBirth?: string
  phone?: string
  contactNumber?: string
}

function formatEnumLabel(value?: string): string {
  return value ? value.replace(/_/g, ' ') : '-'
}

export function PolicyRegistrationPage() {
  const { productCode = '' } = useParams<{ productCode: string }>()
  const location = useLocation()
  const { customer } = useAuth()

  const customerProfile = (customer ?? {}) as CustomerProfileFields
  const stateProduct = (location.state as { selectedProduct?: AvailableProduct } | null)
    ?.selectedProduct

  const [product, setProduct] = useState<AvailableProduct | null>(stateProduct ?? null)
  const [loadingProduct, setLoadingProduct] = useState<boolean>(!stateProduct)
  const [productLoadError, setProductLoadError] = useState<string>('')

  const [startDate, setStartDate] = useState<string>(() => getTodayLocalIsoDate())
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<string>('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [confirmation, setConfirmation] = useState<PolicyRegistrationResponse | null>(null)

  useEffect(() => {
    if (stateProduct && stateProduct.productCode === productCode) {
      setProduct(stateProduct)
      setLoadingProduct(false)
      return
    }

    let active = true
    setLoadingProduct(true)
    setProductLoadError('')

    fetchAvailableProducts()
      .then((catalog) => {
        if (!active) return
        const matched = catalog.find(
          (item) => item.productCode.toLowerCase() === decodeURIComponent(productCode).toLowerCase()
        )
        if (matched) {
          setProduct(matched)
        } else {
          setProductLoadError(
            'The selected insurance product is unavailable or has already been registered.'
          )
        }
      })
      .catch(() => {
        if (active) {
          setProductLoadError('Unable to load insurance product details. Please try again.')
        }
      })
      .finally(() => {
        if (active) setLoadingProduct(false)
      })

    return () => {
      active = false
    }
  }, [productCode, stateProduct])

  const todayIso = useMemo(() => getTodayLocalIsoDate(), [])

  const maturityDate = useMemo(() => {
    if (!product || !startDate) return ''
    return calculateMaturityDate(startDate, product.termMonths)
  }, [product, startDate])

  const installmentCount = useMemo(() => {
    if (!product) return 0
    return calculateInstallmentCount(product.termMonths, product.premiumFrequency)
  }, [product])

  const totalPremiumPayable = useMemo(() => {
    if (!product) return 0
    return calculateTotalPremiumPayable(
      product.premiumAmount,
      product.premiumFrequency,
      product.termMonths
    )
  }, [product])

  const customerAge = useMemo(
    () => calculateAgeAtDate(customerProfile.dateOfBirth, startDate || todayIso),
    [customerProfile.dateOfBirth, startDate, todayIso]
  )

  const clientValidationErrors = useMemo(() => {
    const errors: string[] = []
    if (!product) return errors

    if (!startDate) {
      errors.push('Policy start date is required.')
    } else if (startDate < todayIso) {
      errors.push('Policy start date cannot be in the past.')
    }

    if (customerProfile.dateOfBirth && customerProfile.dateOfBirth > todayIso) {
      errors.push('Customer date of birth cannot be in the future.')
    }

    if (
      customerAge !== null &&
      (customerAge < product.minEntryAge || customerAge > product.maxEntryAge)
    ) {
      errors.push(
        `Customer age (${customerAge} years) must be between ${product.minEntryAge} and ${product.maxEntryAge} years for this product.`
      )
    }

    if (product.premiumAmount <= 0 || product.sumInsured <= 0 || product.termMonths <= 0) {
      errors.push('Product financial terms must be strictly positive.')
    }

    return errors
  }, [product, startDate, todayIso, customerProfile.dateOfBirth, customerAge])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!product || submitting) return

    setSubmitError('')
    setFieldErrors({})

    if (clientValidationErrors.length > 0) {
      setSubmitError(clientValidationErrors[0])
      return
    }

    setSubmitting(true)
    try {
      const response = await registerPolicy({
        productCode: product.productCode,
        startDate,
      })
      setConfirmation(response)
    } catch (err: unknown) {
      const parsed = extractApiErrorMessage(err)
      setSubmitError(parsed.message)
      setFieldErrors(parsed.fieldErrors)
    } finally {
      setSubmitting(false)
    }
  }

  const contactDisplay =
    [customerProfile.phone || customerProfile.contactNumber, customerProfile.email]
      .filter(Boolean)
      .join(' • ') || 'Not provided'

  return (
    <AppShell>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Policy registration</p>
          <h1>Register insurance policy</h1>
        </div>
        <Link className="secondary-button" to="/dashboard">
          Back to dashboard
        </Link>
      </div>

      {loadingProduct && (
        <div className="policy-skeleton" role="status" aria-label="Loading selected product details">
          <span className="skeleton-line skeleton-title" />
          <span className="skeleton-line" />
          <span className="skeleton-line" />
        </div>
      )}

      {!loadingProduct && productLoadError && (
        <div className="dashboard-message error-message" role="alert">
          <div>
            <strong>Product unavailable for registration</strong>
            <p>{productLoadError}</p>
          </div>
          <Link className="secondary-button" to="/products">
            Browse available products
          </Link>
        </div>
      )}

      {/* Confirmation Banner & Summary after 201 Created */}
      {!loadingProduct && confirmation && (
        <section className="portfolio" aria-live="polite" aria-labelledby="registration-success-title">
          <div
            className="summary-card"
            style={{
              borderLeft: '4px solid #15803d',
              backgroundColor: '#f0fdf4',
              marginBottom: '1.5rem',
            }}
          >
            <p className="eyebrow" style={{ color: '#15803d' }}>
              Registration confirmed
            </p>
            <h2 id="registration-success-title">
              Policy {confirmation.policyNumber} is now active
            </h2>
            <p>
              Your insurance policy <strong>{confirmation.policyName}</strong> has been registered
              and its premium installment schedule has been generated.
            </p>
          </div>

          <div className="summary-card">
            <h3>Registered policy summary</h3>
            <dl
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                marginTop: '1rem',
              }}
            >
              <div>
                <dt className="eyebrow">Policy identifier</dt>
                <dd>
                  <strong>{confirmation.policyNumber}</strong>
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Policy name</dt>
                <dd>{confirmation.policyName}</dd>
              </div>
              <div>
                <dt className="eyebrow">Policy status</dt>
                <dd>
                  <span className={`status-badge status-${confirmation.status.toLowerCase()}`}>
                    <span aria-hidden="true">●</span> {confirmation.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Policy start date</dt>
                <dd>{formatDate(confirmation.startDate)}</dd>
              </div>
              <div>
                <dt className="eyebrow">Policy maturity date</dt>
                <dd>{formatDate(confirmation.maturityDate)}</dd>
              </div>
              <div>
                <dt className="eyebrow">Premium amount</dt>
                <dd>{formatCurrency(confirmation.premiumAmount)}</dd>
              </div>
              <div>
                <dt className="eyebrow">Sum insured</dt>
                <dd>{formatCurrency(confirmation.sumInsured)}</dd>
              </div>
              <div>
                <dt className="eyebrow">Total premium payable</dt>
                <dd>
                  <strong>{formatCurrency(totalPremiumPayable)}</strong>
                </dd>
              </div>
            </dl>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem' }}>
              <Link className="primary-link" to="/dashboard">
                Return to dashboard
              </Link>
              <Link
                className="secondary-button"
                to={`/payments?policyNumber=${encodeURIComponent(confirmation.policyNumber)}`}
              >
                View payment schedule
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Pre-Populated Policy Registration Form */}
      {!loadingProduct && !productLoadError && product && !confirmation && (
        <form onSubmit={handleSubmit} noValidate>
          {submitError && (
            <div className="dashboard-message error-message" role="alert" style={{ marginBottom: '1rem' }}>
              <div>
                <strong>Registration could not be completed</strong>
                <p>{submitError}</p>
              </div>
            </div>
          )}

          {clientValidationErrors.length > 0 && !submitError && (
            <div className="dashboard-message error-message" role="alert" style={{ marginBottom: '1rem' }}>
              <div>
                <strong>Eligibility or schedule notice</strong>
                <p>{clientValidationErrors[0]}</p>
              </div>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem',
              alignItems: 'start',
            }}
          >
            {/* Section 1: Customer Details (Auto-populated from logged-in customer) */}
            <section className="summary-card" aria-labelledby="customer-details-heading">
              <p className="eyebrow">Applicant details</p>
              <h2 id="customer-details-heading">Customer information</h2>

              <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label htmlFor="reg-customer-name">Customer name</label>
                  <input
                    id="reg-customer-name"
                    type="text"
                    value={customerProfile.fullName ?? ''}
                    readOnly
                    style={{ width: '100%', padding: '0.55rem 0.75rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div>
                  <label htmlFor="reg-customer-dob">
                    Date of birth {customerAge !== null ? `(Age: ${customerAge} yrs)` : ''}
                  </label>
                  <input
                    id="reg-customer-dob"
                    type="text"
                    value={
                      customerProfile.dateOfBirth
                        ? formatDate(customerProfile.dateOfBirth)
                        : 'Not on file'
                    }
                    readOnly
                    style={{ width: '100%', padding: '0.55rem 0.75rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div>
                  <label htmlFor="reg-customer-contact">Contact information</label>
                  <input
                    id="reg-customer-contact"
                    type="text"
                    value={contactDisplay}
                    readOnly
                    style={{ width: '100%', padding: '0.55rem 0.75rem', marginTop: '0.25rem' }}
                  />
                </div>
              </div>
            </section>

            {/* Section 2: Selected Product Details (Pre-populated) */}
            <section className="summary-card" aria-labelledby="product-details-heading">
              <p className="eyebrow">Selected plan ({product.productCode})</p>
              <h2 id="product-details-heading">Insurance product details</h2>

              <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label htmlFor="reg-policy-type">Policy type</label>
                  <input
                    id="reg-policy-type"
                    type="text"
                    value={formatEnumLabel(product.policyType)}
                    readOnly
                    style={{ width: '100%', padding: '0.55rem 0.75rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div>
                  <label htmlFor="reg-policy-name">Policy name</label>
                  <input
                    id="reg-policy-name"
                    type="text"
                    value={product.policyName}
                    readOnly
                    style={{ width: '100%', padding: '0.55rem 0.75rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label htmlFor="reg-policy-term">Policy term</label>
                    <input
                      id="reg-policy-term"
                      type="text"
                      value={`${product.termMonths} months`}
                      readOnly
                      style={{ width: '100%', padding: '0.55rem 0.75rem', marginTop: '0.25rem' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-premium-frequency">Premium payment frequency</label>
                    <input
                      id="reg-premium-frequency"
                      type="text"
                      value={formatEnumLabel(product.premiumFrequency)}
                      readOnly
                      style={{ width: '100%', padding: '0.55rem 0.75rem', marginTop: '0.25rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label htmlFor="reg-premium-amount">Premium amount</label>
                    <input
                      id="reg-premium-amount"
                      type="text"
                      value={formatCurrency(product.premiumAmount)}
                      readOnly
                      style={{ width: '100%', padding: '0.55rem 0.75rem', marginTop: '0.25rem' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-sum-insured">Sum insured</label>
                    <input
                      id="reg-sum-insured"
                      type="text"
                      value={formatCurrency(product.sumInsured)}
                      readOnly
                      style={{ width: '100%', padding: '0.55rem 0.75rem', marginTop: '0.25rem' }}
                    />
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', opacity: 0.8, margin: 0 }}>
                  Eligible entry age: {product.minEntryAge} to {product.maxEntryAge} years
                </p>
              </div>
            </section>
          </div>

          {/* Section 3: Schedule & Computed Financial Summary */}
          <section
            className="summary-card"
            aria-labelledby="schedule-summary-heading"
            style={{ marginTop: '1.5rem' }}
          >
            <p className="eyebrow">Schedule & financial breakdown</p>
            <h2 id="schedule-summary-heading">Coverage dates and total payable</h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                marginTop: '1rem',
              }}
            >
              <div>
                <label htmlFor="reg-start-date">Policy start date</label>
                <input
                  id="reg-start-date"
                  name="startDate"
                  type="date"
                  value={startDate}
                  min={todayIso}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setSubmitError('')
                    setFieldErrors({})
                  }}
                  required
                  style={{ width: '100%', padding: '0.55rem 0.75rem', marginTop: '0.25rem' }}
                />
                {fieldErrors.startDate && (
                  <small style={{ color: '#b91c1c', display: 'block', marginTop: '0.25rem' }}>
                    {fieldErrors.startDate}
                  </small>
                )}
              </div>

              <div>
                <label htmlFor="reg-maturity-date">Policy maturity date</label>
                <input
                  id="reg-maturity-date"
                  type="text"
                  value={maturityDate ? formatDate(maturityDate) : '-'}
                  readOnly
                  style={{ width: '100%', padding: '0.55rem 0.75rem', marginTop: '0.25rem' }}
                />
              </div>

              <div>
                <label htmlFor="reg-total-payable">
                  Total premium payable ({installmentCount}{' '}
                  {installmentCount === 1 ? 'installment' : 'installments'})
                </label>
                <input
                  id="reg-total-payable"
                  type="text"
                  value={formatCurrency(totalPremiumPayable)}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    marginTop: '0.25rem',
                    fontWeight: 700,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                justifyContent: 'flex-end',
                marginTop: '1.5rem',
              }}
            >
              <Link className="secondary-button" to="/products">
                Cancel
              </Link>
              <button
                type="submit"
                className="primary-link"
                disabled={submitting || clientValidationErrors.length > 0}
              >
                {submitting ? 'Registering policy...' : 'Confirm & register policy'}
              </button>
            </div>
          </section>
        </form>
      )}
    </AppShell>
  )
}