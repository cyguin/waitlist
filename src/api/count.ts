import { CountResponse } from '../adapters/interface'

export async function handleCount(
  waitlist: Awaited<ReturnType<typeof import('../core').createWaitlist>>
): Promise<{ status: number; data: CountResponse }> {
  try {
    const count = await waitlist.count()
    return { status: 200, data: { count } }
  } catch (error) {
    console.error('Count error:', error)
    return { status: 500, data: { count: 0 } }
  }
}
