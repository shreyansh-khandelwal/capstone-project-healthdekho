import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { customer, isLoading, refreshSession } = useAuth()
  const location = useLocation()
  const [checkedPath, setCheckedPath] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    refreshSession().finally(() => {
      if (active) setCheckedPath(location.pathname)
    })
    return () => {
      active = false
    }
  }, [location.pathname, refreshSession])

  if (isLoading || checkedPath !== location.pathname) {
    return (
      <main className="app-state" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        Checking your session…
      </main>
    )
  }

  if (!customer) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
