'use client'

import { WaitlistAdmin } from '@cyguin/waitlist/react'

export default function Admin() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Waitlist Admin</h1>
        <WaitlistAdmin
          endpoint="/api/admin"
          adminSecret={process.env.NEXT_PUBLIC_ADMIN_SECRET || 'dev-secret-123'}
        />
      </div>
    </div>
  )
}