import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from './api'
import App from './App'

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)
const customer = {
  id: 1,
  email: 'customer@gmail.com',
  fullName: 'Demo Customer',
}
const policy = {
  policyIdentifier: 'HLT-2026-001',
  productName: 'HealthShield Plus',
  policyType: 'Health',
  termMonths: 12,
  startDate: '2026-01-15',
  maturityDate: '2027-01-14',
  premiumFrequency: 'Monthly',
  premiumAmount: 1499,
  sumInsured: 500000,
  status: 'ACTIVE',
}

beforeEach(() => {
  mockedApi.get.mockReset()
  mockedApi.post.mockReset()
})

function authenticatedApi() {
  mockedApi.get.mockImplementation((url) => {
    if (url === '/auth/csrf') return Promise.resolve({})
    if (url === '/auth/me') return Promise.resolve({ data: customer })
    return Promise.reject(new Error(`Unexpected request: ${url}`))
  })
}

describe('policy dashboard', () => {
  it('shows an explicit loading state followed by accessible portfolio facts', async () => {
    authenticatedApi()
    let resolveDashboard: ((value: unknown) => void) | undefined
    mockedApi.get.mockImplementation((url) => {
      if (url === '/auth/csrf') return Promise.resolve({})
      if (url === '/auth/me') return Promise.resolve({ data: customer })
      if (url === '/dashboard') return new Promise((resolve) => {
        resolveDashboard = resolve
      })
      return Promise.reject(new Error(`Unexpected request: ${url}`))
    })

    render(<MemoryRouter initialEntries={['/dashboard']}><App /></MemoryRouter>)
    expect(await screen.findByRole('status', { name: 'Loading your policies' })).toBeInTheDocument()

    resolveDashboard?.({ data: {
      policies: [policy],
      page: 0,
      size: 8,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    } })

    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Policy identifier' })).toBeInTheDocument()
    expect(screen.getByText('HLT-2026-001')).toBeInTheDocument()
    expect(screen.getByText('HealthShield Plus')).toBeInTheDocument()
    expect(screen.getByText('₹1,499.00')).toBeInTheDocument()
    expect(screen.getByText('₹5,00,000.00')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })

  it('explains an empty portfolio and links to product discovery', async () => {
    authenticatedApi()
    mockedApi.get.mockImplementation((url) => {
      if (url === '/auth/csrf') return Promise.resolve({})
      if (url === '/auth/me') return Promise.resolve({ data: customer })
      if (url === '/dashboard') return Promise.resolve({ data: {
        policies: [],
        page: 0,
        size: 8,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      } })
      return Promise.reject(new Error(`Unexpected request: ${url}`))
    })

    render(<MemoryRouter initialEntries={['/dashboard']}><App /></MemoryRouter>)

    expect(await screen.findByRole('heading', {
      name: 'You do not have any registered policies yet',
    })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Discover products' })).toHaveAttribute('href', '/products')
  })

  it('handles a failed request and supports recovery without throwing', async () => {
    authenticatedApi()
    let attempts = 0
    mockedApi.get.mockImplementation((url) => {
      if (url === '/auth/csrf') return Promise.resolve({})
      if (url === '/auth/me') return Promise.resolve({ data: customer })
      if (url === '/dashboard') {
        attempts += 1
        return attempts === 1
          ? Promise.reject(new Error('offline'))
          : Promise.resolve({ data: {
              policies: [policy],
              page: 0,
              size: 8,
              totalElements: 1,
              totalPages: 1,
              first: true,
              last: true,
            } })
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`))
    })
    const user = userEvent.setup()

    render(<MemoryRouter initialEntries={['/dashboard']}><App /></MemoryRouter>)

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not load your policies')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('table')).toBeInTheDocument()
    await waitFor(() => expect(attempts).toBe(2))
  })
})
