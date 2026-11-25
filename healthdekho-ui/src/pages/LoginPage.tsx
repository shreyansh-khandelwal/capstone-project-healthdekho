import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

type FieldErrors = {
  email?: string
  password?: string
}

export function LoginPage() {
  const { customer, isLoading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  if (!isLoading && customer) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: FieldErrors = {}
    if (!email.trim()) nextErrors.email = 'Enter your email address'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = 'Enter a valid email address'
    if (!password) nextErrors.password = 'Enter your password'
    setFieldErrors(nextErrors)
    setMessage('')

    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await login(email.trim(), password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' ? from : '/dashboard', { replace: true })
    } catch {
      setMessage('Invalid email or password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-intro" aria-labelledby="login-intro-title">
        <div className="brand login-brand">
          <span className="brand-mark" aria-hidden="true">H</span>
          HealthDekho
        </div>
        <p className="eyebrow">Your protection, one place</p>
        <h1 id="login-intro-title">Manage your health policies with confidence.</h1>
        <p className="intro-copy">
          Sign in to review coverage, make payments, and keep your family protected.
        </p>
        <ul className="trust-list">
          <li>Private customer workspace</li>
          <li>Protected policy information</li>
          <li>Secure session-based access</li>
        </ul>
      </section>

      <section className="login-card" aria-labelledby="login-title">
        <div className="login-card-heading">
          <p className="eyebrow">Welcome back</p>
          <h2 id="login-title">Sign in to your account</h2>
          <p>Use the email and password registered with HealthDekho.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={320}
              required
              value={email}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              onChange={(event) => setEmail(event.target.value)}
            />
            {fieldErrors.email && <p id="email-error" className="field-error">{fieldErrors.email}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                maxLength={72}
                required
                value={password}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                className="password-toggle"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password && <p id="password-error" className="field-error">{fieldErrors.password}</p>}
          </div>

          <div aria-live="assertive" aria-atomic="true">
            {message && <div className="form-message error-message" role="alert">{message}</div>}
          </div>

          <button className="primary-button" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting && <span className="spinner" aria-hidden="true" />}
            {isSubmitting ? 'Signing in…' : 'Sign in securely'}
          </button>
        </form>

        <p className="security-note">Your credentials are encrypted in transit and are never displayed or stored by this site.</p>
      </section>
    </main>
  )
}
