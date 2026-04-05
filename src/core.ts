import { SQLiteAdapter } from './adapters/sqlite'
import { PostgresAdapter } from './adapters/postgres'
import { WaitlistAdapter, Signup, JoinResponse } from './adapters/interface'

export { Signup, JoinResponse } from './adapters/interface'

export interface WaitlistConfig {
  adapter: 'sqlite' | 'postgres'
  db: any
  tableName?: string
  rateLimit?: boolean
}

export function createWaitlist(config: WaitlistConfig) {
  let adapter: WaitlistAdapter

  switch (config.adapter) {
    case 'sqlite':
      adapter = new SQLiteAdapter(config.db, config.tableName)
      break
    case 'postgres':
      adapter = new PostgresAdapter(config.db, config.tableName)
      break
    default:
      throw new Error(`Unknown adapter: ${config.adapter}`)
  }

  return {
    async migrate(): Promise<void> {
      return adapter.migrate()
    },

    async join(email: string, referralCode?: string): Promise<JoinResponse> {
      const existingBefore = await adapter.getCount()
      const signup = await adapter.insertSignup(email, referralCode)
      const existingAfter = await adapter.getCount()
      const alreadyExists = existingAfter === existingBefore

      return {
        id: signup.id,
        email: signup.email,
        ownCode: signup.ownCode,
        position: signup.position,
        alreadyExists
      }
    },

    async count(): Promise<number> {
      return adapter.getCount()
    },

    async list(): Promise<Signup[]> {
      return adapter.getAll()
    },

    async invite(ids: string[]): Promise<void> {
      await adapter.markInvited(ids)
    }
  }
}
