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

### Quick Start

```bash
npm install @cyguin/waitlist better-sqlite3
```

### 1. Init the Waitlist

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

### 2. Mount API Routes

```ts
// app/api/join/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdapter } from '@/lib/db'

export async function POST(request: NextRequest) {
  const adapter = await getAdapter()
  await adapter.migrate()
  
  const { email, referralCode } = await request.json()
  
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 422 })
  }
  
  const signup = await adapter.insertSignup(email, referralCode)
  return NextResponse.json({
    id: signup.id,
    email: signup.email,
    ownCode: signup.ownCode,
    position: signup.position,
  }, { status: 201 })
}
```

```ts
// app/api/count/route.ts
import { NextResponse } from 'next/server'
import { getAdapter } from '@/lib/db'

export async function GET() {
  const adapter = await getAdapter()
  await adapter.migrate()
  const count = await adapter.getCount()
  return NextResponse.json({ count })
}
```

### 3. Add React Components

```tsx
// app/page.tsx
'use client'
import { WaitlistForm } from '@cyguin/waitlist/react'
import { SocialProof } from '@cyguin/waitlist/react'

export default function Home() {
  return (
    <div>
      <WaitlistForm
        action="/api/join"
        countEndpoint="/api/count"
        showReferral  // show referral link after signup
      />
      
      <SocialProof endpoint="/api/count" />
    </div>
  )
}
```

### 4. Admin Panel (Optional)

Set an admin secret in your environment:

```bash
# .env.local
ADMIN_SECRET=your-secret-here
```

```ts
// app/api/admin/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdapter } from '@/lib/db'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'dev-secret'

function requireAuth(auth: string | null): boolean {
  if (!auth) return false
  const [scheme, token] = auth.split(' ')
  return scheme?.toLowerCase() === 'bearer' && token === ADMIN_SECRET
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!requireAuth(auth)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const adapter = await getAdapter()
  const url = new URL(request.url)
  const limit = Number(url.searchParams.get('limit')) || 50
  const page = Number(url.searchParams.get('page')) || 1
  
  const [signups, total] = await Promise.all([
    adapter.getAll({ limit, offset: (page - 1) * limit }),
    adapter.getCount()
  ])
  
  return NextResponse.json({ signups, total, page, limit })
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!requireAuth(auth)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const adapter = await getAdapter()
  const url = new URL(request.url)
  const ids = url.searchParams.get('ids')?.split(',') || []
  
  const updated = await adapter.markInvited(ids)
  return NextResponse.json({ updated })
}
```

```tsx
// app/admin/page.tsx
'use client'
import { WaitlistAdmin } from '@cyguin/waitlist/react'

export default function Admin() {
  return (
    <WaitlistAdmin
      endpoint="/api/admin"
      adminSecret={process.env.ADMIN_SECRET || 'dev-secret'}
    />
  )
}
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
| `list()` | `Promise<Signup[]>` | All signups (paginated via `getAll({ limit, offset })`) |
| `invite(ids)` | `Promise<void>` | Mark signups as invited |

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

### Signup Object

```ts
{
  id: string,
  email: string,
  referralCode: string | null,  // code used when they joined
  ownCode: string,              // their unique referral code
  position: number,             // queue position
  referralCount: number,        // how many people they referred
  invitedAt: string | null,     // ISO timestamp when invited
  createdAt: string             // ISO timestamp when joined
}
```

---

## exports

### Core

```ts
import { createWaitlist, SQLiteAdapter, PostgresAdapter } from '@cyguin/waitlist'
```

### React Components

```ts
import { WaitlistForm, SocialProof, WaitlistAdmin, useWaitlistCount } from '@cyguin/waitlist/react'
```

### Hooks

- `useWaitlistCount(endpoint, pollInterval?)` — polls for waitlist count

---

## requirements

- Next.js 14+ (App Router)
- Node 18+
- React 18+
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
