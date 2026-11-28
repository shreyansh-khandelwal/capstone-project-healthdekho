import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RegisterPage } from './pages/RegisterPage'
import * as registerApi from './register'

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('validates required fields and prevents API call when form is empty', async () => {
    const registerSpy = vi.spyOn(registerApi, 'registerCustomer')

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/email address is required/i)).toBeInTheDocument()
    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    expect(screen.getByText(/date of birth is required/i)).toBeInTheDocument()
    expect(screen.getByText(/phone number is required/i)).toBeInTheDocument()
    expect(registerSpy).not.toHaveBeenCalled()
  })

  it('submits valid registration details and displays confirmation message', async () => {
    const registerSpy = vi.spyOn(registerApi, 'registerCustomer').mockResolvedValueOnce({
      customerId: 1,
      email: 'john.doe@gmail.com',
      fullName: 'John Doe',
      message: 'Customer registered successfully',
    })

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john.doe@gmail.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Password@123' },
    })
    fireEvent.change(screen.getByLabelText(/date of birth/i), {
      target: { value: '1995-05-20' },
    })
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: '9876543210' },
    })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalledWith({
        fullName: 'John Doe',
        email: 'john.doe@gmail.com',
        password: 'Password@123',
        dateOfBirth: '1995-05-20',
        phone: '9876543210',
      })
    })

    expect(await screen.findByText('Customer registered successfully')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /proceed to sign in/i })).toHaveAttribute(
      'href',
      '/login'
    )
  })

  it('displays duplicate email error when backend returns 409 Conflict', async () => {
    vi.spyOn(registerApi, 'registerCustomer').mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 409,
        data: { message: 'Email john.doe@gmail.com is already registered.' },
      },
    })

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john.doe@gmail.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password@123' } })
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1995-05-20' } })
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '9876543210' } })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(
      await screen.findByText(/email john\.doe@gmail\.com is already registered\./i)
    ).toBeInTheDocument()
  })
})