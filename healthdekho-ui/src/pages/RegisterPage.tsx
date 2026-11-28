import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  extractRegistrationApiError,
  getTodayLocalIsoDate,
  registerCustomer,
  validateCustomerRegistration,
} from '../register'
import type {
  CustomerRegistrationRequest,
  CustomerRegistrationResponse,
  RegistrationFormErrors,
} from '../register'

export function RegisterPage() {
  const todayIso = getTodayLocalIsoDate()

  const [formValues, setFormValues] = useState<CustomerRegistrationRequest>({
    fullName: '',
    email: '',
    password: '',
    dateOfBirth: '',
    phone: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<RegistrationFormErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registeredCustomer, setRegisteredCustomer] =
    useState<CustomerRegistrationResponse | null>(null)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    setSubmitError('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    setSubmitError('')

    const sanitizedPayload: CustomerRegistrationRequest = {
      fullName: formValues.fullName.trim(),
      email: formValues.email.trim(),
      password: formValues.password,
      dateOfBirth: formValues.dateOfBirth,
      phone: formValues.phone.trim(),
    }

    const validationErrors = validateCustomerRegistration(sanitizedPayload)
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await registerCustomer(sanitizedPayload)
      setRegisteredCustomer(response)
      setFieldErrors({})
    } catch (err: unknown) {
      const parsed = extractRegistrationApiError(err)
      setSubmitError(parsed.message)
      setFieldErrors(parsed.fieldErrors)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-shell" style={{ maxWidth: '480px', margin: '3rem auto', padding: '0 1rem' }}>
      <div className="summary-card">
        <p className="eyebrow">HealthDekho Portal</p>
        <h1>Create customer account</h1>

        {registeredCustomer ? (
          <section aria-live="polite" style={{ marginTop: '1rem' }}>
            <div
              className="dashboard-message"
              role="status"
              style={{
                borderLeft: '4px solid #15803d',
                backgroundColor: '#f0fdf4',
                padding: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <strong>{registeredCustomer.message}</strong>
                <p style={{ margin: '0.35rem 0 0' }}>
                  Account created for <strong>{registeredCustomer.fullName}</strong> (
                  {registeredCustomer.email}).
                </p>
              </div>
            </div>

            <Link
              className="primary-link"
              to="/login"
              state={{ email: registeredCustomer.email }}
              style={{ display: 'inline-block', textAlign: 'center', width: '100%' }}
            >
              Proceed to sign in
            </Link>
          </section>
        ) : (
          <>
            <p>Register to view policies, explore plans, and manage premium payments.</p>

            {submitError && (
              <div
                className="dashboard-message error-message"
                role="alert"
                style={{ marginBottom: '1rem' }}
              >
                <div>
                  <strong>Registration failed</strong>
                  <p>{submitError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label htmlFor="register-full-name">Full name</label>
                  <input
                    id="register-full-name"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="John Doe"
                    value={formValues.fullName}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.fullName)}
                    required
                    style={{ width: '100%', padding: '0.55rem 0.75rem', marginTop: '0.25rem' }}
                  />
                  {fieldErrors.fullName && (
                    <small role="alert" style={{ color: '#b91c1c', display: 'block', marginTop: '0.25rem' }}>
                      {fieldErrors.fullName}
                    </small>
                  )}
                </div>

                <div>
                  <label htmlFor="register-email">Email address</label>
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="john.doe@gmail.com"
                    value={formValues.email}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.email)}
                    required
                    style={{ width: '100%', padding: '0.55rem 0.75rem', marginTop: '0.25rem' }}
                  />
                  {fieldErrors.email && (
                    <small role="alert" style={{ color: '#b91c1c', display: 'block', marginTop: '0.25rem' }}>
                      {fieldErrors.email}
                    </small>
                  )}
                </div>

                <div>
                  <label htmlFor="register-password">Password</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <input
                      id="register-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Minimum 8 characters"
                      value={formValues.password}
                      onChange={handleChange}
                      aria-invalid={Boolean(fieldErrors.password)}
                      required
                      style={{ flex: 1, padding: '0.55rem 0.75rem' }}
                    />
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <small role="alert" style={{ color: '#b91c1c', display: 'block', marginTop: '0.25rem' }}>
                      {fieldErrors.password}
                    </small>
                  )}
                </div>

                <div>
                  <label htmlFor="register-dob">Date of birth</label>
                  <input
                    id="register-dob"
                    name="dateOfBirth"
                    type="date"
                    max={todayIso}
                    value={formValues.dateOfBirth}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.dateOfBirth)}
                    required
                    style={{ width: '100%', padding: '0.55rem 0.75rem', marginTop: '0.25rem' }}
                  />
                  {fieldErrors.dateOfBirth && (
                    <small role="alert" style={{ color: '#b91c1c', display: 'block', marginTop: '0.25rem' }}>
                      {fieldErrors.dateOfBirth}
                    </small>
                  )}
                </div>

                <div>
                  <label htmlFor="register-phone">Phone number</label>
                  <input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="98......."
                    value={formValues.phone}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.phone)}
                    required
                    style={{ width: '100%', padding: '0.55rem 0.75rem', marginTop: '0.25rem' }}
                  />
                  {fieldErrors.phone && (
                    <small role="alert" style={{ color: '#b91c1c', display: 'block', marginTop: '0.25rem' }}>
                      {fieldErrors.phone}
                    </small>
                  )}
                </div>

                <button
                  type="submit"
                  className="primary-link"
                  disabled={isSubmitting}
                  
                  style={{ width: '100%', marginTop: '0.5rem', display: 'flex',
    justifyContent: 'center',
    alignItems: 'center', }}
                >
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </form>

            <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.925rem' }}>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </main>
  )
}