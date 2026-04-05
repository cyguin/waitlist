export interface WaitlistEntry {
  id: string;
  email: string;
  referred_by?: string;
  joined_at: number;
  burned_at?: number;
}

export interface WaitlistAdapter {
  create(entry: {
    id: string;
    email: string;
    referred_by?: string;
    joined_at: number;
  }): Promise<void>;
  findByEmail(email: string): Promise<WaitlistEntry | null>;
  findById(id: string): Promise<WaitlistEntry | null>;
  getPosition(email: string): Promise<number>;
  list(options?: { limit?: number; offset?: number }): Promise<WaitlistEntry[]>;
}

export interface JoinResponse {
  id: string;
  email: string;
  position: number;
  referral_token: string;
}

export interface PositionResponse {
  id: string;
  email: string;
  position: number;
  referral_token: string;
  joined_at: number;
}

export interface WaitlistConfig {
  adapter?: WaitlistAdapter;
  dbPath?: string;
  referralCookieName?: string;
}
