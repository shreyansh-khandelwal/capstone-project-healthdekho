import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AiRecommendationsSection } from './components/AiRecommendationsSection'
import * as recommendationsApi from './recommendations'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('./auth/useAuth', () => ({
  useAuth: () => ({
    customer: {
      customerId: 1,
      fullName: 'Aarav Sharma',
      email: 'aarav@healthdekho.in',
      dateOfBirth: '1994-05-10',
    },
  }),
}))

const MOCK_RECOMMENDATIONS: recommendationsApi.PolicyRecommendation[] = [
  {
    productId: 101,
    productCode: 'HD-HLTH-101',
    policyName: 'Care Shield Family Floater',
    policyType: 'HEALTH',
    policyTerm: 12,
    sumInsured: 500000,
    premiumFrequency: 'YEARLY',
    premiumAmount: 14500,
    recommendationReason: 'Matches your family hospitalization goals at an affordable yearly premium.',
    suitability: 94.5,
  },
]

describe('AiRecommendationsSection', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockNavigate.mockClear()
  })

  it('expands AI advisor panel on dashboard, submits preferences, and renders tabular recommendations', async () => {
    const generateSpy = vi
      .spyOn(recommendationsApi, 'generateRecommendations')
      .mockResolvedValueOnce(MOCK_RECOMMENDATIONS)

    render(
      <MemoryRouter>
        <AiRecommendationsSection />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /get ai recommendations/i }))

    expect(screen.getByLabelText(/date of birth/i)).toHaveValue('1994-05-10')

    fireEvent.change(screen.getByLabelText(/insurance type/i), {
      target: { value: 'HEALTH' },
    })
    fireEvent.change(screen.getByLabelText(/preferred policy term/i), {
      target: { value: '12' },
    })
    fireEvent.change(screen.getByLabelText(/insurance goals and preferences/i), {
      target: { value: 'Family hospitalization cover' },
    })

    fireEvent.click(screen.getByRole('button', { name: /generate recommendations/i }))

    await waitFor(() => {
      expect(generateSpy).toHaveBeenCalledWith({
        dateOfBirth: '1994-05-10',
        insuranceGoals: 'Family hospitalization cover',
        preferredTerm: 12,
        preferredPolicyType: 'HEALTH',
      })
    })

    expect(await screen.findByText('HD-HLTH-101')).toBeInTheDocument()
    expect(screen.getByText('Care Shield Family Floater')).toBeInTheDocument()
    expect(
      screen.getByText(/matches your family hospitalization goals/i)
    ).toBeInTheDocument()
    expect(screen.getByText('94.5%')).toBeInTheDocument()
  })

  it('validates that at least one input is provided before submitting', async () => {
    const generateSpy = vi.spyOn(recommendationsApi, 'generateRecommendations')

    render(
      <MemoryRouter>
        <AiRecommendationsSection defaultOpen />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/date of birth/i), {
      target: { value: '' },
    })

    fireEvent.click(screen.getByRole('button', { name: /generate recommendations/i }))

    expect(
      await screen.findByText(/please provide at least one input/i)
    ).toBeInTheDocument()
    expect(generateSpy).not.toHaveBeenCalled()
  })

  it('navigates to policy registration with pre-populated product when Register is clicked', async () => {
    vi.spyOn(recommendationsApi, 'generateRecommendations').mockResolvedValueOnce(
      MOCK_RECOMMENDATIONS
    )

    render(
      <MemoryRouter>
        <AiRecommendationsSection defaultOpen />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /generate recommendations/i }))

    const registerBtn = await screen.findByRole('button', { name: /register/i })
    fireEvent.click(registerBtn)

    expect(mockNavigate).toHaveBeenCalledWith('/policies/register/HD-HLTH-101', {
      state: {
        selectedProduct: {
          productId: 101,
          productCode: 'HD-HLTH-101',
          policyName: 'Care Shield Family Floater',
          policyType: 'HEALTH',
          termMonths: 12,
          sumInsured: 500000,
          premiumFrequency: 'YEARLY',
          premiumAmount: 14500,
          minEntryAge: 0,
          maxEntryAge: 120,
        },
      },
    })
  })
})