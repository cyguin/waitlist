import { SQLiteAdapter } from '../adapters/sqlite'
import { adminHandler } from './admin'
import Database from 'better-sqlite3'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('adminHandler', () => {
  let adapter: SQLiteAdapter
  let db: any
  const adminSecret = 'test-secret-123'
  let baseUrl: string

  beforeEach(async () => {
    db = new Database(':memory:')
    adapter = new SQLiteAdapter(db, 'waitlist')
    await adapter.migrate()
    baseUrl = 'http://localhost/admin'
  })

  afterEach(() => {
    db.close()
  })

  const makeRequest = (path: string, options?: RequestInit) => {
    return adminHandler(
      { adapter, adminSecret },
      new Request(`http://localhost${path}`, options)
    )
  }

  const withAuth = (options?: RequestInit) => ({
    ...options,
    headers: { ...options?.headers, Authorization: `Bearer ${adminSecret}` },
  })

  describe('auth', () => {
    it('returns 401 when no auth header', async () => {
      const res = await makeRequest('/admin?action=list')
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe('Unauthorized')
    })

    it('returns 401 when wrong secret', async () => {
      const res = await adminHandler(
        { adapter, adminSecret },
        new Request('http://localhost/admin', {
          headers: { Authorization: 'Bearer wrong-secret' },
        })
      )
      expect(res.status).toBe(401)
    })

    it('returns 401 when wrong auth scheme', async () => {
      const res = await adminHandler(
        { adapter, adminSecret },
        new Request('http://localhost/admin', {
          headers: { Authorization: `Basic ${adminSecret}` },
        })
      )
      expect(res.status).toBe(401)
    })
  })

  describe('action=list', () => {
    beforeEach(async () => {
      await adapter.insertSignup('alice@example.com')
      await adapter.insertSignup('bob@example.com')
    })

    it('returns paginated signups', async () => {
      const res = await makeRequest('/admin?action=list', withAuth())
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.signups).toHaveLength(2)
      expect(body.total).toBe(2)
      expect(body.page).toBe(1)
      expect(body.limit).toBe(50)
    })

    it('respects limit param', async () => {
      const res = await makeRequest('/admin?action=list&limit=1', withAuth())
      const body = await res.json()
      expect(body.signups).toHaveLength(1)
      expect(body.total).toBe(2)
    })

    it('respects page param', async () => {
      await adapter.insertSignup('charlie@example.com')
      const res = await makeRequest('/admin?action=list&page=2&limit=2', withAuth())
      const body = await res.json()
      expect(body.signups).toHaveLength(1)
      expect(body.page).toBe(2)
    })

    it('caps limit at 100', async () => {
      const res = await makeRequest('/admin?action=list&limit=999', withAuth())
      const body = await res.json()
      expect(body.limit).toBe(100)
    })

    it('includes referralCount', async () => {
      await adapter.insertSignup('charlie@example.com', 'nonexistent')
      const res = await makeRequest('/admin?action=list', withAuth())
      const body = await res.json()
      expect(body.signups[0]).toHaveProperty('referralCount')
    })
  })

  describe('action=markInvited', () => {
    beforeEach(async () => {
      await adapter.insertSignup('alice@example.com')
      await adapter.insertSignup('bob@example.com')
    })

    it('marks signups as invited', async () => {
      const listRes = await makeRequest('/admin?action=list', withAuth())
      const { signups } = await listRes.json()
      const id = signups[0].id

      const res = await makeRequest(`/admin?action=markInvited&ids=${id}`, withAuth({ method: 'POST' }))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.updated).toBe(1)

      const checkRes = await makeRequest('/admin?action=list', withAuth())
      const { signups: updated } = await checkRes.json()
      expect(updated[0].invitedAt).toBeTruthy()
    })

    it('marks multiple signups', async () => {
      const listRes = await makeRequest('/admin?action=list', withAuth())
      const { signups } = await listRes.json()
      const ids = signups.map((s: any) => s.id).join(',')

      const res = await makeRequest(`/admin?action=markInvited&ids=${ids}`, withAuth({ method: 'POST' }))
      const body = await res.json()
      expect(body.updated).toBe(2)
    })

    it('returns 400 when ids param missing', async () => {
      const res = await makeRequest('/admin?action=markInvited', withAuth({ method: 'POST' }))
      expect(res.status).toBe(400)
    })

    it('returns 400 when ids empty', async () => {
      const res = await makeRequest('/admin?action=markInvited&ids=', withAuth({ method: 'POST' }))
      expect(res.status).toBe(400)
    })
  })

  describe('action=exportCsv', () => {
    beforeEach(async () => {
      await adapter.insertSignup('alice@example.com')
    })

    it('returns CSV with correct headers', async () => {
      const res = await makeRequest('/admin?action=exportCsv', withAuth())
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('text/csv')
      expect(res.headers.get('Content-Disposition')).toContain('waitlist.csv')
      const csv = await res.text()
      expect(csv).toContain('id,email,position,referralCount,invited,createdAt')
      expect(csv).toContain('alice@example.com')
    })

    it('escapes email with quotes in CSV', async () => {
      await adapter.insertSignup('test"special@example.com')
      const res = await makeRequest('/admin?action=exportCsv', withAuth())
      const csv = await res.text()
      expect(csv).toContain('"test""special@example.com"')
    })
  })

  describe('unknown action', () => {
    it('returns 400', async () => {
      const res = await makeRequest('/admin?action=unknown', withAuth())
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('Unknown action')
    })
  })
})
