import axios from 'axios'
import api from './api'

export interface CustomerRegistrationRequest {
  email: string
  password: string
  fullName: string
  dateOfBirth: string
  phone: string
}

export interface CustomerRegistrationResponse {
  customerId: number
  email: string
  fullName: string
  message: string
}

export interface RegistrationFormErrors {
  fullName?: string
  email?: string
  password?: string
  dateOfBirth?: string
  phone?: string
}

export function getTodayLocalIsoDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function validateCustomerRegistration(
  values: CustomerRegistrationRequest
): RegistrationFormErrors {
  const errors: RegistrationFormErrors = {}
  const todayIso = getTodayLocalIsoDate()

  if (!values.fullName.trim()) {
    errors.fullName = 'Full name is required.'
  } else if (values.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.'
  }

  const trimmedEmail = values.email.trim()
  if (!trimmedEmail) {
    errors.email = 'Email address is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!values.password) {
    errors.password = 'Password is required.'
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.'
  } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(values.password)) {
    errors.password = 'Password must include at least one letter and one number.'
  }

  if (!values.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required.'
  } else if (values.dateOfBirth > todayIso) {
    errors.dateOfBirth = 'Date of birth cannot be in the future.'
  }

  const normalizedPhone = values.phone.trim()
  if (!normalizedPhone) {
    errors.phone = 'Phone number is required.'
  } else if (!/^\+?[0-9]{10,15}$/.test(normalizedPhone.replace(/[\s-]/g, ''))) {
    errors.phone = 'Enter a valid 10 to 15 digit phone number.'
  }

  return errors
}

export function extractRegistrationApiError(err: unknown): {
  message: string
  fieldErrors: RegistrationFormErrors
} {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    const data = err.response?.data as
      | {
          message?: string
          error?: string
          fieldErrors?: RegistrationFormErrors
          errors?: RegistrationFormErrors
        }
      | undefined

    const fieldErrors = data?.fieldErrors ?? data?.errors ?? {}

    if (data?.message) {
      return { message: data.message, fieldErrors }
    }
    if (status === 409) {
      return {
        message: 'An account with this email address already exists.',
        fieldErrors: { email: 'Email is already registered.', ...fieldErrors },
      }
    }
    if (status === 400) {
      return {
        message: 'Please correct the highlighted registration fields and try again.',
        fieldErrors,
      }
    }
    if (status && status >= 500) {
      return {
        message: 'Unable to complete registration due to a server error. Please try again later.',
        fieldErrors,
      }
    }
  }

  return {
    message: 'Unable to register right now. Please check your connection and try again.',
    fieldErrors: {},
  }
}

export async function registerCustomer(
  payload: CustomerRegistrationRequest
): Promise<CustomerRegistrationResponse> {
  const { data } = await api.post<CustomerRegistrationResponse>('/auth/register', payload)
  return data
}