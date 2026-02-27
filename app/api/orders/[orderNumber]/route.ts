import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decryptData } from '@/lib/encryption'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: params.orderNumber },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Type assertion to access optional fields that may not be in Prisma types yet
    const orderData = order as any

    // Decrypt sensitive customer data
    const decryptedEmail = order.email ? decryptData(order.email) : order.email
    const decryptedShippingAddress = (() => {
      try {
        const addr = JSON.parse(order.shippingAddress)
        return {
          address: decryptData(addr.address),
          city: decryptData(addr.city),
          state: decryptData(addr.state),
          postalCode: decryptData(addr.postalCode),
          country: decryptData(addr.country),
        }
      } catch {
        return JSON.parse(order.shippingAddress)
      }
    })()

    const response = NextResponse.json({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      email: decryptedEmail,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount,
      subtotalAmount: orderData.subtotalAmount ?? order.totalAmount,
      discountAmount: order.discountAmount ?? 0,
      taxAmount: orderData.taxAmount ?? 0,
      shippingAmount: orderData.shippingAmount ?? 0,
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      shippingAddress: decryptedShippingAddress,
    })
    
    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


