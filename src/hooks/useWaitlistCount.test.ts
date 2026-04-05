import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWaitlistCount } from './useWaitlistCount'

global.fetch = vi.fn()

describe('useWaitlistCount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns count from endpoint', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ count: 42 })
    } as Response)

    const { result } = renderHook(() => useWaitlistCount('/api/count'))

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    expect(result.current.count).toBe(42)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(false)
  })

  it('returns null while loading initially', () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useWaitlistCount('/api/count'))

    expect(result.current.count).toBeNull()
    expect(result.current.loading).toBe(true)
  })

  it('sets error on failed fetch', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({})
    } as Response)

    const { result } = renderHook(() => useWaitlistCount('/api/count'))

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    expect(result.current.error).toBe(true)
    expect(result.current.loading).toBe(false)
  })
})
