import { prisma } from '@/lib/prisma'
import Link from 'next/link'

// Force dynamic rendering - this page requires database access
export const dynamic = 'force-dynamic'

async function getStatistics() {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Get all paid orders
  const allPaidOrders = await prisma.order.findMany({
    where: {
      status: 'PAID',
    },
    include: {
      items: true,
    },
  })

  // YTD calculations
  const ytdOrders = allPaidOrders.filter(
    (order) => new Date(order.createdAt) >= startOfYear
  )
  const ytdRevenue = ytdOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  const ytdOrdersCount = ytdOrders.length

  // Current month calculations
  const monthOrders = allPaidOrders.filter(
    (order) => new Date(order.createdAt) >= startOfMonth
  )
  const monthRevenue = monthOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  const monthOrdersCount = monthOrders.length

  // All-time calculations
  const allTimeRevenue = allPaidOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  const allTimeOrdersCount = allPaidOrders.length

  // Month-by-month breakdown for current year
  const monthlyData: Array<{
    month: string
    revenue: number
    orders: number
  }> = []

  for (let i = 0; i < 12; i++) {
    const monthStart = new Date(now.getFullYear(), i, 1)
    const monthEnd = new Date(now.getFullYear(), i + 1, 0, 23, 59, 59)
    const monthOrders = allPaidOrders.filter(
      (order) =>
        new Date(order.createdAt) >= monthStart && new Date(order.createdAt) <= monthEnd
    )
    const monthRevenue = monthOrders.reduce((sum, order) => sum + order.totalAmount, 0)

    monthlyData.push({
      month: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      revenue: monthRevenue,
      orders: monthOrders.length,
    })
  }

  // Average order value
  const avgOrderValue =
    allTimeOrdersCount > 0 ? allTimeRevenue / allTimeOrdersCount : 0

  // Top selling products (by quantity in paid orders)
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
  
  allPaidOrders.forEach((order) => {
    order.items.forEach((item) => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          name: `Product ${item.productId}`,
          quantity: 0,
          revenue: 0,
        }
      }
      productSales[item.productId].quantity += item.quantity
      productSales[item.productId].revenue += item.unitPrice * item.quantity
    })
  })

  // Get product names
  const productIds = Object.keys(productSales)
  if (productIds.length > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    })

    products.forEach((product) => {
      if (productSales[product.id]) {
        productSales[product.id].name = product.name
      }
    })
  }

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)

  return {
    ytdRevenue,
    ytdOrdersCount,
    monthRevenue,
    monthOrdersCount,
    allTimeRevenue,
    allTimeOrdersCount,
    avgOrderValue,
    monthlyData,
    topProducts,
  }
}

export default async function StatisticsPage() {
  const stats = await getStatistics()

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold gradient-text">Statistics</h1>
        <Link
          href="/admin"
          className="px-6 py-3 glass border border-purple-500/30 dark:border-purple-700/30 hover:border-purple-500 dark:hover:border-purple-500 text-gray-900 dark:text-gray-100 font-semibold rounded-lg transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass p-6 rounded-lg border border-purple-500/20 dark:border-purple-700/20">
          <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-2">YTD Revenue</h3>
          <p className="text-3xl font-bold gradient-text">${stats.ytdRevenue.toFixed(2)}</p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{stats.ytdOrdersCount} orders</p>
        </div>
        <div className="glass p-6 rounded-lg border border-purple-500/20 dark:border-purple-700/20">
          <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-2">This Month Revenue</h3>
          <p className="text-3xl font-bold gradient-text">${stats.monthRevenue.toFixed(2)}</p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{stats.monthOrdersCount} orders</p>
        </div>
        <div className="glass p-6 rounded-lg border border-purple-500/20 dark:border-purple-700/20">
          <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-2">All-Time Revenue</h3>
          <p className="text-3xl font-bold gradient-text">${stats.allTimeRevenue.toFixed(2)}</p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{stats.allTimeOrdersCount} orders</p>
        </div>
        <div className="glass p-6 rounded-lg border border-purple-500/20 dark:border-purple-700/20">
          <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-2">Average Order Value</h3>
          <p className="text-3xl font-bold gradient-text">${stats.avgOrderValue.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Breakdown */}
        <div className="glass p-6 rounded-lg border border-purple-500/20 dark:border-purple-700/20">
          <h2 className="text-xl font-bold mb-4 gradient-text">Monthly Breakdown (Current Year)</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stats.monthlyData.map((month, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg border border-purple-500/10 dark:border-purple-700/10"
              >
                <div>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold">{month.month}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{month.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="text-purple-600 dark:text-purple-400 font-bold">${month.revenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="glass p-6 rounded-lg border border-purple-500/20 dark:border-purple-700/20">
          <h2 className="text-xl font-bold mb-4 gradient-text">Top Selling Products</h2>
          {stats.topProducts.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No sales yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats.topProducts.map((product, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg border border-purple-500/10 dark:border-purple-700/10"
                >
                  <div>
                    <p className="text-gray-900 dark:text-gray-100 font-semibold">{product.name}</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{product.quantity} units sold</p>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-600 dark:text-purple-400 font-bold">${product.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

