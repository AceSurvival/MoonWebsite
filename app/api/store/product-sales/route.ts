import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get all paid orders
    const allPaidOrders = await prisma.order.findMany({
      where: {
        status: 'PAID',
      },
      include: {
        items: true,
      },
    })

    // Calculate product sales
    const productSales: Record<string, number> = {}
    
    allPaidOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = 0
        }
        productSales[item.productId] += item.quantity
      })
    })

    const response = NextResponse.json({ productSales })
    
    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching product sales:', error)
    return NextResponse.json({ productSales: {} }, { status: 500 })
  }
}

