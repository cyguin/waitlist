import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import { nanoid } from 'nanoid'
import { WaitlistAdapter, Signup } from './interface'

interface WaitlistRow {
  id: string
  email: string
  referral_code: string | null
  own_code: string
  position: number
  referral_count: number
  invited_at: string | null
  created_at: string
}

export class SQLiteAdapter implements WaitlistAdapter {
  private db: DatabaseType
  private tableName: string

  constructor(db: DatabaseType, tableName: string = 'waitlist_signups') {
    this.db = db
    this.tableName = tableName
  }

  async migrate(): Promise<void> {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        referral_code TEXT,
        own_code TEXT UNIQUE NOT NULL,
        invited_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
    
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_waitlist_created ON ${this.tableName} (created_at)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_waitlist_own_code ON ${this.tableName} (own_code)`)
    
    this.db.exec(`PRAGMA journal_mode=WAL`)
  }

  private calculatePosition(email: string): number {
    const result = this.db.prepare(`
      SELECT COUNT(*) as position
      FROM ${this.tableName}
    `).get() as { position: number }
    return result.position
  }

  private rowToSignup(row: WaitlistRow): Signup {
    return {
      id: row.id,
      email: row.email,
      referralCode: row.referral_code,
      ownCode: row.own_code,
      position: this.calculatePosition(row.email),
      referralCount: this.calculateReferralCount(row.own_code),
      invitedAt: row.invited_at,
      createdAt: row.created_at
    }
  }

  private calculateReferralCount(ownCode: string): number {
    const result = this.db.prepare(`
      SELECT COUNT(*) as count FROM ${this.tableName}
      WHERE referral_code = ?
    `).get(ownCode) as { count: number }
    return result.count
  }

  async insertSignup(email: string, referralCode?: string): Promise<Signup> {
    const existing = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE email = ?`).get(email) as WaitlistRow | undefined
    
    if (existing) {
      return this.rowToSignup(existing)
    }

    const id = nanoid()
    const ownCode = nanoid(8)

    this.db.prepare(`
      INSERT INTO ${this.tableName} (id, email, referral_code, own_code)
      VALUES (?, ?, ?, ?)
    `).run(id, email, referralCode || null, ownCode)

    const inserted = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`).get(id) as WaitlistRow
    return this.rowToSignup(inserted)
  }

  async getCount(): Promise<number> {
    const result = this.db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`).get() as { count: number }
    return result.count
  }

  async getAll(options?: { limit?: number; offset?: number }): Promise<Signup[]> {
    const limit = options?.limit ?? 100
    const offset = options?.offset ?? 0
    const rows = this.db.prepare(`SELECT * FROM ${this.tableName} ORDER BY created_at ASC LIMIT ? OFFSET ?`).all(limit, offset) as WaitlistRow[]
    return rows.map(row => this.rowToSignup(row))
  }

  async markInvited(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0
    const placeholders = ids.map(() => '?').join(',')
    const result = this.db.prepare(`UPDATE ${this.tableName} SET invited_at = datetime('now') WHERE id IN (${placeholders})`).run(...ids)
    return result.changes
  }
}
