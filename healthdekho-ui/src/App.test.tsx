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

beforeEach(() => {
  mockedApi.get.mockReset()
  mockedApi.post.mockReset()
  mockedApi.get.mockImplementation((url) => {
    if (url === '/auth/csrf') return Promise.resolve({})
    return Promise.reject(new Error('unauthorized'))
  })
})

describe('sign in', () => {
  it('validates required fields and supports password visibility', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/login']}><App /></MemoryRouter>)

    await screen.findByRole('heading', { name: 'Sign in to your account' })
    const password = screen.getByLabelText('Password')
    await user.type(password, 'secret')
    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Sign in securely' }))
    expect(await screen.findByText('Enter your email address')).toBeInTheDocument()
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it('validates email format and required password without calling the API', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/login']}><App /></MemoryRouter>)

    await user.type(await screen.findByLabelText('Email address'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Sign in securely' }))

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
    expect(screen.getByText('Enter your password')).toBeInTheDocument()
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it('shows the stable generic error for rejected credentials without throwing', async () => {
    mockedApi.post.mockRejectedValue(new Error('unauthorized'))
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/login']}><App /></MemoryRouter>)

    await user.type(await screen.findByLabelText('Email address'), 'customer@example.com')
    await user.type(screen.getByLabelText('Password'), 'bad password')
    await user.click(screen.getByRole('button', { name: 'Sign in securely' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
    expect(screen.getByRole('button', { name: 'Sign in securely' })).toBeEnabled()
  })

  it('redirects an unauthenticated protected route to login', async () => {
    render(<MemoryRouter initialEntries={['/dashboard']}><App /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Sign in to your account' })).toBeInTheDocument()
  })

  it('announces and disables the submit control while sign-in is pending', async () => {
    let rejectLogin: ((reason?: unknown) => void) | undefined
    mockedApi.post.mockReturnValue(new Promise((_, reject) => {
      rejectLogin = reject
    }))
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/login']}><App /></MemoryRouter>)

    await user.type(await screen.findByLabelText('Email address'), 'customer@example.com')
    await user.type(screen.getByLabelText('Password'), 'valid password')
    await user.click(screen.getByRole('button', { name: 'Sign in securely' }))

    const pendingButton = screen.getByRole('button', { name: 'Signing in…' })
    expect(pendingButton).toBeDisabled()
    expect(pendingButton).toHaveAttribute('aria-busy', 'true')

    rejectLogin?.(new Error('unauthorized'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
  })

  it('signs in, protects navigation, and logs out', async () => {
    const customer = {
      id: 1,
      email: 'customer@healthdekho.test',
      fullName: 'Demo Customer',
    }
    mockedApi.post.mockResolvedValueOnce({ data: customer }).mockResolvedValueOnce({})
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/login']}><App /></MemoryRouter>)

    await user.type(await screen.findByLabelText('Email address'), customer.email)
    await user.type(screen.getByLabelText('Password'), 'valid password')
    mockedApi.get.mockResolvedValue({ data: customer })
    await user.click(screen.getByRole('button', { name: 'Sign in securely' }))

    expect(await screen.findByRole('heading', { name: 'Welcome, Demo Customer' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Payment' }))
    expect(await screen.findByRole('heading', { name: 'Premium payments' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sign in to your account' })).toBeInTheDocument()
    })
    expect(mockedApi.post).toHaveBeenLastCalledWith('/auth/logout')
  })
})
