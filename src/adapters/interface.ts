export interface Signup {
  id: string
  email: string
  referralCode: string | null
  ownCode: string
  position: number
  referralCount: number
  invitedAt: string | null
  createdAt: string
}

export interface WaitlistAdapter {
  migrate(): Promise<void>
  insertSignup(email: string, referralCode?: string): Promise<Signup>
  getCount(): Promise<number>
  getAll(options?: { limit?: number; offset?: number }): Promise<Signup[]>
  markInvited(ids: string[]): Promise<number>
}

export interface InviteResult {
  updated: number
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

export interface AdminListResponse {
  signups: Signup[]
  total: number
  page: number
  limit: number
}

export interface AdminMarkInvitedResponse {
  updated: number
}
