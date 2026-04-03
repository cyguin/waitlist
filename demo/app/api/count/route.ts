import { NextResponse } from 'next/server'
import { getAdapter } from '@/lib/db'

export async function GET() {
  try {
    const adapter = await getAdapter()
    await adapter.migrate()
    const count = await adapter.getCount()
    return NextResponse.json({ count })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}