import { prisma } from '@/lib/prisma'
import Link from 'next/link'

// Force dynamic rendering - this page requires database access
export const dynamic = 'force-dynamic'

async function getStats() {
  const [products, orders, discountCodes, creatorCodes] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.discountCode.findMany({
      include: {
        orders: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            discountAmount: true,
          },
        },
      },
    }),
    prisma.creatorCode.findMany({
      include: {
        usages: {
          include: {
            order: true,
          },
        },
      },
    }),
  ])

  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
    },
  })

  return { products, orders, discountCodes, creatorCodes, recentOrders }
}

type Stats = Awaited<ReturnType<typeof getStats>>

export default async function AdminDashboard() {
  let products = 0
  let orders = 0
  let discountCodes: Stats['discountCodes'] = []
  let creatorCodes: Stats['creatorCodes'] = []
  let recentOrders: Stats['recentOrders'] = []
  let dbError: string | null = null

  try {
    const stats = await getStats()
    products = stats.products
    orders = stats.orders
    discountCodes = stats.discountCodes
    creatorCodes = stats.creatorCodes
    recentOrders = stats.recentOrders
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    dbError = message
    console.error('Admin dashboard getStats failed:', err)
  }

  if (dbError) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 gradient-text">Dashboard</h1>
        <div className="bg-amber-900/30 border border-amber-600/50 text-amber-200 p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-2">Database connection error</h2>
          <p className="text-sm mb-4">The dashboard could not load. This usually means:</p>
          <ul className="list-disc list-inside text-sm space-y-1 mb-4">
            <li><strong>DATABASE_URL</strong> is not set in Vercel (Settings → Environment Variables → add for Production).</li>
            <li>Database URL is wrong or the database is not reachable.</li>
            <li>Tables are missing — run <code className="bg-black/30 px-1 rounded">npx prisma db push</code> or migrations against your production DB.</li>
          </ul>
          <p className="text-xs text-amber-300/80 font-mono break-all">Error: {dbError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 gradient-text">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm">
          <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Products</h3>
          <p className="text-3xl font-bold gradient-text">{products}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm">
          <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Orders</h3>
          <p className="text-3xl font-bold gradient-text">{orders}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm">
          <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-2">Discount Codes</h3>
          <p className="text-3xl font-bold gradient-text">{discountCodes.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm">
          <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-2">Creator Codes</h3>
          <p className="text-3xl font-bold gradient-text">{creatorCodes.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm">
          <h2 className="text-xl font-bold mb-4 gradient-text">Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-purple-50 dark:hover:bg-gray-700/50 transition-colors border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-900 dark:text-gray-100 font-semibold">{order.orderNumber}</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-purple-600 dark:text-purple-400 font-semibold">${order.totalAmount.toFixed(2)}</p>
                      <p
                        className={`text-xs ${
                          order.status === 'PAID'
                            ? 'text-green-600 dark:text-green-400'
                            : order.status === 'SHIPPED'
                            ? 'text-blue-600 dark:text-blue-400'
                            : order.status === 'CANCELED'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`}
                      >
                        {order.status}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link
            href="/admin/orders"
            className="block mt-4 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm text-center font-semibold"
          >
            View All Orders →
          </Link>
        </div>

        {/* Discount Codes */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm">
          <h2 className="text-xl font-bold mb-4 gradient-text">Discount Codes</h2>
          {discountCodes.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No discount codes yet.</p>
          ) : (
            <div className="space-y-3">
              {discountCodes.map((code) => (
                <div key={code.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-900 dark:text-gray-100 font-semibold">{code.code}</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{code.discountPercent}% off</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {code.orders.length} {code.orders.length === 1 ? 'use' : 'uses'}
                      </p>
                      <p
                        className={`text-xs ${code.active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                      >
                        {code.active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Creator Codes */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-bold mb-4 gradient-text">Creator Codes</h2>
          {creatorCodes.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No creator codes yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creatorCodes.map((code) => {
                // Only count revenue from PAID orders
                const totalRevenue = code.usages
                  .filter((usage) => usage.order.status === 'PAID')
                  .reduce((sum, usage) => sum + usage.revenueAmount, 0)
                const paidUsages = code.usages.filter((usage) => usage.order.status === 'PAID').length
                return (
                  <div key={code.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-gray-900 dark:text-gray-100 font-semibold">{code.code}</p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{code.discountPercent}% off</p>
                      </div>
                      <p
                        className={`text-xs ${code.active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                      >
                        {code.active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                      <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Total Revenue Generated (Paid Only)</p>
                      <p className="text-neon-teal font-bold text-lg">${totalRevenue.toFixed(2)}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                        {paidUsages} {paidUsages === 1 ? 'paid order' : 'paid orders'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


