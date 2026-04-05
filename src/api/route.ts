import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import type { JoinResponse } from '../types.js';

interface CreateWaitlistEntryInput {
  email: string;
  referred_by?: string;
}

export function createWaitlistHandler(adapter: {
  create(entry: { id: string; email: string; referred_by?: string; joined_at: number }): Promise<void>;
  findByEmail(email: string): Promise<{ id: string; email: string; referred_by?: string; joined_at: number } | null>;
  getPosition(email: string): Promise<number>;
}) {
  return async function handler(req: NextRequest) {
    const url = req.nextUrl.clone();
    const segments = url.pathname.split('/').filter(Boolean);
    const waitlistIndex = segments.indexOf('waitlist');

    if (waitlistIndex === -1) {
      return NextResponse.json({ error: 'Invalid route' }, { status: 400 });
    }

    try {
      if (req.method === 'POST') {
        const body = await req.json() as CreateWaitlistEntryInput;

        if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
          return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        const existing = await adapter.findByEmail(body.email);
        if (existing) {
          return NextResponse.json({ error: 'already_registered' }, { status: 409 });
        }

        const now = Date.now();
        const entry = {
          id: nanoid(),
          email: body.email.toLowerCase().trim(),
          referred_by: body.referred_by ?? undefined,
          joined_at: now,
        };

        await adapter.create(entry);

        const position = await adapter.getPosition(entry.email);

        const response: JoinResponse = {
          id: entry.id,
          email: entry.email,
          position,
          referral_token: entry.id,
        };

        return NextResponse.json(response, { status: 201 });
      }

      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}