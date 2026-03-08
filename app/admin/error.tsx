'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin error:', error)
  }, [error])

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <h1 className="text-2xl font-bold mb-4 gradient-text">Something went wrong</h1>
      <div className="bg-amber-900/30 border border-amber-600/50 text-amber-200 p-6 rounded-xl mb-6">
        <p className="text-sm mb-2 font-semibold">Error: {error.message}</p>
        {error.digest && (
          <p className="text-xs text-amber-300/80 font-mono">Digest: {error.digest}</p>
        )}
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
        This often means <strong>DATABASE_URL</strong> is not set in Vercel (Production env), the database is unreachable, or tables are missing. Add <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">DATABASE_URL</code> in Vercel → Settings → Environment Variables, then run <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">npx prisma db push</code> against that database.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg"
        >
          Try again
        </button>
        <Link
          href="/admin/login"
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}
