import Database from "better-sqlite3";
import { nanoid } from "nanoid";
import type { WaitlistAdapter, WaitlistEntry } from "../types.js";

function applySchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS waitlist_entries (
      id          TEXT PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      referred_by TEXT,
      joined_at   INTEGER NOT NULL,
      burned_at   INTEGER
    );
  `);
  db.pragma("journal_mode = WAL");
}

export function createSQLiteAdapter(dbPath?: string): WaitlistAdapter {
  const db = new Database(dbPath ?? ":memory:");
  applySchema(db);

  return {
    async create(entry) {
      const stmt = db.prepare(`
        INSERT INTO waitlist_entries (id, email, referred_by, joined_at)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(entry.id, entry.email, entry.referred_by ?? null, entry.joined_at);
    },

    async findByEmail(email) {
      const stmt = db.prepare("SELECT * FROM waitlist_entries WHERE email = ?");
      const row = stmt.get(email) as WaitlistEntry | undefined;
      return row ?? null;
    },

    async findById(id) {
      const stmt = db.prepare("SELECT * FROM waitlist_entries WHERE id = ?");
      const row = stmt.get(id) as WaitlistEntry | undefined;
      return row ?? null;
    },

    async getPosition(email) {
      const stmt = db.prepare(`
        SELECT COUNT(*) + 1 AS position
        FROM waitlist_entries
        WHERE joined_at < (
          SELECT joined_at FROM waitlist_entries WHERE email = ?
        )
        AND burned_at IS NULL
      `);
      const row = stmt.get(email) as { position: number } | undefined;
      return row?.position ?? 1;
    },

    async list({ limit = 100, offset = 0 } = {}) {
      const stmt = db.prepare(`
        SELECT * FROM waitlist_entries
        WHERE burned_at IS NULL
        ORDER BY joined_at ASC
        LIMIT ? OFFSET ?
      `);
      return stmt.all(limit, offset) as WaitlistEntry[];
    },
  };
}
