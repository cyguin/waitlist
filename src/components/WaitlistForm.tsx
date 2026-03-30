'use client'

import { useState } from 'react'
import { useWaitlistCount } from '../hooks/useWaitlistCount'
import type { WaitlistFormProps, SignupResult } from './types'

type FormState = 'idle' | 'submitting' | 'confirmed' | 'error'

export function WaitlistForm({
  action,
  countEndpoint,
  showReferral = false,
  confirmMessage = "you're on the list",
  pollInterval = 60000,
  className,
  inputClassName,
  buttonClassName,
  buttonLabel = 'join waitlist',
  renderConfirm
}: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult] = useState<SignupResult | null>(null)
  const { count } = useWaitlistCount(countEndpoint, pollInterval)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('submitting')
    setErrorMessage('')

    try {
      const res = await fetch(action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (res.status === 201 || res.status === 200) {
        setResult(data)
        setState('confirmed')
      } else if (res.status === 422) {
        setErrorMessage('invalid email address')
        setState('error')
      } else if (res.status === 429) {
        setErrorMessage('too many requests, try again later')
        setState('error')
      } else {
        setErrorMessage('something went wrong')
        setState('error')
      }
    } catch {
      setErrorMessage('something went wrong')
      setState('error')
    }
  }

  if (state === 'confirmed' && result) {
    return (
      <div className={className}>
        <p>{confirmMessage}</p>
        {showReferral && (
          <p>
            Share your link:{' '}
            {typeof window !== 'undefined' && (
              <a href={`${window.location.origin}${window.location.pathname}?ref=${result.ownCode}`}>
                {window.location.origin}{window.location.pathname}?ref={result.ownCode}
              </a>
            )}
          </p>
        )}
        {renderConfirm && renderConfirm(result)}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {count !== null && (
        <p>{count} people are already waiting.</p>
      )}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        disabled={state === 'submitting'}
        className={inputClassName}
      />
      <button
        type="submit"
        disabled={state === 'submitting'}
        className={buttonClassName}
      >
        {state === 'submitting' ? 'joining...' : buttonLabel}
      </button>
      {state === 'error' && errorMessage && (
        <p>{errorMessage}</p>
      )}
    </form>
  )
}
