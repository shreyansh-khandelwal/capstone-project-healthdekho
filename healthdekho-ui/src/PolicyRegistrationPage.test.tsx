import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PolicyRegistrationPage } from './pages/PolicyRegistrationPage'
import * as policyRegistrationApi from './policyRegistration'
import * as productsApi from './products'

vi.mock('./auth/useAuth', () => ({
  useAuth: () => ({
    customer: {
      customerId: 1,
      fullName: 'Aarav Sharma',
      email: 'aarav@healthdekho.in',
      dateOfBirth: '1994-05-10',
      phone: '+91-9876543210',
    },
    logout: vi.fn(),
  }),
}))

vi.mock('./products', () => ({
  fetchAvailableProducts: vi.fn(),
}))

const SAMPLE_PRODUCT: productsApi.AvailableProduct = {
  productId: 101,
  productCode: 'TERM001',
  policyName: 'Secure Life Term Plan',
  policyType: 'TERM_LIFE',
  termMonths: 240,
  sumInsured: 5000000,
  premiumFrequency: 'YEARLY',
  premiumAmount: 2500,
  minEntryAge: 18,
  maxEntryAge: 65,
}

function renderWithRouter(initialEntry: string | { pathname: string; state?: unknown }) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/policies/register/:productCode" element={<PolicyRegistrationPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PolicyRegistrationPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('pre-populates customer and product fields and auto-calculates maturity date and total premium payable', () => {
    renderWithRouter({
      pathname: '/policies/register/TERM001',
      state: { selectedProduct: SAMPLE_PRODUCT },
    })

    expect(screen.getByLabelText(/customer name/i)).toHaveValue('Aarav Sharma')
    expect(screen.getByLabelText(/contact information/i)).toHaveValue(
      '+91-9876543210 • aarav@healthdekho.in'
    )
    expect(screen.getByLabelText(/policy name/i)).toHaveValue('Secure Life Term Plan')
    expect(screen.getByLabelText(/policy term/i)).toHaveValue('240 months')

    // Change start date to 2026-12-01 and verify auto-calculated maturity date (2046-12-01)
    const startDateInput = screen.getByLabelText(/policy start date/i)
    fireEvent.change(startDateInput, { target: { value: '2026-12-01' } })

    expect(screen.getByLabelText(/policy maturity date/i)).toHaveValue('01 Dec 2046')
    // 20 yearly installments * 2500 = 50,000.00
    expect(screen.getByLabelText(/total premium payable/i)).toHaveValue('₹50,000.00')
  })

  it('submits registration payload and displays generated policy identifier confirmation', async () => {
    const registerSpy = vi.spyOn(policyRegistrationApi, 'registerPolicy').mockResolvedValueOnce({
      policyNumber: 'POL-AB12CD34',
      policyName: 'Secure Life Term Plan',
      startDate: '2026-12-01',
      maturityDate: '2046-12-01',
      premiumAmount: 2500,
      sumInsured: 5000000,
      status: 'ACTIVE',
    })

    renderWithRouter({
      pathname: '/policies/register/TERM001',
      state: { selectedProduct: SAMPLE_PRODUCT },
    })

    fireEvent.change(screen.getByLabelText(/policy start date/i), {
      target: { value: '2026-12-01' },
    })

    fireEvent.click(screen.getByRole('button', { name: /confirm & register policy/i }))

    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalledWith({
        productCode: 'TERM001',
        startDate: '2026-12-01',
      })
    })

    expect(await screen.findByText(/policy pol-ab12cd34 is now active/i)).toBeInTheDocument()
  })

  it('displays backend business-rule violation error when registration fails', async () => {
    vi.spyOn(policyRegistrationApi, 'registerPolicy').mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 409,
        data: { message: 'Customer already owns an active policy for TERM001' },
      },
    })

    renderWithRouter({
      pathname: '/policies/register/TERM001',
      state: { selectedProduct: SAMPLE_PRODUCT },
    })

    fireEvent.click(screen.getByRole('button', { name: /confirm & register policy/i }))

    expect(
      await screen.findByText(/customer already owns an active policy for term001/i)
    ).toBeInTheDocument()
  })
})