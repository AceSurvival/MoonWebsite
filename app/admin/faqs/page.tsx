'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ToastProvider'
import { useConfirm } from '@/hooks/useConfirm'

interface FAQ {
  id: string
  question: string
  createdAt: string
}

export default function AdminFAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()
  const { confirm, ConfirmComponent } = useConfirm()

  useEffect(() => {
    fetchFAQs()
  }, [])

  const fetchFAQs = async () => {
    try {
      const res = await fetch('/api/admin/faqs')
      if (res.ok) {
        const data = await res.json()
        setFaqs(data)
      }
    } catch (error) {
      console.error('Failed to fetch FAQs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    confirm(
      'Are you sure you want to delete this FAQ?',
      async () => {
        try {
          const res = await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE' })
          if (res.ok) {
            showToast('FAQ deleted successfully', 'success')
            fetchFAQs()
          } else {
            showToast('Failed to delete FAQ', 'error')
          }
        } catch (error) {
          showToast('Failed to delete FAQ', 'error')
        }
      },
      'Delete',
      'Cancel'
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <>
      {ConfirmComponent}
      <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold gradient-text">FAQs</h1>
        <Link
          href="/admin/faqs/new"
          className="px-6 py-3 bg-neon-purple hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors"
        >
          New FAQ
        </Link>
      </div>

      {faqs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No FAQs yet.</p>
          <Link
            href="/admin/faqs/new"
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold"
          >
            Create your first FAQ →
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Question
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {faqs.map((faq) => (
                <tr key={faq.id} className="hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{faq.question}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                    {new Date(faq.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/faqs/${faq.id}/edit`}
                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-sm rounded transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="px-3 py-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-sm rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </>
  )
}


