import { NavLink, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useAuth } from '../auth/useAuth'

export function AppShell({ children }: { children: ReactNode }) {
  const { customer, logout } = useAuth()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')

  async function handleLogout() {
    setLogoutError('')
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      setLogoutError('Unable to sign out. Please try again.')
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/dashboard" aria-label="HealthDekho dashboard">
          <span className="brand-mark" aria-hidden="true">H</span>
          HealthDekho
        </a>
        <nav aria-label="Primary navigation">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/payment">Payment</NavLink>
          <NavLink to="/search">Policy Search</NavLink>
        </nav>
        <div className="account-actions">
          <span className="customer-name">{customer?.fullName}</span>
          <button className="text-button" type="button" onClick={handleLogout}>Sign out</button>
        </div>
      </header>
      {logoutError && <p className="page-message error-message" role="alert">{logoutError}</p>}
      <main className="workspace">{children}</main>
    </div>
  )
}
