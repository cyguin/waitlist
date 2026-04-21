import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { WaitlistForm } from './WaitlistForm'

global.fetch = vi.fn()

describe('WaitlistForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('submits with valid email and shows confirmed state', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: '1',
        email: 'test@example.com',
        referral_token: 'ABC123',
        position: 1,
      })
    } as Response)

    render(<WaitlistForm />)

    const input = screen.getByLabelText('Email address')
    fireEvent.change(input, { target: { value: 'test@example.com' } })

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText("You're #1 on the list!")).toBeTruthy()
    })
    expect(fetch).toHaveBeenCalledWith('/api/waitlist', expect.objectContaining({ method: 'POST' }))
  })

  it('shows error state on 422 response', async () => {
    vi.mocked(fetch).mockImplementation(() => 
      Promise.resolve(new Response(JSON.stringify({ error: 'Invalid email address.' }), { status: 422 }))
    )

    render(<WaitlistForm />)

    const input = screen.getByLabelText('Email address')
    fireEvent.change(input, { target: { value: 'test@invalid' } })

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Invalid email address.')).toBeTruthy()
    })
  })

  it('shows referral link after a successful signup', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: '1',
        email: 'test@example.com',
        referral_token: 'ABC123',
        position: 11,
      })
    } as Response)

    render(<WaitlistForm />)

    const input = screen.getByLabelText('Email address')
    fireEvent.change(input, { target: { value: 'test@example.com' } })

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByLabelText('Your referral link')).toHaveProperty('value', 'http://localhost:3000?ref=ABC123')
    })
  })
})
