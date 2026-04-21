import React, { useState, useCallback, useEffect } from 'react'

export interface WaitlistAdminProps {
  endpoint: string
  adminSecret: string
  theme?: 'light' | 'dark'
  pageSize?: number
  className?: string
}

interface Signup {
  id: string
  email: string
  ownCode: string
  position: number
  referralCount: number
  invitedAt: string | null
  createdAt: string
}

interface AdminListResponse {
  signups: Signup[]
  total: number
  page: number
  limit: number
}

interface AdminMarkInvitedResponse {
  updated: number
}

async function fetchList(
  endpoint: string,
  adminSecret: string,
  page: number,
  pageSize: number
): Promise<AdminListResponse> {
  const url = `${endpoint}?action=list&page=${page}&limit=${pageSize}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${adminSecret}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

async function markInvited(
  endpoint: string,
  adminSecret: string,
  ids: string[]
): Promise<number> {
  const url = `${endpoint}?action=markInvited&ids=${ids.join(',')}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminSecret}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  const data: AdminMarkInvitedResponse = await res.json()
  return data.updated
}

async function exportCsv(endpoint: string, adminSecret: string): Promise<void> {
  const url = `${endpoint}?action=exportCsv`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${adminSecret}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  const blob = await res.blob()
  const downloadUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = 'waitlist.csv'
  a.click()
  URL.revokeObjectURL(downloadUrl)
}

export function WaitlistAdmin({
  endpoint,
  adminSecret,
  theme = 'dark',
  pageSize = 25,
  className,
}: WaitlistAdminProps) {
  const colors = theme === 'dark'
    ? {
        bg: '#0a0d17',
        bgSubtle: '#101521',
        border: '#252b3a',
        fg: '#f1f3f6',
        muted: '#858b98',
        accent: '#ffd21f',
        accentFg: '#0a0d17',
      }
    : {
        bg: '#ffffff',
        bgSubtle: '#f1f3f6',
        border: '#e5e5e5',
        fg: '#0a0d17',
        muted: '#858b98',
        accent: '#ffd21f',
        accentFg: '#0a0d17',
      }
  const [signups, setSignups] = useState<Signup[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)

  const totalPages = Math.ceil(total / pageSize)

  const load = useCallback(
    async (pageNum: number) => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchList(endpoint, adminSecret, pageNum, pageSize)
        setSignups(data.signups)
        setTotal(data.total)
        setPage(pageNum)
        setSelected(new Set())
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    },
    [endpoint, adminSecret, pageSize]
  )

  useEffect(() => {
    load(1)
  }, [load])

  const toggleAll = () => {
    if (selected.size === signups.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(signups.map((s) => s.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelected(next)
  }

  const handleInvite = async () => {
    if (selected.size === 0) return
    setInviting(true)
    setError(null)
    try {
      await markInvited(endpoint, adminSecret, Array.from(selected))
      await load(page)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setInviting(false)
    }
  }

  const handleExportCsv = async () => {
    setError(null)
    try {
      await exportCsv(endpoint, adminSecret)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className={className} style={{ color: colors.fg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0 }}>Waitlist ({total.toLocaleString()} total)</h3>
        <button onClick={handleExportCsv} disabled={loading} style={{ ...buttonStyle(colors), marginLeft: 'auto' }}>
          Export CSV
        </button>
      </div>

      {error && <div style={{ color: '#fca5a5', marginBottom: '0.5rem' }}>{error}</div>}

      {loading && signups.length === 0 ? (
        <div>Loading...</div>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle(colors)}>
                  <input type="checkbox" checked={signups.length > 0 && selected.size === signups.length} onChange={toggleAll} />
                </th>
                <th style={thStyle(colors)}>#</th>
                <th style={thStyle(colors)}>Email</th>
                <th style={thStyle(colors)}>Referrals</th>
                <th style={thStyle(colors)}>Invited</th>
                <th style={thStyle(colors)}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {signups.map((signup) => (
                <tr key={signup.id} style={{ backgroundColor: signup.invitedAt ? 'rgba(255, 210, 31, 0.08)' : 'transparent' }}>
                  <td style={tdStyle(colors)}>
                    <input type="checkbox" checked={selected.has(signup.id)} onChange={() => toggleOne(signup.id)} />
                  </td>
                  <td style={tdStyle(colors)}>{signup.position}</td>
                  <td style={tdStyle(colors)}>{signup.email}</td>
                  <td style={tdStyle(colors)}>{signup.referralCount}</td>
                  <td style={tdStyle(colors)}>{signup.invitedAt ? '✓' : '—'}</td>
                  <td style={tdStyle(colors)}>{new Date(signup.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {selected.size > 0 && (
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleInvite} disabled={inviting} style={buttonStyle(colors)}>
                {inviting ? 'Inviting...' : `Invite ${selected.size} member${selected.size > 1 ? 's' : ''}`}
              </button>
              <button onClick={() => setSelected(new Set())} style={secondaryButtonStyle(colors)}>Clear</button>
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button onClick={() => load(page - 1)} disabled={page <= 1 || loading} style={secondaryButtonStyle(colors)}>Prev</button>
              <span style={{ color: colors.muted }}>Page {page} of {totalPages}</span>
              <button onClick={() => load(page + 1)} disabled={page >= totalPages || loading} style={secondaryButtonStyle(colors)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function thStyle(colors: { border: string; muted: string }): React.CSSProperties {
  return {
  textAlign: 'left',
  padding: '0.5rem',
  borderBottom: `2px solid ${colors.border}`,
  fontWeight: 600,
  color: colors.muted,
  }
}

function tdStyle(colors: { border: string }): React.CSSProperties {
  return {
  padding: '0.5rem',
  borderBottom: `1px solid ${colors.border}`,
  }
}

function buttonStyle(colors: { accent: string; accentFg: string; border: string }): React.CSSProperties {
  return {
    background: colors.accent,
    color: colors.accentFg,
    border: `1px solid ${colors.accent}`,
    borderRadius: 6,
    padding: '0.45rem 0.75rem',
    cursor: 'pointer',
    fontWeight: 600,
  }
}

function secondaryButtonStyle(colors: { bgSubtle: string; fg: string; border: string }): React.CSSProperties {
  return {
    background: colors.bgSubtle,
    color: colors.fg,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    padding: '0.45rem 0.75rem',
    cursor: 'pointer',
  }
}
