CREATE TABLE IF NOT EXISTS waitlist_signups (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  referral_code TEXT,
  own_code TEXT UNIQUE NOT NULL,
  invited_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist_signups (created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_own_code ON waitlist_signups (own_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_referral_code ON waitlist_signups (referral_code);
PRAGMA journal_mode=WAL;
