import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AvailableProductsSection } from './components/AvailableProductsSection';
import * as productsApi from './products';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('./products', () => ({
  fetchAvailableProducts: vi.fn(),
}));

const MOCK_PRODUCTS: productsApi.AvailableProduct[] = [
  {
    productId: 101,
    productCode: 'HD-HLTH-101',
    policyName: 'Care Shield Family Floater',
    policyType: 'HEALTH',
    termMonths: 12,
    sumInsured: 500000,
    premiumFrequency: 'YEARLY',
    premiumAmount: 14500,
    minEntryAge: 18,
    maxEntryAge: 65,
  },
  {
    productId: 102,
    productCode: 'HD-TERM-102',
    policyName: 'LifeSecure Term Protect',
    policyType: 'TERM_LIFE',
    termMonths: 120,
    sumInsured: 2500000,
    premiumFrequency: 'MONTHLY',
    premiumAmount: 1850,
    minEntryAge: 21,
    maxEntryAge: 60,
  },
];

describe('AvailableProductsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading indicator and then renders available products table', async () => {
    vi.mocked(productsApi.fetchAvailableProducts).mockResolvedValueOnce(MOCK_PRODUCTS);

    render(
      <MemoryRouter>
        <AvailableProductsSection />
      </MemoryRouter>
    );

    expect(screen.getByRole('status')).toHaveTextContent(/loading available insurance products/i);

    await waitFor(() => {
      expect(screen.getByText('HD-HLTH-101')).toBeInTheDocument();
    });

    expect(screen.getByText('Care Shield Family Floater')).toBeInTheDocument();
    expect(screen.getByText('HD-TERM-102')).toBeInTheDocument();
    expect(screen.getByText('LifeSecure Term Protect')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /register/i })).toHaveLength(2);
  });

  it('filters products by search input and policy type dropdown', async () => {
    vi.mocked(productsApi.fetchAvailableProducts).mockResolvedValueOnce(MOCK_PRODUCTS);

    render(
      <MemoryRouter>
        <AvailableProductsSection />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Care Shield Family Floater')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/search available insurance products/i), {
      target: { value: 'LifeSecure' },
    });

    expect(screen.queryByText('Care Shield Family Floater')).not.toBeInTheDocument();
    expect(screen.getByText('LifeSecure Term Protect')).toBeInTheDocument();
  });

  it('navigates to policy registration with pre-populated product when Register is clicked', async () => {
    vi.mocked(productsApi.fetchAvailableProducts).mockResolvedValueOnce(MOCK_PRODUCTS);

    render(
      <MemoryRouter>
        <AvailableProductsSection />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Care Shield Family Floater')).toBeInTheDocument();
    });

    const registerButtons = screen.getAllByRole('button', { name: /register/i });
    fireEvent.click(registerButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/policies/register/HD-HLTH-101', {
      state: { selectedProduct: MOCK_PRODUCTS[0] },
    });
  });

  it('shows empty state message when customer already holds all active products', async () => {
    vi.mocked(productsApi.fetchAvailableProducts).mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <AvailableProductsSection />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/no additional insurance products available right now/i)
      ).toBeInTheDocument();
    });
  });

  it('renders error alert and retries fetch on failure', async () => {
    vi.mocked(productsApi.fetchAvailableProducts)
      .mockRejectedValueOnce({ response: { data: { message: 'Failed to fetch catalog' } } })
      .mockResolvedValueOnce(MOCK_PRODUCTS);

    render(
      <MemoryRouter>
        <AvailableProductsSection />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch catalog');
    });

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByText('Care Shield Family Floater')).toBeInTheDocument();
    });
  });
});