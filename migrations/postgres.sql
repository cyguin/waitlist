CREATE TABLE IF NOT EXISTS waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  referral_code TEXT,
  own_code TEXT UNIQUE NOT NULL,
  invited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist_signups (created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_own_code ON waitlist_signups (own_code);
