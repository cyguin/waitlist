import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'waitlist.db')

export const db = new Database(dbPath)

export async function getAdapter() {
  const { SQLiteAdapter } = await import('@cyguin/waitlist')
  return new SQLiteAdapter(db, 'waitlist')
}