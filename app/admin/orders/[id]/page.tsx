'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ToastProvider'

interface OrderItem {
  id: string
  product: {
    name: string
  }
  quantity: number
  unitPrice: number
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  email: string
  phone: string | null
  paymentMethod: string
  status: string
  totalAmount: number
  subtotalAmount: number | null
  discountAmount: number
  taxAmount: number | null
  shippingAmount: number | null
  shippingAddress: string
  orderNotes: string | null
  adminNotes: string | null
  trackingNumber: string | null
  shippingProvider: string | null
  items: OrderItem[]
  createdAt: string
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [status, setStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [shippingProvider, setShippingProvider] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
        setStatus(data.status)
        setTrackingNumber(data.trackingNumber || '')
        setShippingProvider(data.shippingProvider || '')
        setAdminNotes(data.adminNotes || '')
      }
    } catch (error) {
      console.error('Failed to fetch order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          trackingNumber: trackingNumber.trim() || null,
          shippingProvider: shippingProvider.trim() || null,
          adminNotes: adminNotes.trim() || null,
        }),
      })

      if (res.ok) {
        fetchOrder()
        showToast('Order status updated successfully', 'success')
      } else {
        showToast('Failed to update order status', 'error')
      }
    } catch (error) {
      showToast('Failed to update order status', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSendPaymentReminder = async () => {
    if (order?.status !== 'PENDING_PAYMENT') {
      showToast('Payment reminders can only be sent for orders with PENDING_PAYMENT status', 'error')
      return
    }

    setSendingReminder(true)
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-payment-reminder',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        showToast('Payment reminder email sent successfully', 'success')
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to send payment reminder', 'error')
      }
    } catch (error) {
      showToast('Failed to send payment reminder', 'error')
    } finally {
      setSendingReminder(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-gray-600">Order not found.</p>
        <Link href="/admin/orders" className="text-purple-600 hover:text-purple-700 mt-4 inline-block font-semibold">
          Back to Orders
        </Link>
      </div>
    )
  }

  const shippingAddress = JSON.parse(order.shippingAddress)
  const subtotal = order.subtotalAmount || order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/admin/orders"
          className="text-purple-600 hover:text-purple-700 mb-4 inline-block font-semibold"
        >
          ← Back to Orders
        </Link>
        <h1 className="text-4xl font-bold gradient-text">Order Details</h1>
      </div>

      <div className="space-y-6">
        {/* Order Info */}
        <div className="bg-white p-6 rounded-lg border border-purple-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold gradient-text mb-2">Order #{order.orderNumber}</h2>
              <p className="text-gray-600 text-sm">
                Created: {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold gradient-text">${order.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-600 text-sm mb-1">Customer</p>
              <p className="text-gray-900 font-semibold">{order.customerName}</p>
              <p className="text-gray-600 text-sm">{order.email}</p>
              {order.phone && (
                <p className="text-gray-600 text-sm">Phone: {order.phone}</p>
              )}
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Payment Method</p>
              <p className="text-gray-900 font-semibold">{order.paymentMethod}</p>
            </div>
          </div>

          {/* Customer notes (read-only) */}
          {order.orderNotes && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm font-semibold mb-1">Customer notes</p>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{order.orderNotes}</p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            {order.status === 'PENDING_PAYMENT' && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-800 font-semibold mb-1">Payment Reminder</p>
                    <p className="text-yellow-700 text-sm">
                      Send a payment reminder email to the customer
                    </p>
                  </div>
                  <button
                    onClick={handleSendPaymentReminder}
                    disabled={sendingReminder}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {sendingReminder ? 'Sending...' : 'Send Reminder'}
                  </button>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-gray-900 font-semibold mb-2">Admin notes (internal only)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add a note for this order (e.g. customer request, follow-up, special instructions)"
                rows={3}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-purple-500 resize-y"
              />
              <p className="text-gray-600 text-sm mt-1">Saved when you click Update Status below. Not visible to the customer.</p>
            </div>

            <div>
              <label className="block text-gray-900 font-semibold mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-purple-500"
              >
                <option value="PENDING_PAYMENT">Pending Payment</option>
                <option value="PAID">Paid</option>
                <option value="SHIPPED">Shipped</option>
                <option value="CANCELED">Canceled</option>
              </select>
            </div>
            
            {status === 'SHIPPED' && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-900 font-semibold mb-2">Shipping Provider</label>
                  <select
                    value={shippingProvider}
                    onChange={(e) => setShippingProvider(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Select Provider</option>
                    <option value="UPS">UPS</option>
                    <option value="USPS">USPS</option>
                    <option value="FedEx">FedEx</option>
                    <option value="DHL">DHL</option>
                    <option value="Other">Other</option>
                  </select>
                  <p className="text-gray-600 text-sm mt-1">
                    Select the shipping provider to generate the correct tracking link.
                  </p>
                </div>
                <div>
                  <label className="block text-gray-900 font-semibold mb-2">Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number (e.g., 1Z999AA10123456784)"
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-gray-600 text-sm mt-1">
                    Customer will receive an email with tracking information when you update the status.
                  </p>
                </div>
              </>
            )}
            
            {order?.trackingNumber && status !== 'SHIPPED' && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">
                  <strong>Current Tracking:</strong> {order.trackingNumber}
                </p>
              </div>
            )}
            
            <button
              onClick={handleStatusUpdate}
              disabled={saving}
              className="w-full px-6 py-2 bg-neon-purple hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update Status'}
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white p-6 rounded-lg border border-purple-200 shadow-sm">
          <h2 className="text-xl font-bold mb-4 gradient-text">Items</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                <div>
                  <p className="text-gray-900 font-semibold">{item.product.name}</p>
                  <p className="text-gray-600 text-sm">Quantity: {item.quantity}</p>
                </div>
                <p className="text-purple-600 font-semibold">
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-neon-teal">
                <span>Discount</span>
                <span>-${order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {(order.taxAmount || 0) > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Tax</span>
                <span>${(order.taxAmount || 0).toFixed(2)}</span>
              </div>
            )}
            {(order.shippingAmount || 0) > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Shipping</span>
                <span>${(order.shippingAmount || 0).toFixed(2)}</span>
              </div>
            )}
            {(order.shippingAmount || 0) === 0 && shippingAddress?.state?.toUpperCase() === 'CA' && (
              <div className="flex justify-between text-green-600 text-sm">
                <span>✓ Free Shipping</span>
                <span>$0.00</span>
              </div>
            )}
            <div className="flex justify-between text-gray-900 font-bold text-lg pt-2 border-t border-gray-200">
              <span>Total</span>
              <span className="gradient-text">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white p-6 rounded-lg border border-purple-200 shadow-sm">
          <h2 className="text-xl font-bold mb-4 gradient-text">Shipping Address</h2>
          <p className="text-gray-700">
            {shippingAddress.address}
            <br />
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
            <br />
            {shippingAddress.country}
          </p>
        </div>
      </div>
    </div>
  )
}


