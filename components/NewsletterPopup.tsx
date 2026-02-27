'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY_DISMISSED = 'newsletter_popup_dismissed'
const STORAGE_KEY_SUBSCRIBED = 'newsletter_popup_subscribed'
const SHOW_DELAY_MS = 2000
const DISCORD_LINK = 'https://discord.gg/jk4Y8vJw8J'

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successCode, setSuccessCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    const dismissed = localStorage.getItem(STORAGE_KEY_DISMISSED) === 'true'
    const subscribed = localStorage.getItem(STORAGE_KEY_SUBSCRIBED) === 'true'
    if (dismissed || subscribed) return
    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => clearTimeout(t)
  }, [mounted])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY_DISMISSED, 'true')
    setVisible(false)
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter your email.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        setLoading(false)
        return
      }
      localStorage.setItem(STORAGE_KEY_SUBSCRIBED, 'true')
      setSuccessCode(data.code)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = async () => {
    if (!successCode) return
    try {
      await navigator.clipboard.writeText(successCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleCloseAfterSuccess = () => {
    setVisible(false)
    setSuccessCode(null)
    setEmail('')
  }

  if (!visible) return null

  return (
    <>
      <div className="fixed inset-0 z-[9996] bg-black/40 backdrop-blur-sm" aria-hidden />
      <div className="fixed inset-0 z-[9997] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="newsletter-popup-title">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-purple-200 dark:border-purple-800 overflow-hidden">
          <div className="p-6 sm:p-8">
            {successCode ? (
              <>
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">🎉</div>
                  <h2 id="newsletter-popup-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    You&apos;re in!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Use this code at checkout for <strong>10% off</strong> your first order.
                  </p>
                </div>
                <div className="flex items-center gap-2 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                  <code className="flex-1 text-lg font-mono font-bold text-purple-700 dark:text-purple-300 truncate">
                    {successCode}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg whitespace-nowrap transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                  Code expires in 30 days. We&apos;ll send deals and updates to your inbox.
                </p>
                <button
                  type="button"
                  onClick={handleCloseAfterSuccess}
                  className="mt-6 w-full py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-xl transition-colors"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">📬</div>
                  <h2 id="newsletter-popup-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    Get 10% off your first order
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Subscribe to our newsletter and we&apos;ll send you a unique discount code right now.
                  </p>
                </div>
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    autoComplete="email"
                    disabled={loading}
                  />
                  {error && (
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl transition-all disabled:opacity-60"
                  >
                    {loading ? 'Subscribing...' : 'Subscribe & get 10% off'}
                  </button>
                </form>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                  Or{' '}
                  <a
                    href={DISCORD_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 dark:text-purple-400 font-medium hover:underline"
                  >
                    join our Discord community
                  </a>
                  {' '}for researchers — exclusive discounts & more.
                </p>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="mt-4 w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Maybe later
                </button>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={successCode ? handleCloseAfterSuccess : handleDismiss}
            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
