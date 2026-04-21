'use client';

import React, { useState, useCallback } from 'react';
import type { JoinResponse } from '../types.js';

export interface WaitlistFormProps {
  className?: string;
  onSuccess?: (data: JoinResponse) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  buttonText?: string;
  redirectTo?: string;
}

type FormState = 'idle' | 'loading' | 'success' | 'error';

export function WaitlistForm({
  className = '',
  onSuccess,
  onError,
  placeholder = 'Enter your email',
  buttonText = 'Join waitlist',
  redirectTo,
}: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<JoinResponse | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setState('loading');
    setErrorMessage('');

    try {
      const referred_by = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('ref') ?? undefined
        : undefined;

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), referred_by }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error === 'already_registered'
          ? 'This email is already on the waitlist.'
          : data.error ?? 'Something went wrong. Please try again.';
        setErrorMessage(msg);
        setState('error');
        onError?.(msg);
        return;
      }

      const response: JoinResponse = {
        id: data.id,
        email: data.email,
        position: data.position,
        referral_token: data.referral_token,
      };

      setResult(response);
      setState('success');
      onSuccess?.(response);

      if (redirectTo) {
        window.location.href = `${redirectTo}?ref=${response.referral_token}`;
      }
    } catch {
      const msg = 'Network error. Please check your connection and try again.';
      setErrorMessage(msg);
      setState('error');
      onError?.(msg);
    }
  }, [email, redirectTo, onSuccess, onError]);

  const referralLink = result
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${result.referral_token}`
    : '';

  return (
    <>
      <style>{`
        .cyguin-waitlist-form {
          --cyguin-bg: #ffffff;
          --cyguin-bg-subtle: #f1f3f6;
          --cyguin-border: #e5e5e5;
          --cyguin-border-focus: #ffd21f;
          --cyguin-fg: #0a0d17;
          --cyguin-fg-muted: #858b98;
          --cyguin-accent: #ffd21f;
          --cyguin-accent-dark: #e0a900;
          --cyguin-accent-fg: #0a0d17;
          --cyguin-radius: 6px;
          --cyguin-shadow: 0 1px 4px rgba(0,0,0,0.08);
          font-family: system-ui, -apple-system, sans-serif;
          width: 100%;
        }
        .cyguin-waitlist-form[data-theme="dark"] {
          --cyguin-bg: #0a0d17;
          --cyguin-bg-subtle: #101521;
          --cyguin-border: #252b3a;
          --cyguin-fg: #f1f3f6;
          --cyguin-fg-muted: #858b98;
        }
        .cyguin-waitlist-form[data-theme="dark"] .waitlist-input {
          background-color: var(--cyguin-bg-subtle);
          border-color: var(--cyguin-border);
          color: var(--cyguin-fg);
        }
        .cyguin-waitlist-form[data-theme="dark"] .waitlist-input::placeholder {
          color: var(--cyguin-fg-muted);
        }
        .cyguin-waitlist-form .waitlist-form-row {
          display: flex;
          gap: 8px;
        }
        .cyguin-waitlist-form .waitlist-input {
          flex: 1;
          padding: 10px 14px;
          font-size: 15px;
          line-height: 1.4;
          background-color: var(--cyguin-bg);
          color: var(--cyguin-fg);
          border: 1px solid var(--cyguin-border);
          border-radius: var(--cyguin-radius);
          box-shadow: var(--cyguin-shadow);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          min-width: 0;
        }
        .cyguin-waitlist-form .waitlist-input::placeholder {
          color: var(--cyguin-fg-muted);
        }
        .cyguin-waitlist-form .waitlist-input:focus {
          border-color: var(--cyguin-border-focus);
          box-shadow: 0 0 0 3px rgba(255, 210, 31, 0.18);
        }
        .cyguin-waitlist-form .waitlist-button {
          padding: 10px 20px;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.4;
          background-color: var(--cyguin-accent);
          color: var(--cyguin-accent-fg);
          border: none;
          border-radius: var(--cyguin-radius);
          cursor: pointer;
          white-space: nowrap;
          transition: background-color 0.15s, opacity 0.15s;
        }
        .cyguin-waitlist-form .waitlist-button:hover:not(:disabled) {
          background-color: var(--cyguin-accent-dark);
        }
        .cyguin-waitlist-form .waitlist-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .cyguin-waitlist-form .waitlist-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: cyguin-waitlist-spin 0.6s linear infinite;
        }
        @keyframes cyguin-waitlist-spin {
          to { transform: rotate(360deg); }
        }
        .cyguin-waitlist-form .waitlist-message {
          margin-top: 12px;
          padding: 12px 14px;
          border-radius: var(--cyguin-radius);
          font-size: 14px;
          line-height: 1.4;
        }
        .cyguin-waitlist-form .waitlist-error {
          background-color: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
        .cyguin-waitlist-form[data-theme="dark"] .waitlist-error {
          background-color: #1a0a0a;
          color: #fca5a5;
          border-color: #7f1d1d;
        }
        .cyguin-waitlist-form .waitlist-success {
          background-color: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        .cyguin-waitlist-form[data-theme="dark"] .waitlist-success {
          background-color: #0a1a0a;
          color: #86efac;
          border-color: #14532d;
        }
        .cyguin-waitlist-form .waitlist-position {
          font-weight: 700;
          font-size: 18px;
          color: var(--cyguin-accent);
          display: block;
          margin-bottom: 4px;
        }
        .cyguin-waitlist-form .waitlist-share {
          margin-top: 10px;
          font-size: 13px;
          color: var(--cyguin-fg-muted);
        }
        .cyguin-waitlist-form .waitlist-share-link {
          display: inline-block;
          margin-top: 6px;
          padding: 6px 10px;
          background-color: var(--cyguin-bg-subtle);
          border: 1px solid var(--cyguin-border);
          border-radius: var(--cyguin-radius);
          font-family: monospace;
          font-size: 12px;
          word-break: break-all;
          color: var(--cyguin-fg);
          width: 100%;
          box-sizing: border-box;
        }
      `}</style>

      <div className={`cyguin-waitlist-form ${className}`} data-theme="light">
        {state !== 'success' ? (
          <form onSubmit={handleSubmit}>
            <div className="waitlist-form-row">
              <input
                type="email"
                className="waitlist-input"
                placeholder={placeholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={state === 'loading'}
                aria-label="Email address"
              />
              <button
                type="submit"
                className="waitlist-button"
                disabled={state === 'loading' || !email.trim()}
              >
                {state === 'loading' ? (
                  <span className="waitlist-spinner" aria-hidden="true" />
                ) : (
                  buttonText
                )}
              </button>
            </div>

            {state === 'error' && errorMessage && (
              <div className="waitlist-message waitlist-error" role="alert">
                {errorMessage}
              </div>
            )}
          </form>
        ) : (
          <div className="waitlist-message waitlist-success" role="status">
            <span className="waitlist-position">
              You&apos;re #{result?.position} on the list!
            </span>
            <span>You&apos;re on the waitlist. Share your link to move up:</span>
            {referralLink && (
              <div className="waitlist-share">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="waitlist-share-link"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  aria-label="Your referral link"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}