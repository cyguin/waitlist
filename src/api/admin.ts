import type {
  WaitlistAdapter,
  AdminListResponse,
  AdminMarkInvitedResponse,
} from '../adapters/interface'

export interface AdminHandlerConfig {
  adapter: WaitlistAdapter
  adminSecret: string
}

function requireAuth(secret: string, authHeader: string | null): void {
  if (!authHeader) {
    const err = new Error('Unauthorized')
    ;(err as any).status = 401
    throw err
  }
  const [scheme, token] = authHeader.split(' ')
  if (
    scheme?.toLowerCase() !== 'bearer' ||
    token !== secret
  ) {
    const err = new Error('Unauthorized')
    ;(err as any).status = 401
    throw err
  }
}

export async function adminHandler(
  config: AdminHandlerConfig,
  request: Request
): Promise<Response> {
  const url = new URL(request.url)
  const action = url.searchParams.get('action')
  const authHeader = request.headers.get('authorization')

  try {
    requireAuth(config.adminSecret, authHeader)
  } catch (err) {
    const e = err as any
    return new Response(JSON.stringify({ error: e.message }), {
      status: e.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    if (action === 'list') {
      const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 100)
      const page = Math.max(Number(url.searchParams.get('page') ?? 1), 1)
      const offset = (page - 1) * limit

      const [signups, total] = await Promise.all([
        config.adapter.getAll({ limit, offset }),
        config.adapter.getCount(),
      ])

      const body: AdminListResponse = { signups, total, page, limit }
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (action === 'markInvited') {
      const idsParam = url.searchParams.get('ids')
      if (!idsParam) {
        return new Response(JSON.stringify({ error: 'Missing ids param' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      const ids = idsParam.split(',').map((id) => id.trim()).filter(Boolean)
      if (ids.length === 0) {
        return new Response(JSON.stringify({ error: 'No valid ids provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const updated = await config.adapter.markInvited(ids)
      const body: AdminMarkInvitedResponse = { updated }
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (action === 'exportCsv') {
      const allSignups = await config.adapter.getAll({ limit: 100000, offset: 0 })
      const csv = [
        'id,email,position,referralCount,invited,createdAt',
        ...allSignups.map((s) =>
          [
            s.id,
            `"${s.email.replace(/"/g, '""')}"`,
            s.position,
            s.referralCount,
            s.invitedAt ? 'true' : 'false',
            s.createdAt,
          ].join(',')
        ),
      ].join('\n')

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="waitlist.csv"',
        },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const e = err as Error
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
