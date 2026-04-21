import type { JoinResponse } from '../types'

export interface SignupResult {
  id: string
  email: string
  ownCode: string
  position: number
  alreadyExists: boolean
}

export interface WaitlistFormProps {
  className?: string
  onSuccess?: (data: JoinResponse) => void
  onError?: (error: string) => void
  placeholder?: string
  buttonText?: string
  redirectTo?: string
  theme?: 'light' | 'dark'
}

export interface SocialProofProps {
  endpoint: string
  pollInterval?: number
  className?: string
  render?: (count: number) => React.ReactNode
}

export interface UseWaitlistCountResult {
  count: number | null
  loading: boolean
  error: boolean
}

export interface WaitlistAdminProps {
  endpoint: string
  adminSecret: string
  theme?: 'light' | 'dark'
  pageSize?: number
  className?: string
}
