'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useConfirm } from '@/hooks/useConfirm'

interface CreatorCode {
  id: string
  code: string
  discountPercent: number
  active: boolean
  createdAt: string
  usages: Array<{
    id: string
    revenueAmount: number
    order: {
      id: string
      status: string
      totalAmount: number
    }
  }>
}

export default function AdminCreatorCodesPage() {
  const [codes, setCodes] = useState<CreatorCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCode, setEditingCode] = useState<CreatorCode | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    discountPercent: 10,
    active: true,
  })
  const { showToast } = useToast()
  const { confirm, ConfirmComponent } = useConfirm()

  useEffect(() => {
    fetchCodes()
  }, [])

  const fetchCodes = async () => {
    try {
      const res = await fetch('/api/admin/creator-codes')
      if (res.ok) {
        const data = await res.json()
        setCodes(data)
      }
    } catch (error) {
      console.error('Failed to fetch creator codes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingCode
        ? `/api/admin/creator-codes/${editingCode.id}`
        : '/api/admin/creator-codes'
      const method = editingCode ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        showToast(editingCode ? 'Creator code updated successfully' : 'Creator code created successfully', 'success')
        fetchCodes()
        resetForm()
      } else {
        showToast('Failed to save creator code', 'error')
      }
    } catch (error) {
      showToast('Failed to save creator code', 'error')
    }
  }

  const handleEdit = (code: CreatorCode) => {
    setEditingCode(code)
    setFormData({
      code: code.code,
      discountPercent: code.discountPercent,
      active: code.active,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    confirm(
      'Are you sure you want to delete this creator code?',
      async () => {
        try {
          const res = await fetch(`/api/admin/creator-codes/${id}`, { method: 'DELETE' })
          if (res.ok) {
            showToast('Creator code deleted successfully', 'success')
            fetchCodes()
          } else {
            showToast('Failed to delete creator code', 'error')
          }
        } catch (error) {
          showToast('Failed to delete creator code', 'error')
        }
      },
      'Delete',
      'Cancel'
    )
  }

  const resetForm = () => {
    setFormData({
      code: '',
      discountPercent: 10,
      active: true,
    })
    setEditingCode(null)
    setShowForm(false)
  }

  const calculateRevenue = (code: CreatorCode): number => {
    // Only count usages from orders that are PAID
    return code.usages
      .filter((usage) => usage.order.status === 'PAID')
      .reduce((sum, usage) => sum + usage.revenueAmount, 0)
  }

  const getPaidUsageCount = (code: CreatorCode): number => {
    return code.usages.filter((usage) => usage.order.status === 'PAID').length
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <>
      {ConfirmComponent}
      <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold gradient-text">Creator Codes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : 'New Code'}
        </button>
      </div>

      {showForm && (
        <div className="glass p-6 rounded-lg border border-purple-500/20 mb-8">
          <h2 className="text-2xl font-bold mb-4 gradient-text">
            {editingCode ? 'Edit Creator Code' : 'New Creator Code'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-900 font-semibold mb-2">Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-purple-500"
                placeholder="CREATOR10"
              />
            </div>
            <div>
              <label className="block text-gray-900 font-semibold mb-2">Discount Percent</label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={formData.discountPercent}
                onChange={(e) =>
                  setFormData({ ...formData, discountPercent: parseFloat(e.target.value) })
                }
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-purple-500"
              />
              <p className="text-gray-600 text-sm mt-1">
                Revenue = (Order Total × Discount %) / 100
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="active" className="text-gray-900 font-semibold">
                Active
              </label>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-colors"
              >
                {editingCode ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 glass border border-purple-500/30 hover:border-purple-500 text-gray-900 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {codes.length === 0 ? (
        <div className="glass p-8 rounded-lg border border-purple-500/20 text-center">
          <p className="text-gray-600 mb-4">No creator codes yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-purple-600 hover:text-purple-700 font-semibold"
          >
            Create your first creator code →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {codes.map((code) => {
            const revenue = calculateRevenue(code)
            const paidUsages = getPaidUsageCount(code)

            return (
              <div
                key={code.id}
                className="glass p-6 rounded-lg border border-purple-500/20 hover:border-purple-500/50 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{code.code}</h3>
                    <p className="text-purple-600 font-semibold">{code.discountPercent}% off</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(code)}
                      className="px-3 py-1 text-sm glass border border-purple-500/30 hover:border-purple-500 text-gray-900 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(code.id)}
                      className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`font-semibold ${
                        code.active ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {code.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid Uses:</span>
                    <span className="text-gray-900 font-semibold">{paidUsages}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-purple-500/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Discount:</span>
                    <span className="text-gray-900 font-semibold">{code.discountPercent}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Revenue Generated:</span>
                    <span className="text-purple-600 font-bold text-xl">
                      ${revenue.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">
                    From {paidUsages} {paidUsages === 1 ? 'paid order' : 'paid orders'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
    </>
  )
}

