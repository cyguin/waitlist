import { nanoid } from 'nanoid'
import { createSQLiteAdapter } from './adapters/sqlite'
import { createPostgresAdapter } from './adapters/postgres'
import type { WaitlistAdapter } from './types'
import type { Signup, JoinResponse } from './adapters/interface'

export type { Signup, JoinResponse } from './adapters/interface'

export interface WaitlistConfig {
  adapter: 'sqlite' | 'postgres'
  dbPath?: string
}

export function createWaitlist(config: WaitlistConfig) {
  const adapter: WaitlistAdapter = config.adapter === 'sqlite'
    ? createSQLiteAdapter(config.dbPath)
    : createPostgresAdapter(config.dbPath)

  return {
    async migrate(): Promise<void> {},
    async join(email: string, referralCode?: string): Promise<JoinResponse> {
      const existing = await adapter.findByEmail(email)
      if (existing) {
        const position = await adapter.getPosition(email)
        return { id: existing.id, email: existing.email, ownCode: existing.id, position, alreadyExists: true }
      }
      const id = nanoid()
      await adapter.create({ id, email, referred_by: referralCode ?? undefined, joined_at: Date.now() })
      const position = await adapter.getPosition(email)
      return { id, email, ownCode: id, position, alreadyExists: false }
    },
    async count(): Promise<number> {
      return (await adapter.list()).length
    },
    async list(options?: { limit?: number; offset?: number }): Promise<Signup[]> {
      const entries = await adapter.list(options)
      return entries.map(e => ({
        id: e.id,
        email: e.email,
        referralCode: e.referred_by ?? null,
        ownCode: e.id,
        position: 0,
        referralCount: 0,
        invitedAt: null,
        createdAt: new Date().toISOString(),
      }))
    },
    async invite(_ids: string[]): Promise<number> {
      return 0
    },
  }
}
