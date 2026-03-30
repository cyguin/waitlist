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
        ownCode: 'ABC123',
        position: 1,
        alreadyExists: false
      })
    } as Response)

    render(
      <WaitlistForm
        action="/api/join"
        countEndpoint="/api/count"
      />
    )

    const input = screen.getByPlaceholderText('your@email.com')
    fireEvent.change(input, { target: { value: 'test@example.com' } })

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText("you're on the list")).toBeTruthy()
    })
  })

  it('shows error state on 422 response', async () => {
    vi.mocked(fetch).mockImplementation(() => 
      Promise.resolve(new Response(JSON.stringify({ error: 'invalid email' }), { status: 422 }))
    )

    render(
      <WaitlistForm
        action="/api/join"
        countEndpoint="/api/count"
      />
    )

    const input = screen.getByPlaceholderText('your@email.com')
    fireEvent.change(input, { target: { value: 'test@invalid' } })

    const button = screen.getByRole('button')
    fireEvent.submit(button)

    await waitFor(() => {
      expect(screen.getByText('invalid email address')).toBeTruthy()
    })
  })

  it('shows referral link when showReferral is true', async () => {
    vi.mocked(fetch).mockImplementation((() => {
      let callCount = 0
      return (): Promise<Response> => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ count: 10 })
          } as unknown as Response)
        }
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            id: '1',
            email: 'test@example.com',
            ownCode: 'ABC123',
            position: 11,
            alreadyExists: false
          })
        } as unknown as Response)
      }
    })())

    render(
      <WaitlistForm
        action="/api/join"
        countEndpoint="/api/count"
        showReferral
      />
    )

    await waitFor(() => {
      expect(screen.getByText('10 people are already waiting.')).toBeTruthy()
    })

    const input = screen.getByPlaceholderText('your@email.com')
    fireEvent.change(input, { target: { value: 'test@example.com' } })

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(/ABC123/)).toBeTruthy()
    })
  })
})
