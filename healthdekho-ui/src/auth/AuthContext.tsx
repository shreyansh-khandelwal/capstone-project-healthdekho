import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import api from '../api'
import { AuthContext } from './auth-context'
import type { CustomerProfile } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    try {
      const { data } = await api.get<CustomerProfile>('/auth/me')
      setCustomer(data)
      return data
    } catch {
      setCustomer(null)
      return null
    }
  }, [])

  useEffect(() => {
    let active = true
    const handleUnauthorized = () => setCustomer(null)
    window.addEventListener('healthdekho:unauthorized', handleUnauthorized)
    api.get('/auth/csrf')
      .then(() => refreshSession())
      .catch(() => {
        if (active) setCustomer(null)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
      window.removeEventListener('healthdekho:unauthorized', handleUnauthorized)
    }
  }, [refreshSession])

  const login = useCallback(async (email: string, password: string) => {
    await api.get('/auth/csrf')
    const { data } = await api.post<CustomerProfile>('/auth/login', { email, password })
    setCustomer(data)
    return data
  }, [])

  const logout = useCallback(async () => {
    await api.post('/auth/logout')
    setCustomer(null)
  }, [])

  const value = useMemo(() => ({ customer, isLoading, login, logout, refreshSession }), [
    customer,
    isLoading,
    login,
    logout,
    refreshSession,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
