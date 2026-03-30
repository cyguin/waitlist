import { useEffect, useState } from 'react'
import type { UseWaitlistCountResult } from '../components/types'

export function useWaitlistCount(
  endpoint: string,
  interval: number = 60000
): UseWaitlistCountResult {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true

    const fetchCount = async () => {
      try {
        const res = await fetch(endpoint)
        if (!res.ok) throw new Error('fetch failed')
        const data = await res.json()
        if (mounted) {
          setCount(data.count)
          setLoading(false)
          setError(false)
        }
      } catch {
        if (mounted) {
          setError(true)
          setLoading(false)
        }
      }
    }

    fetchCount()
    const timer = setInterval(fetchCount, interval)

    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [endpoint, interval])

  return { count, loading, error }
}
