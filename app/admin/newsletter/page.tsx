'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ToastProvider'

export default function AdminNewsletterPage() {
  const [subject, setSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [sending, setSending] = useState(false)
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null)
  const { showToast } = useToast()

  const fetchSubscriberCount = async () => {
    try {
      const res = await fetch('/api/admin/newsletter/subscribers')
      if (res.ok) {
        const data = await res.json()
        setSubscriberCount(data.count)
      }
    } catch (error) {
      console.error('Failed to fetch subscriber count:', error)
    }
  }

  useEffect(() => {
    fetchSubscriberCount()
  }, [])

  const handleSend = async () => {
    if (!subject.trim() || !emailBody.trim()) {
      showToast('Please fill in both subject and body', 'error')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          body: emailBody.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        showToast(`Newsletter sent to ${data.sent} subscribers!`, 'success')
        setSubject('')
        setEmailBody('')
        fetchSubscriberCount()
      } else {
        showToast(data.error || 'Failed to send newsletter', 'error')
      }
    } catch (error) {
      showToast('Failed to send newsletter. Please try again.', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2">Newsletter</h1>
        {subscriberCount !== null && (
          <p className="text-gray-600 dark:text-gray-400">
            {subscriberCount} active subscriber{subscriberCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="glass p-6 rounded-lg border border-purple-500/20 space-y-6">
        <div>
          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">
            Subject *
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Newsletter subject line"
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">
            Email Body *
          </label>
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            placeholder="Enter your newsletter content here. You can use markdown formatting."
            rows={15}
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500 resize-none font-mono text-sm"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            Supports markdown: # for headings, - for lists, **bold**, *italic*, [links](url)
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-300 font-semibold mb-2">
            ⚠️ Important Notes:
          </p>
          <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1 list-disc list-inside">
            <li>Newsletters are sent to all active subscribers</li>
            <li>Emails are sent in batches to avoid rate limits</li>
            <li>You can use {'{{customerName}}'} to personalize each email</li>
            <li>Test your email content before sending to all subscribers</li>
          </ul>
        </div>

        <button
          onClick={handleSend}
          disabled={sending || !subject.trim() || !emailBody.trim()}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-700 dark:to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:hover:from-purple-600 dark:hover:to-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? 'Sending Newsletter...' : `Send Newsletter to ${subscriberCount || 0} Subscribers`}
        </button>
      </div>
    </div>
  )
}
