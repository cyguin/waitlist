# @cyguin/waitlist

Email waitlist with position tracking and an optional referral loop. Drop into any Next.js app.

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
  "referred_by": "TOKEN"
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

Get your position.

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

**Response `404`:**
```json
{ "error": "not_found" }
```

## Referral system

When someone joins via `?ref=TOKEN`, their entry records the referrer. Position is informational only — referrals don't move anyone up.

1. `POST` returns a `referral_token` (the entry's `id`).
2. Share links like `https://yoursite.com/?ref=TOKEN`.
3. New joins with `?ref=TOKEN` store the referrer's id.

## `<WaitlistForm />` Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `className` | `string` | `''` | CSS class for the form container |
| `placeholder` | `string` | `'Enter your email'` | Input placeholder text |
| `buttonText` | `string` | `'Join waitlist'` | Button label |
| `redirectTo` | `string` | — | Redirect here after success with `?ref=TOKEN` |
| `theme` | `'light' \| 'dark'` | `'dark'` | Dark by default. Pass `'light'` to switch |
| `onSuccess` | `(data: JoinResponse) => void` | — | Callback on successful join |
| `onError` | `(error: string) => void` | — | Callback on error |

## Theming

Default is dark. Set `--cyguin-*` variables wherever you need:

```css
--cyguin-bg: #0a0d17
--cyguin-bg-subtle: #101521
--cyguin-border: #252b3a
--cyguin-border-focus: #f5a800
--cyguin-fg: #f1f3f6
--cyguin-fg-muted: #888888
--cyguin-accent: #f5a800
--cyguin-accent-dark: #c47f00
--cyguin-accent-fg: #0a0a0a
--cyguin-radius: 6px
--cyguin-shadow: 0 1px 4px rgba(0,0,0,0.08)
```

Use `theme="light"` to flip to light mode:

```tsx
<WaitlistForm theme="light" />
```

## Exports

| Export | Description |
|---|---|
| `@cyguin/waitlist` | Main package entry — types, adapters, handler |
| `@cyguin/waitlist/next` | Next.js route handler |
| `@cyguin/waitlist/react` | `WaitlistForm` component |
| `@cyguin/waitlist/adapters/sqlite` | SQLite adapter |
| `@cyguin/waitlist/adapters/postgres` | Postgres adapter |
