# @cyguin/waitlist

> drop-in pre-launch waitlist for Next.js. your DB, your list, no middleman.

self-hosted waitlist with referral tracking. ships as an npm package that mounts into your existing app in about ten minutes.

---

## the deal

> Most waitlist tools want to own your email list. The ones that don't still require
> a separate service, a subdomain, and a monthly bill before you've validated anything.
> This one drops into your Next.js API routes and writes to SQLite or Postgres —
> whatever you already have. Pull it, mount it, ship it.

---

## install

```bash
npm install @cyguin/waitlist
```

if you're using the SQLite adapter:

```bash
npm install better-sqlite3
```

---

## usage

**1. init the waitlist**

```ts
// lib/waitlist.ts
import { createWaitlist } from '@cyguin/waitlist'
import Database from 'better-sqlite3'

const db = new Database('waitlist.db')
export const waitlist = createWaitlist({
  adapter: 'sqlite',
  db,
})
```

**2. mount the API routes**

```ts
// app/api/waitlist/join/route.ts
import { NextResponse } from 'next/server'
import { waitlist } from '@/lib/waitlist'

export async function POST(request: Request) {
  const { email, ref } = await request.json()
  const result = await waitlist.join(email, ref)
  
  return NextResponse.json(result.data, { status: result.status })
}
```

```ts
// app/api/waitlist/count/route.ts
import { NextResponse } from 'next/server'
import { waitlist } from '@/lib/waitlist'

export async function GET() {
  const result = await waitlist.count()
  return NextResponse.json(result.data)
}
```

**3. use the core API directly**

```ts
import { waitlist } from '@/lib/waitlist'

// Run migrations first
await waitlist.migrate()

// Join the waitlist
const result = await waitlist.join('user@example.com', 'REFCODE')

// Get count
const count = await waitlist.count()
```

---

## api

### `createWaitlist(options)`

Creates a waitlist instance with your database.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `adapter` | `'sqlite' \| 'postgres'` | Yes | Database adapter |
| `db` | `Database \| Sql` | Yes | Your database connection |
| `tableName` | `string` | No | Custom table name (default: `waitlist_signups`) |
| `rateLimit` | `boolean` | No | Rate limiting (stub, no-op) |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `migrate()` | `Promise<void>` | Run database migrations |
| `join(email, ref?)` | `Promise<JoinResponse>` | Add signup, returns `{ id, email, ownCode, position, alreadyExists }` |
| `count()` | `Promise<number>` | Total signup count |
| `list()` | `Promise<Signup[]>` | All signups |
| `invite(ids)` | `Promise<void>` | Mark as invited |

### Join Response

```ts
{
  id: string,
  email: string,
  ownCode: string,      // shareable referral code
  position: number,     // queue position
  alreadyExists: boolean // true if email was duplicate
}
```

---

## requirements

- Next.js 14+ (App Router)
- Node 18+
- `better-sqlite3` if using the SQLite adapter
- `postgres` if using the Postgres adapter

---

## adapters

**sqlite** — recommended for single-server and local dev. runs WAL mode by default. migrations run automatically on first use. no setup beyond a writable path.

**postgres** — for multi-instance or cloud deployments. requires an existing Postgres connection. `CREATE TABLE IF NOT EXISTS` runs on first boot.

schema ships as plain SQL if you'd rather run migrations yourself: [`migrations/`](./migrations/)

---

## development

```bash
npm install
npm test          # vitest
npm run build     # tsup
```

---

## status

`v0.x` — working but not stable. breaking changes land without ceremony. pin your version.

---

## license

MIT. see [LICENSE](./LICENSE).
