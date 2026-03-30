export interface Signup {
  id: string
  email: string
  referralCode: string | null
  ownCode: string
  position: number
  invitedAt: string | null
  createdAt: string
}

export interface WaitlistAdapter {
  migrate(): Promise<void>
  insertSignup(email: string, referralCode?: string): Promise<Signup>
  getCount(): Promise<number>
  getAll(): Promise<Signup[]>
  markInvited(ids: string[]): Promise<void>
}

export interface JoinResponse {
  id: string
  email: string
  ownCode: string
  position: number
  alreadyExists: boolean
}

export interface CountResponse {
  count: number
}
