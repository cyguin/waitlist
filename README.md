# @cyguin/waitlist

Drop-in email waitlist with position tracking and optional referral loop for Next.js apps.

## Install

```bash
npm install @cyguin/waitlist
```

## Quick start

### 1. Configure the adapter

```ts
// lib/waitlist.ts
import { createSQLiteAdapter } from '@cyguin/waitlist/adapters/sqlite';

export const waitlistAdapter = createSQLiteAdapter();
```

### 2. Add the API route

```ts
// app/api/waitlist/[...cyguin]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createWaitlistHandler } from '@cyguin/waitlist/next';
import { waitlistAdapter } from '@/lib/waitlist';

const handler = createWaitlistHandler({ adapter: waitlistAdapter });

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
```

### 3. Drop in the component

```tsx
// app/page.tsx
import { WaitlistForm } from '@cyguin/waitlist';

export default function Home() {
  return (
    <main>
      <h1>Join the waitlist</h1>
      <WaitlistForm
        placeholder="Enter your email"
        buttonText="Join waitlist"
      />
    </main>
  );
}
```

## API

### POST `/api/waitlist`

Join the waitlist.

**Request:**
```json
{
  "email": "user@example.com",
  "referred_by": "TOKEN"  // optional
}
```

**Response `201`:**
```json
{
  "id": "abc123",
  "email": "user@example.com",
  "position": 42,
  "referral_token": "abc123"
}
```

**Response `409`** — email already registered:
```json
{ "error": "already_registered" }
```

### GET `/api/waitlist?email=xxx`

Get your position on the waitlist.

**Response `200`:**
```json
{
  "id": "abc123",
  "email": "user@example.com",
  "position": 42,
  "referral_token": "abc123",
  "joined_at": 1712000000000
}
```

**Response `404`** — not found:
```json
{ "error": "not_found" }
```

## Referral system

When a user joins via `?ref=TOKEN`, their entry records who referred them. Position is never adjusted based on referral count — referrals are informational only.

1. On `POST`, a `referral_token` (the entry's `id`) is returned.
2. Share links like `https://yoursite.com/?ref=TOKEN`.
3. New joins with `?ref=TOKEN` store the referrer's id.

## `<WaitlistForm />` Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `className` | `string` | `''` | CSS class for the form container |
| `placeholder` | `string` | `'Enter your email'` | Input placeholder text |
| `buttonText` | `string` | `'Join waitlist'` | Button label |
| `redirectTo` | `string` | — | If provided, redirects here after success with `?ref=TOKEN` |
| `onSuccess` | `(data: JoinResponse) => void` | — | Callback on successful join |
| `onError` | `(error: string) => void` | — | Callback on error |

## Theming

All styling uses `--cyguin-*` CSS custom properties. Default tokens:

```css
--cyguin-bg: #ffffff
--cyguin-bg-subtle: #f5f5f5
--cyguin-border: #e5e5e5
--cyguin-border-focus: #f5a800
--cyguin-fg: #0a0a0a
--cyguin-fg-muted: #888888
--cyguin-accent: #f5a800
--cyguin-accent-dark: #c47f00
--cyguin-accent-fg: #0a0a0a
--cyguin-radius: 6px
--cyguin-shadow: 0 1px 4px rgba(0,0,0,0.08)
```

Apply a dark theme by setting `data-theme="dark"` on the root element:

```tsx
<div data-theme="dark">
  <WaitlistForm />
</div>
```

## Exports

| Export | Description |
|---|---|
| `@cyguin/waitlist` | Main package entry — types, adapters, handler |
| `@cyguin/waitlist/next` | Next.js route handler for API route |
| `@cyguin/waitlist/react` | `WaitlistForm` component |
| `@cyguin/waitlist/adapters/sqlite` | SQLite adapter (better-sqlite3) |
| `@cyguin/waitlist/adapters/postgres` | Postgres adapter (postgres.js) |