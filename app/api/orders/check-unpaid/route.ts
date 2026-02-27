import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPaymentReminderEmail, sendOrderStatusUpdateEmail } from '@/lib/email'
import { decryptData } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

// Check for unpaid orders and send payment reminders
// Can be called via GET (cron job) or POST (manual)
export async function GET(request: NextRequest) {
  return await checkUnpaidOrders()
}

export async function POST(request: NextRequest) {
  return await checkUnpaidOrders()
}

async function checkUnpaidOrders() {
  try {
    const now = new Date()
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000) // 12 hours ago
    const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000) // 72 hours ago
    
    // Step 1: Cancel orders older than 72 hours
    const ordersToCancel = await prisma.order.findMany({
      where: {
        status: 'PENDING_PAYMENT',
        createdAt: {
          lt: seventyTwoHoursAgo, // Older than 72 hours
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })
    
    const cancelled = []
    const cancelErrors = []
    
    for (const order of ordersToCancel) {
      try {
        // Update order status to CANCELED
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'CANCELED' },
        })
        
        // Send cancellation email
        try {
          const decryptedEmail = order.email ? decryptData(order.email) : order.email
          
          // Decrypt shipping address
          let shippingAddress = undefined
          if (order.shippingAddress) {
            try {
              const addr = JSON.parse(order.shippingAddress)
              shippingAddress = {
                address: decryptData(addr.address),
                city: decryptData(addr.city),
                state: decryptData(addr.state),
                postalCode: decryptData(addr.postalCode),
                country: decryptData(addr.country),
              }
            } catch (e) {
              console.error('Error parsing shipping address:', e)
            }
          }
          
          // Decrypt billing address
          let billingAddress = null
          if (order.billingAddress) {
            try {
              const addr = JSON.parse(order.billingAddress)
              billingAddress = {
                address: decryptData(addr.address),
                city: decryptData(addr.city),
                state: decryptData(addr.state),
                postalCode: decryptData(addr.postalCode),
                country: decryptData(addr.country),
              }
            } catch (e) {
              console.error('Error parsing billing address:', e)
            }
          }
          
          await sendOrderStatusUpdateEmail({
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            email: decryptedEmail,
            status: 'CANCELED',
            items: order.items.map(item => ({
              name: item.product.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
            subtotalAmount: order.subtotalAmount || undefined,
            discountAmount: order.discountAmount || undefined,
            shippingAmount: order.shippingAmount || undefined,
            taxAmount: order.taxAmount || undefined,
            totalAmount: order.totalAmount || undefined,
            paymentMethod: order.paymentMethod || undefined,
            shippingAddress: shippingAddress,
            billingAddress: billingAddress,
            orderDate: order.createdAt.toISOString(),
          })
        } catch (emailError) {
          console.error(`Failed to send cancellation email for order ${order.orderNumber}:`, emailError)
          // Continue even if email fails
        }
        
        cancelled.push({
          orderNumber: order.orderNumber,
          email: order.email,
        })
      } catch (error: any) {
        console.error(`Error cancelling order ${order.orderNumber}:`, error)
        cancelErrors.push({
          orderNumber: order.orderNumber,
          email: order.email,
          error: error.message || 'Unknown error',
        })
      }
    }
    
    // Step 2: Send payment reminders only at 24h (1st), 48h (2nd), 70h (3rd = final warning)
    const unpaidOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING_PAYMENT',
        createdAt: {
          gte: seventyTwoHoursAgo, // Not older than 72 hours (not yet cancelled)
          lte: twelveHoursAgo,     // At least 12 hours old (no reminder before 12h)
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
    
    const processed = []
    const errors = []
    
    for (const order of unpaidOrders) {
      try {
        const hoursSinceOrder = (now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60)
        const hoursRemaining = Math.max(0, 72 - hoursSinceOrder)
        const count = (order as { paymentReminderCount?: number }).paymentReminderCount ?? 0
        
        // Send only: 1st at >= 24h, 2nd at >= 48h, 3rd at >= 70h (2h before cancel)
        const shouldSend24 = hoursSinceOrder >= 24 && count === 0
        const shouldSend48 = hoursSinceOrder >= 48 && count === 1
        const shouldSend70 = hoursSinceOrder >= 70 && count === 2
        
        if (!shouldSend24 && !shouldSend48 && !shouldSend70) continue
        
        const decryptedEmail = order.email ? decryptData(order.email) : order.email
        
        const result = await sendPaymentReminderEmail({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          email: decryptedEmail,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          orderDate: order.createdAt.toISOString(),
          hoursRemaining,
        })
        
        if (result.success) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentReminderCount: count + 1,
              lastPaymentReminderAt: new Date(),
            },
          })
          processed.push({
            orderNumber: order.orderNumber,
            email: decryptedEmail,
            reminderNumber: count + 1,
            hoursRemaining: Math.round(hoursRemaining),
          })
        } else {
          errors.push({
            orderNumber: order.orderNumber,
            email: decryptedEmail,
            error: result.error,
          })
        }
      } catch (error: any) {
        console.error(`Error processing order ${order.orderNumber}:`, error)
        errors.push({
          orderNumber: order.orderNumber,
          email: order.email,
          error: error.message || 'Unknown error',
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      cancelled: {
        count: cancelled.length,
        orders: cancelled,
        errors: cancelErrors,
      },
      reminders: {
        checked: unpaidOrders.length,
        processed: processed.length,
        errors: errors.length,
        orders: processed,
        errorDetails: errors,
      },
    })
  } catch (error: any) {
    console.error('Error checking unpaid orders:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
