'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ToastProvider'
import { useConfirm } from '@/hooks/useConfirm'

interface DiscountCode {
  id: string
  code: string
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountPercent: number | null
  discountAmount: number | null
  active: boolean
  expiryDate: string | null
  createdAt: string
  orders: Array<{
    id: string
    status: string
    totalAmount: number
    discountAmount: number
  }>
}

export default function AdminDiscountCodesPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountPercent: 10,
    discountAmount: 0,
    active: true,
    expiryDate: '',
  })
  const { showToast } = useToast()
  const { confirm, ConfirmComponent } = useConfirm()

  useEffect(() => {
    fetchCodes()
  }, [])

  const fetchCodes = async () => {
    try {
      const res = await fetch('/api/admin/discount-codes')
      if (res.ok) {
        const data = await res.json()
        setCodes(data)
      }
    } catch (error) {
      console.error('Failed to fetch discount codes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingCode
        ? `/api/admin/discount-codes/${editingCode.id}`
        : '/api/admin/discount-codes'
      const method = editingCode ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        showToast(editingCode ? 'Discount code updated successfully' : 'Discount code created successfully', 'success')
        fetchCodes()
        resetForm()
      } else {
        showToast('Failed to save discount code', 'error')
      }
    } catch (error) {
      showToast('Failed to save discount code', 'error')
    }
  }

  const handleEdit = (code: DiscountCode) => {
    setEditingCode(code)
    setFormData({
      code: code.code,
      discountType: code.discountType || 'PERCENTAGE',
      discountPercent: code.discountPercent || 10,
      discountAmount: code.discountAmount || 0,
      active: code.active,
      expiryDate: code.expiryDate ? new Date(code.expiryDate).toISOString().split('T')[0] : '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    confirm(
      'Are you sure you want to delete this discount code?',
      async () => {
        try {
          const res = await fetch(`/api/admin/discount-codes/${id}`, { method: 'DELETE' })
          if (res.ok) {
            showToast('Discount code deleted successfully', 'success')
            fetchCodes()
          } else {
            showToast('Failed to delete discount code', 'error')
          }
        } catch (error) {
          showToast('Failed to delete discount code', 'error')
        }
      },
      'Delete',
      'Cancel'
    )
  }

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'PERCENTAGE',
      discountPercent: 10,
      discountAmount: 0,
      active: true,
      expiryDate: '',
    })
    setEditingCode(null)
    setShowForm(false)
  }

  const calculateRevenue = (code: DiscountCode): number => {
    // Only count orders that are PAID
    return code.orders
      .filter((order) => order.status === 'PAID')
      .reduce((sum, order) => sum + (order.discountAmount || 0), 0)
  }

  const getPaidOrderCount = (code: DiscountCode): number => {
    return code.orders.filter((order) => order.status === 'PAID').length
  }

  const isExpired = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
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
        <h1 className="text-4xl font-bold gradient-text">Discount Codes</h1>
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
            {editingCode ? 'Edit Discount Code' : 'New Discount Code'}
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
                placeholder="SAVE10"
              />
            </div>
            <div>
              <label className="block text-gray-900 font-semibold mb-2">Discount Type</label>
              <select
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({ ...formData, discountType: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT' })
                }
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-purple-500"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed Dollar Amount ($)</option>
              </select>
            </div>
            {formData.discountType === 'PERCENTAGE' ? (
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
              </div>
            ) : (
              <div>
                <label className="block text-gray-900 font-semibold mb-2">Discount Amount ($)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={formData.discountAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, discountAmount: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-purple-500"
                />
              </div>
            )}
            <div>
              <label className="block text-gray-900 font-semibold mb-2">Expiry Date (Optional)</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-purple-500"
              />
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
          <p className="text-gray-600 mb-4">No discount codes yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-purple-600 hover:text-purple-700 font-semibold"
          >
            Create your first discount code →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {codes.map((code) => {
            const revenue = calculateRevenue(code)
            const paidOrders = getPaidOrderCount(code)
            const expired = isExpired(code.expiryDate)

            return (
              <div
                key={code.id}
                className="glass p-6 rounded-lg border border-purple-500/20 hover:border-purple-500/50 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{code.code}</h3>
                    <p className="text-purple-600 font-semibold">
                      {code.discountType === 'FIXED_AMOUNT' 
                        ? `$${code.discountAmount?.toFixed(2)} off`
                        : `${code.discountPercent}% off`}
                    </p>
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
                        expired
                          ? 'text-red-600'
                          : code.active
                          ? 'text-green-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {expired ? 'Expired' : code.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {code.expiryDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Expires:</span>
                      <span className="text-gray-900">
                        {new Date(code.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid Orders:</span>
                    <span className="text-gray-900 font-semibold">{paidOrders}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-purple-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Revenue Generated:</span>
                    <span className="text-purple-600 font-bold text-xl">
                      ${revenue.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">
                    From {paidOrders} {paidOrders === 1 ? 'paid order' : 'paid orders'}
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

