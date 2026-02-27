'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Order {
  id: string
  orderNumber: string
  customerName: string
  email: string
  phone?: string | null
  paymentMethod: string
  status: string
  totalAmount: number
  createdAt: string
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    // Filter orders based on search query
    if (!searchQuery.trim()) {
      setOrders(allOrders)
      return
    }

    const query = searchQuery.toLowerCase().trim()
    const filtered = allOrders.filter((order) => {
      const orderNumberMatch = order.orderNumber.toLowerCase().includes(query)
      const nameMatch = order.customerName.toLowerCase().includes(query)
      const emailMatch = order.email?.toLowerCase().includes(query)
      const phoneMatch = order.phone?.toLowerCase().includes(query)
      return orderNumberMatch || nameMatch || emailMatch || phoneMatch
    })
    setOrders(filtered)
  }, [searchQuery, allOrders])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders')
      if (res.ok) {
        const data = await res.json()
        setAllOrders(data)
        setOrders(data)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold gradient-text">Orders</h1>
      </div>

      {/* Search Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order number, name, email, or phone..."
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 sm:px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Found {orders.length} {orders.length === 1 ? 'order' : 'orders'} matching "{searchQuery}"
            </p>
          )}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery ? `No orders found matching "${searchQuery}"` : 'No orders yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Order #
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Customer
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase hidden md:table-cell">
                  Payment
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Total
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase hidden lg:table-cell">
                  Date
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-900 dark:text-gray-100 font-mono text-xs sm:text-sm">{order.orderNumber}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div>
                      <p className="text-gray-900 dark:text-gray-100 font-semibold text-sm sm:text-base">{order.customerName}</p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">{order.email}</p>
                      {order.phone && (
                        <p className="text-gray-500 dark:text-gray-500 text-xs">Phone: {order.phone}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-700 dark:text-gray-300 text-xs sm:text-sm hidden md:table-cell">{order.paymentMethod}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                        order.status === 'PAID'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : order.status === 'SHIPPED'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : order.status === 'CANCELED'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-purple-600 dark:text-purple-400 font-semibold text-sm sm:text-base">
                    ${order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-600 dark:text-gray-400 text-xs sm:text-sm hidden lg:table-cell">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="px-2 sm:px-3 py-1 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs sm:text-sm rounded transition-colors whitespace-nowrap"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


