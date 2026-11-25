import { createContext } from 'react'

export type CustomerProfile = {
  id: number
  email: string
  fullName: string
}

export type AuthContextValue = {
  customer: CustomerProfile | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<CustomerProfile>
  logout: () => Promise<void>
  refreshSession: () => Promise<CustomerProfile | null>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
