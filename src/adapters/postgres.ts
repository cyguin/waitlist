import postgres from "postgres";
import type { WaitlistAdapter, WaitlistEntry } from "../types.js";

export function createPostgresAdapter(dbPath?: string): WaitlistAdapter {
  const db = postgres(dbPath ?? process.env.DATABASE_URL!);

  return {
    async create(entry) {
      await db`
        INSERT INTO waitlist_entries (id, email, referred_by, joined_at)
        VALUES (${entry.id}, ${entry.email}, ${entry.referred_by ?? null}, ${entry.joined_at})
      `;
    },

    async findByEmail(email) {
      const [row] = await db<WaitlistEntry[]>`
        SELECT * FROM waitlist_entries WHERE email = ${email}
      `;
      return row ?? null;
    },

    async findById(id) {
      const [row] = await db<WaitlistEntry[]>`
        SELECT * FROM waitlist_entries WHERE id = ${id}
      `;
      return row ?? null;
    },

    async getPosition(email) {
      const [row] = await db<{ position: number }[]>`
        SELECT COUNT(*) + 1 AS position
        FROM waitlist_entries
        WHERE joined_at < (
          SELECT joined_at FROM waitlist_entries WHERE email = ${email}
        )
        AND burned_at IS NULL
      `;
      return row?.position ?? 1;
    },

    async list({ limit = 100, offset = 0 } = {}) {
      return db<WaitlistEntry[]>`
        SELECT * FROM waitlist_entries
        WHERE burned_at IS NULL
        ORDER BY joined_at ASC
        LIMIT ${limit} OFFSET ${offset}
      `;
    },
  };
}
