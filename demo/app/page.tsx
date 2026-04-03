'use client'

import { WaitlistForm, SocialProof } from '@cyguin/waitlist/react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">Join the Waitlist</h1>
        <p className="text-gray-600 text-center mb-8">
          Be the first to know when we launch.
        </p>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Sign Up</h2>
          <WaitlistForm
            action="/api/join"
            countEndpoint="/api/count"
            showReferral
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <SocialProof endpoint="/api/count" />
        </div>
      </div>
    </div>
  )
}