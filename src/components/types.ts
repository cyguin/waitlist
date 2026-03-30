export interface SignupResult {
  id: string
  email: string
  ownCode: string
  position: number
  alreadyExists: boolean
}

export interface WaitlistFormProps {
  action: string
  countEndpoint: string
  showReferral?: boolean
  confirmMessage?: string
  pollInterval?: number
  className?: string
  inputClassName?: string
  buttonClassName?: string
  buttonLabel?: string
  renderConfirm?: (signup: SignupResult) => React.ReactNode
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
