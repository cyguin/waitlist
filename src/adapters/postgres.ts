import postgres from 'postgres'
import { WaitlistAdapter, Signup } from './interface'

type PostgresDb = ReturnType<typeof postgres>

interface WaitlistRow {
  id: string
  email: string
  referral_code: string | null
  own_code: string
  position: number
  referral_count: number
  invited_at: Date | null
  created_at: Date
}

export class PostgresAdapter implements WaitlistAdapter {
  private sql: PostgresDb
  private tableName: string

  constructor(sql: PostgresDb, tableName: string = 'waitlist_signups') {
    this.sql = sql
    this.tableName = tableName
  }

  async migrate(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS ${this.sql(this.tableName)} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        referral_code TEXT,
        own_code TEXT UNIQUE NOT NULL,
        invited_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    
    await this.sql`CREATE INDEX IF NOT EXISTS idx_waitlist_created ON ${this.sql(this.tableName)} (created_at)`
    await this.sql`CREATE INDEX IF NOT EXISTS idx_waitlist_own_code ON ${this.sql(this.tableName)} (own_code)`
  }

  private async calculateReferralCount(ownCode: string): Promise<number> {
    const [{ count }] = await this.sql<[{ count: bigint }]>`SELECT COUNT(*) as count FROM ${this.sql(this.tableName)} WHERE referral_code = ${ownCode}`
    return Number(count)
  }

  private rowToSignup(row: WaitlistRow): Signup {
    return {
      id: row.id,
      email: row.email,
      referralCode: row.referral_code,
      ownCode: row.own_code,
      position: row.position,
      referralCount: row.referral_count,
      invitedAt: row.invited_at?.toISOString() || null,
      createdAt: row.created_at.toISOString()
    }
  }

  async insertSignup(email: string, referralCode?: string): Promise<Signup> {
    const [existing] = await this.sql<WaitlistRow[]>`SELECT * FROM ${this.sql(this.tableName)} WHERE email = ${email}`
    
    if (existing) {
      const referralCount = await this.calculateReferralCount(existing.own_code)
      return this.rowToSignup({
        ...existing,
        position: 1,
        referral_count: referralCount
      })
    }

    const { nanoid } = await import('nanoid')
    const id = nanoid()
    const ownCode = nanoid(8)

    const [result] = await this.sql<WaitlistRow[]>`
      INSERT INTO ${this.sql(this.tableName)} (id, email, referral_code, own_code)
      VALUES (${id}, ${email}, ${referralCode || null}, ${ownCode})
      RETURNING *
    `

    if (!result) {
      throw new Error('Failed to insert signup')
    }

    return this.rowToSignup({
      ...result,
      position: 1,
      referral_count: 0
    })
  }

  async getCount(): Promise<number> {
    const [{ count }] = await this.sql<[{ count: bigint }]>`SELECT COUNT(*) as count FROM ${this.sql(this.tableName)}`
    return Number(count)
  }

  async getAll(options?: { limit?: number; offset?: number }): Promise<Signup[]> {
    const limit = options?.limit ?? 1000
    const offset = options?.offset ?? 0

    const rows = await this.sql<WaitlistRow[]>`
      SELECT
        w.id, w.email, w.referral_code, w.own_code, w.invited_at, w.created_at,
        ROW_NUMBER() OVER (ORDER BY w.created_at ASC) AS position,
        (SELECT COUNT(*) FROM ${this.sql(this.tableName)} r WHERE r.referral_code = w.own_code) AS referral_count
      FROM ${this.sql(this.tableName)} w
      ORDER BY w.created_at ASC
      LIMIT ${limit} OFFSET ${offset}
    `

    return rows.map(row => this.rowToSignup(row))
  }

  async markInvited(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0
    
    const result = await this.sql`
      UPDATE ${this.sql(this.tableName)} 
      SET invited_at = NOW() 
      WHERE id = ANY(${ids}) AND invited_at IS NULL
    `
    
    return (result as { count: number }).count ?? ids.length
  }
}
