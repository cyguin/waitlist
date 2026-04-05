import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createSQLiteAdapter } from "../../../../adapters/index.js";
import type { JoinResponse, PositionResponse, WaitlistConfig } from "../../../../types.js";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const globalConfig: WaitlistConfig = {
  dbPath: process.env.WAITLIST_DB_PATH,
  referralCookieName: process.env.WAITLIST_REFERRAL_COOKIE ?? "ref",
};

let adapter = createSQLiteAdapter(globalConfig.dbPath);

export function configureWaitlist(config: WaitlistConfig) {
  if (config.adapter) {
    adapter = config.adapter;
  } else if (config.dbPath) {
    adapter = createSQLiteAdapter(config.dbPath);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, referred_by } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    const existing = await adapter.findByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "already_registered" }, { status: 409 });
    }

    const id = nanoid();
    const joined_at = Date.now();

    await adapter.create({ id, email, referred_by, joined_at });
    const position = await adapter.getPosition(email);

    const response: JoinResponse = {
      id,
      email,
      position,
      referral_token: id,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("[waitlist] POST error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    const entry = await adapter.findByEmail(email);
    if (!entry) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const position = await adapter.getPosition(email);

    const response: PositionResponse = {
      id: entry.id,
      email: entry.email,
      position,
      referral_token: entry.id,
      joined_at: entry.joined_at,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[waitlist] GET error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export type { WaitlistConfig };
