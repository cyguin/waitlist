import { JoinResponse } from '../adapters/interface'

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export interface JoinRequest {
  email: string
  ref?: string
}

export async function handleJoin(
  body: JoinRequest,
  waitlist: Awaited<ReturnType<typeof import('../core').createWaitlist>>
): Promise<{ status: number; data: JoinResponse | { error: string } }> {
  const { email, ref } = body

  if (!email || !isValidEmail(email)) {
    return { status: 422, data: { error: 'invalid email' } }
  }

  try {
    const result = await waitlist.join(email.trim(), ref)

    if (result.alreadyExists) {
      return { status: 200, data: result }
    }

    return { status: 201, data: result }
  } catch (error) {
    console.error('Join error:', error)
    return { status: 500, data: { error: 'internal error' } }
  }
}
