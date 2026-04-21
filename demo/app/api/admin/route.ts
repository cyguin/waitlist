import { NextRequest, NextResponse } from 'next/server'
import { getAdapter } from '@/lib/db'

const ADMIN_SECRET = process.env.ADMIN_SECRET

function requireAuth(authHeader: string | null): boolean {
  if (!ADMIN_SECRET) return false
  if (!authHeader) return false
  const [scheme, token] = authHeader.split(' ')
  return scheme?.toLowerCase() === 'bearer' && token === ADMIN_SECRET
}

function requireConfiguredAdminSecret(): NextResponse | null {
  if (!ADMIN_SECRET) {
    return NextResponse.json({ error: 'ADMIN_SECRET is not configured' }, { status: 500 })
  }
  return null
}

export async function GET(request: NextRequest) {
  const configError = requireConfiguredAdminSecret()
  if (configError) return configError

  const authHeader = request.headers.get('authorization')
  
  if (!requireAuth(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const adapter = await getAdapter()
    await adapter.migrate()
    
    const url = new URL(request.url)
    const action = url.searchParams.get('action')
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100)
    const page = Math.max(Number(url.searchParams.get('page')) || 1, 1)
    const offset = (page - 1) * limit

    if (action === 'exportCsv') {
      const signups = await adapter.getAll({ limit: 100000, offset: 0 })
      const csv = [
        'id,email,position,referralCount,invited,createdAt',
        ...signups.map(s => [s.id, s.email, s.position, s.referralCount, s.invitedAt ? 'true' : 'false', s.createdAt].join(','))
      ].join('\n')
      
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="waitlist.csv"'
        }
      })
    }

    const [signups, total] = await Promise.all([
      adapter.getAll({ limit, offset }),
      adapter.getCount()
    ])

    return NextResponse.json({ signups, total, page, limit })
  } catch (err: any) {
    console.error('Waitlist admin GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const configError = requireConfiguredAdminSecret()
  if (configError) return configError

  const authHeader = request.headers.get('authorization')
  
  if (!requireAuth(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const adapter = await getAdapter()
    await adapter.migrate()
    
    const url = new URL(request.url)
    const idsParam = url.searchParams.get('ids')
    
    if (!idsParam) {
      return NextResponse.json({ error: 'Missing ids param' }, { status: 400 })
    }
    
    const ids = idsParam.split(',').filter(Boolean)
    const updated = await adapter.markInvited(ids)
    
    return NextResponse.json({ updated })
  } catch (err: any) {
    console.error('Waitlist admin POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
