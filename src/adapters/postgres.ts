import postgres from 'postgres'
import { WaitlistAdapter, Signup } from './interface'

type PostgresDb = ReturnType<typeof postgres>

interface WaitlistRow {
  id: string
  email: string
  referral_code: string | null
  own_code: string
  position: number
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

  private async calculatePosition(): Promise<number> {
    const [{ count }] = await this.sql<[{ count: bigint }]>`SELECT COUNT(*) as count FROM ${this.sql(this.tableName)}`
    return Number(count) + 1
  }

  private rowToSignup(row: WaitlistRow, position: number): Signup {
    return {
      id: row.id,
      email: row.email,
      referralCode: row.referral_code,
      ownCode: row.own_code,
      position,
      invitedAt: row.invited_at?.toISOString() || null,
      createdAt: row.created_at.toISOString()
    }
  }

  async insertSignup(email: string, referralCode?: string): Promise<Signup> {
    const [existing] = await this.sql<WaitlistRow[]>`SELECT * FROM ${this.sql(this.tableName)} WHERE email = ${email}`
    
    if (existing) {
      const position = await this.calculatePosition()
      return this.rowToSignup(existing, position)
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

    const position = await this.calculatePosition()
    return this.rowToSignup(result, position)
  }

  async getCount(): Promise<number> {
    const [{ count }] = await this.sql<[{ count: bigint }]>`SELECT COUNT(*) as count FROM ${this.sql(this.tableName)}`
    return Number(count)
  }

  async getAll(): Promise<Signup[]> {
    const rows = await this.sql<WaitlistRow[]>`SELECT * FROM ${this.sql(this.tableName)} ORDER BY created_at ASC`
    return Promise.all(rows.map(async (row: WaitlistRow) => {
      const position = await this.calculatePosition()
      return this.rowToSignup(row, position)
    }))
  }

  async markInvited(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    await this.sql`UPDATE ${this.sql(this.tableName)} SET invited_at = NOW() WHERE id IN (${this.sql(ids)})`
  }
}
