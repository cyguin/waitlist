'use client'

import { useWaitlistCount } from '../hooks/useWaitlistCount'
import type { SocialProofProps } from './types'

export function SocialProof({
  endpoint,
  pollInterval = 60000,
  className,
  render
}: SocialProofProps) {
  const { count, loading } = useWaitlistCount(endpoint, pollInterval)

  if (loading || count === null) return null

  if (render) {
    return <>{render(count)}</>
  }

  return (
    <span className={className}>
      {count} people are already waiting.
    </span>
  )
}
