import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { SocialProof } from './SocialProof'

global.fetch = vi.fn()

describe('SocialProof', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders null while loading', () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

    const { container } = render(<SocialProof endpoint="/api/count" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders count after fetch', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ count: 42 })
    } as Response)

    render(<SocialProof endpoint="/api/count" />)

    await waitFor(() => {
      expect(screen.getByText('42 people are already waiting.')).toBeTruthy()
    })
  })

  it('uses custom render function when provided', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ count: 100 })
    } as Response)

    render(
      <SocialProof
        endpoint="/api/count"
        render={(count) => <span data-testid="custom">Total: {count}</span>}
      />
    )

    await waitFor(() => {
      const el = screen.getByTestId('custom')
      expect(el.textContent).toBe('Total: 100')
    })
  })
})
