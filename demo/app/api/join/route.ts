import { NextRequest, NextResponse } from 'next/server'
import { getAdapter } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const adapter = await getAdapter()
    await adapter.migrate()

    const body = await request.json()
    const { email, referralCode } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 422 })
    }

    const signup = await adapter.insertSignup(email, referralCode)

    return NextResponse.json({
      id: signup.id,
      email: signup.email,
      ownCode: signup.ownCode,
      position: signup.position,
      alreadyExists: false
    }, { status: 201 })
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'Email already on waitlist' }, { status: 409 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}