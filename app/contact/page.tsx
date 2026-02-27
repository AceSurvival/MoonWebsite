'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ToastProvider'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [contactEmail, setContactEmail] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    async function fetchContactEmail() {
      try {
        const res = await fetch('/api/settings/contact-email')
        if (res.ok) {
          const data = await res.json()
          setContactEmail(data.email || '')
        }
      } catch (error) {
        console.error('Failed to fetch contact email:', error)
      }
    }
    fetchContactEmail()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setSubmitted(true)
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        showToast('Failed to send message. Please try again.', 'error')
      }
    } catch (error) {
      showToast('Failed to send message. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass p-8 rounded-lg border border-purple-500/20 dark:border-purple-700/50">
            <div className="text-6xl mb-4 text-green-500">✓</div>
            <h2 className="text-2xl font-bold mb-4 gradient-text">Message Sent!</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Thank you for contacting us. We'll get back to you as soon as possible.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              Send Another Message
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 gradient-text">Contact Us</h1>

        {contactEmail && (
          <div className="glass p-4 rounded-lg border border-purple-500/20 dark:border-purple-700/50 mb-6">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="text-purple-600 dark:text-purple-400 font-semibold">Email:</span> {contactEmail}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass p-6 rounded-lg border border-purple-500/20 dark:border-purple-700/50">
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="subject" className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="message" className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">
              Message *
            </label>
            <textarea
              id="message"
              required
              rows={6}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-neon-purple hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  )
}

