import { SQLiteAdapter } from './sqlite'
import Database from 'better-sqlite3'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('SQLiteAdapter', () => {
  let adapter: SQLiteAdapter
  let db: Database

  beforeEach(() => {
    db = new Database(':memory:')
    adapter = new SQLiteAdapter(db, 'test_waitlist')
  })

  afterEach(() => {
    db.close()
  })

  describe('migrate()', () => {
    it('creates table', async () => {
      await adapter.migrate()
      
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='test_waitlist'").get()
      expect(tables).toBeDefined()
    })

    it('creates indexes', async () => {
      await adapter.migrate()
      
      const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='test_waitlist'").all()
      expect(indexes.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('insertSignup()', () => {
    beforeEach(async () => {
      await adapter.migrate()
    })

    it('inserts new signup with position 1', async () => {
      const result = await adapter.insertSignup('test@example.com')
      
      expect(result.email).toBe('test@example.com')
      expect(result.id).toBeDefined()
      expect(result.ownCode).toBeDefined()
      expect(result.ownCode.length).toBe(8)
      expect(result.position).toBe(1)
      expect(result.referralCode).toBeNull()
    })

    it('returns existing record on duplicate email', async () => {
      const first = await adapter.insertSignup('test@example.com')
      const second = await adapter.insertSignup('test@example.com')
      
      expect(first.id).toBe(second.id)
      expect(first.email).toBe(second.email)
      expect(first.ownCode).toBe(second.ownCode)
    })

    it('handles referral code', async () => {
      const referrer = await adapter.insertSignup('referrer@example.com')
      const referred = await adapter.insertSignup('referred@example.com', referrer.ownCode)
      
      expect(referred.referralCode).toBe(referrer.ownCode)
    })

    it('increments position for subsequent signups', async () => {
      await adapter.insertSignup('first@example.com')
      const second = await adapter.insertSignup('second@example.com')
      
      expect(second.position).toBe(2)
    })
  })

  describe('getCount()', () => {
    beforeEach(async () => {
      await adapter.migrate()
    })

    it('returns 0 for empty table', async () => {
      const count = await adapter.getCount()
      expect(count).toBe(0)
    })

    it('returns correct count after insertions', async () => {
      await adapter.insertSignup('test1@example.com')
      await adapter.insertSignup('test2@example.com')
      
      const count = await adapter.getCount()
      expect(count).toBe(2)
    })

    it('does not increment on duplicate', async () => {
      await adapter.insertSignup('test@example.com')
      await adapter.insertSignup('test@example.com')
      
      const count = await adapter.getCount()
      expect(count).toBe(1)
    })
  })

  describe('markInvited()', () => {
    beforeEach(async () => {
      await adapter.migrate()
    })

    it('marks specified IDs as invited', async () => {
      const signup1 = await adapter.insertSignup('test1@example.com')
      await adapter.insertSignup('test2@example.com')
      
      await adapter.markInvited([signup1.id])
      
      const all = await adapter.getAll()
      const invited = all.find(s => s.id === signup1.id)
      const notInvited = all.find(s => s.email === 'test2@example.com')
      
      expect(invited?.invitedAt).not.toBeNull()
      expect(notInvited?.invitedAt).toBeNull()
    })
  })
})
