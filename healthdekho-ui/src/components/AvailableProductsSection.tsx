import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../dashboard'
import { fetchAvailableProducts } from '../products'
import type { AvailableProduct } from '../products'

function formatEnumLabel(value: string): string {
  return value.replace(/_/g, ' ')
}

export function AvailableProductsSection() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<AvailableProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')

  const loadProducts = useCallback(async () => {
    try {
      const response = await fetchAvailableProducts()
      setProducts(Array.isArray(response) ? response : [])
      setError('')
    } catch {
      setError('We could not load available insurance products. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    fetchAvailableProducts()
      .then((response) => {
        if (!active) return
        setProducts(Array.isArray(response) ? response : [])
      })
      .catch(() => {
        if (active) {
          setError('We could not load available insurance products. Please try again.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const policyTypes = useMemo(() => {
    const types = Array.from(new Set(products.map((product) => product.policyType)))
    return ['ALL', ...types]
  }, [products])

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return products.filter((product) => {
      const matchesType = selectedType === 'ALL' || product.policyType === selectedType
      const matchesQuery =
        !query ||
        product.productCode.toLowerCase().includes(query) ||
        product.policyName.toLowerCase().includes(query)
      return matchesType && matchesQuery
    })
  }, [products, searchQuery, selectedType])

  const handleRegister = (product: AvailableProduct) => {
    navigate(`/policies/register/${encodeURIComponent(product.productCode)}`, {
      state: { selectedProduct: product },
    })
  }

  return (
    <section className="portfolio" aria-labelledby="available-products-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Explore cover</p>
          <h2 id="available-products-title">Available insurance products</h2>
        </div>
        <p className="portfolio-count" aria-live="polite">
          {!isLoading && !error
            ? `${filteredProducts.length} ${filteredProducts.length === 1 ? 'product' : 'products'}`
            : ''}
        </p>
      </div>

      {!isLoading && !error && products.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product code or name..."
            aria-label="Search available insurance products"
            style={{ padding: '0.5rem 0.75rem', minWidth: '240px' }}
          />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            aria-label="Filter by policy type"
            style={{ padding: '0.5rem 0.75rem' }}
          >
            {policyTypes.map((type) => (
              <option key={type} value={type}>
                {type === 'ALL' ? 'All policy types' : formatEnumLabel(type)}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading && (
        <div
          className="policy-skeleton"
          role="status"
          aria-label="Loading available insurance products"
        >
          <span className="skeleton-line skeleton-title" />
          <span className="skeleton-line" />
          <span className="skeleton-line" />
        </div>
      )}

      {!isLoading && error && (
        <div className="dashboard-message error-message" role="alert">
          <div>
            <strong>Available products are unavailable</strong>
            <p>{error}</p>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setIsLoading(true)
              setError('')
              void loadProducts()
            }}
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">◇</span>
          <h3>No additional insurance products available</h3>
          <p>You have already registered for all active products currently in our catalog.</p>
        </div>
      )}

      {!isLoading && !error && products.length > 0 && filteredProducts.length === 0 && (
        <div className="empty-state">
          <h3>No matching products found</h3>
          <p>Try clearing your search filter to see all available insurance products.</p>
        </div>
      )}

      {!isLoading && !error && filteredProducts.length > 0 && (
        <div
          className="table-scroll"
          tabIndex={0}
          aria-label="Available insurance products table, scroll horizontally for all details"
        >
          <table className="policy-table">
            <caption className="sr-only">Available insurance products for registration</caption>
            <thead>
              <tr>
                <th scope="col" className="sticky-policy-id">Product code</th>
                <th scope="col">Policy name</th>
                <th scope="col">Policy type</th>
                <th scope="col">Policy term</th>
                <th scope="col" className="currency-column">Sum insured</th>
                <th scope="col">Premium frequency</th>
                <th scope="col" className="currency-column">Premium amount</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.productId}>
                  <th scope="row" className="sticky-policy-id">{product.productCode}</th>
                  <td>{product.policyName}</td>
                  <td>{formatEnumLabel(product.policyType)}</td>
                  <td>{product.termMonths} months</td>
                  <td className="currency-column">{formatCurrency(product.sumInsured)}</td>
                  <td>{formatEnumLabel(product.premiumFrequency)}</td>
                  <td className="currency-column">{formatCurrency(product.premiumAmount)}</td>
                  <td>
                    <button
                      type="button"
                      className="primary-link"
                      onClick={() => handleRegister(product)}
                    >
                      Register
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}