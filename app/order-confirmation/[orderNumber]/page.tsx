'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Order {
  orderNumber: string
  customerName: string
  email: string
  paymentMethod: string
  totalAmount: number
  subtotalAmount: number
  discountAmount: number
  taxAmount: number
  shippingAmount: number
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
  }>
  shippingAddress: {
    address: string
    city: string
    state: string
    postalCode: string
    country: string
  }
}

interface PaymentSettings {
  zelle: string
  bitcoin: string
  bitcoinQr: string | null
  cashapp: string
}

export default function OrderConfirmationPage() {
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${params.orderNumber}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        if (res.ok) {
          const data = await res.json()
          setOrder(data)
        }
      } catch (error) {
        console.error('Failed to fetch order:', error)
      } finally {
        setLoading(false)
      }
    }

    async function fetchPaymentSettings() {
      try {
        const res = await fetch('/api/settings/payment', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        if (res.ok) {
          const data = await res.json()
          setPaymentSettings(data)
        }
      } catch (error) {
        console.error('Failed to fetch payment settings:', error)
      }
    }

    fetchOrder()
    fetchPaymentSettings()
  }, [params.orderNumber])

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">Order not found.</p>
          <Link
            href="/store"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-700 dark:to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:hover:from-purple-600 dark:hover:to-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Store
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = order.subtotalAmount || order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  )

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 text-green-500 dark:text-green-400">✓</div>
          <h1 className="text-4xl font-bold mb-4 gradient-text dark:text-purple-400">Order Confirmed!</h1>
          <p className="text-gray-700 dark:text-gray-300 text-lg mb-2">
            Order Number:
          </p>
          <p className="text-3xl sm:text-4xl md:text-5xl font-mono text-purple-600 dark:text-purple-400 font-black tracking-wider">
            {order.orderNumber}
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-500 dark:border-amber-600 p-6 rounded-xl mb-8 shadow-sm">
          <p className="text-amber-800 dark:text-amber-200 font-bold text-lg mb-2">⚠️ Payment required before shipment</p>
          <p className="text-gray-800 dark:text-gray-200 mb-3">
            <strong>Your order will not ship until payment is received.</strong> Please complete payment as soon as possible using the instructions below. Include your order number in the payment memo so we can match it to your order.
          </p>
          <p className="text-amber-800 dark:text-amber-200 font-semibold">
            Total to pay: <span className="font-mono text-xl">${order.totalAmount.toFixed(2)}</span>
          </p>
        </div>

        {/* Order Details */}
        <div className="glass p-6 rounded-lg border border-purple-500/20 dark:border-purple-700/50 mb-6">
          <h2 className="text-xl font-bold mb-4 gradient-text dark:text-purple-400">Order Details</h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300">
            <p>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">Customer:</span> {order.customerName}
            </p>
            <p>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">Email:</span> {order.email}
            </p>
            <p>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">Payment Method:</span>{' '}
              {order.paymentMethod}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="glass p-6 rounded-lg border border-purple-500/20 dark:border-purple-700/50 mb-6">
          <h2 className="text-xl font-bold mb-4 gradient-text dark:text-purple-400">Items</h2>
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-purple-500/20 dark:border-purple-700/50 mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-neon-teal dark:text-teal-400">
                <span>Discount</span>
                <span>-${order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {order.taxAmount > 0 && (
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Tax</span>
                <span>${order.taxAmount.toFixed(2)}</span>
              </div>
            )}
            {order.shippingAmount > 0 && (
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Shipping</span>
                <span>${order.shippingAmount.toFixed(2)}</span>
              </div>
            )}
            {order.shippingAmount === 0 && order.shippingAddress?.state?.toUpperCase() === 'CA' && (
              <div className="flex justify-between text-green-600 dark:text-green-400 text-sm">
                <span>✓ Free Shipping</span>
                <span>$0.00</span>
              </div>
            )}
            <div className="flex justify-between text-gray-900 dark:text-gray-100 font-bold text-lg pt-2 border-t border-purple-500/20 dark:border-purple-700/50">
              <span>Total</span>
              <span className="gradient-text dark:text-purple-400">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="glass p-6 rounded-lg border border-purple-500/20 dark:border-purple-700/50 mb-6">
          <h2 className="text-xl font-bold mb-4 gradient-text dark:text-purple-400">Shipping Address</h2>
          <p className="text-gray-700 dark:text-gray-300">
            {order.shippingAddress.address}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
            {order.shippingAddress.postalCode}
            <br />
            {order.shippingAddress.country}
          </p>
        </div>

        {/* Payment Instructions */}
        {paymentSettings && (
          <div className="glass p-6 rounded-lg border-2 border-purple-500/50 dark:border-purple-700/50 mb-6">
            <h2 className="text-xl font-bold mb-2 gradient-text dark:text-purple-400">Payment Instructions</h2>
            <p className="text-gray-700 dark:text-gray-300 font-semibold mb-4">
              Complete your payment below. We will ship your order only after payment is received.
            </p>
            {order.paymentMethod === 'ZELLE' && (
              <div>
                <p className="text-purple-600 dark:text-purple-400 font-semibold mb-2">Zelle Payment:</p>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line mb-4">{paymentSettings.zelle}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Please include order number <span className="font-mono text-purple-600 dark:text-purple-400 font-bold text-lg">{order.orderNumber}</span> in
                  the memo.
                </p>
              </div>
            )}
            {order.paymentMethod === 'BITCOIN' && (
              <div>
                <p className="text-purple-600 dark:text-purple-400 font-semibold mb-2">Bitcoin Payment:</p>
                <p className="text-neon-teal dark:text-teal-400 font-mono break-all mb-4 bg-white dark:bg-gray-800 p-3 rounded border border-purple-200 dark:border-purple-700">
                  {paymentSettings.bitcoin}
                </p>
                {paymentSettings.bitcoinQr && (
                  <div className="mb-4">
                    <img
                      src={paymentSettings.bitcoinQr}
                      alt="Bitcoin QR Code"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                )}
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Please send exactly <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">${order.totalAmount.toFixed(2)}</span>{' '}
                  worth of Bitcoin to the address above.
                </p>
              </div>
            )}
            {order.paymentMethod === 'CASHAPP' && (
              <div>
                <p className="text-purple-600 dark:text-purple-400 font-semibold mb-2">Cash App Payment:</p>
                <p className="text-neon-teal dark:text-teal-400 font-semibold text-2xl mb-4">
                  {paymentSettings.cashapp}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Please send <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">${order.totalAmount.toFixed(2)}</span> to the
                  Cash App tag above and include order number{' '}
                  <span className="font-mono text-purple-600 dark:text-purple-400 font-bold text-lg">{order.orderNumber}</span> in the memo.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="text-center">
          <Link
            href="/store"
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-700 dark:to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:hover:from-purple-600 dark:hover:to-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}


