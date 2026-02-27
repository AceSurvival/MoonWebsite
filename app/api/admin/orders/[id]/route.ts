import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendOrderStatusUpdateEmail, sendPaymentReminderEmail } from '@/lib/email'
import { decryptData } from '@/lib/encryption'

// Force dynamic rendering - this route requires authentication and database access
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request)
    const order = await prisma.order.findUnique({
      where: { id: params.id },
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
    
    // Decrypt sensitive customer data before returning
    const decryptedOrder = {
      ...order,
      email: order.email ? decryptData(order.email) : order.email,
      phone: order.phone ? decryptData(order.phone) : order.phone,
      shippingProvider: order.shippingProvider,
      shippingAddress: order.shippingAddress ? (() => {
        try {
          const addr = JSON.parse(order.shippingAddress)
          return JSON.stringify({
            address: decryptData(addr.address),
            city: decryptData(addr.city),
            state: decryptData(addr.state),
            postalCode: decryptData(addr.postalCode),
            country: decryptData(addr.country),
          })
        } catch {
          return order.shippingAddress
        }
      })() : order.shippingAddress,
      billingAddress: order.billingAddress ? (() => {
        try {
          const addr = JSON.parse(order.billingAddress)
          return JSON.stringify({
            address: decryptData(addr.address),
            city: decryptData(addr.city),
            state: decryptData(addr.state),
            postalCode: decryptData(addr.postalCode),
            country: decryptData(addr.country),
          })
        } catch {
          return order.billingAddress
        }
      })() : order.billingAddress,
    }
    
    return NextResponse.json(decryptedOrder)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request)
    const body = await request.json()
    
    // Get the order with items before updating
    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: { include: { product: true } } },
    })
    
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update order status, tracking number, shipping provider, and admin notes
    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: body.status,
        trackingNumber: body.trackingNumber !== undefined ? body.trackingNumber : undefined,
        shippingProvider: body.shippingProvider !== undefined ? body.shippingProvider : undefined,
        adminNotes: body.adminNotes !== undefined ? body.adminNotes : undefined,
      },
    })

    // If order is being marked as PAID and wasn't PAID before, reduce stock and update discount code revenue
    if (body.status === 'PAID' && existingOrder.status !== 'PAID') {
      for (const item of existingOrder.items) {
        const product = item.product
        // Only reduce stock if product tracks stock (stock is not null)
        if (product.stock !== null) {
          const newStock = product.stock - item.quantity
          // Update stock and auto-set outOfStock if stock becomes 0 or less
          await prisma.product.update({
            where: { id: product.id },
            data: { 
              stock: newStock,
              outOfStock: newStock <= 0
            },
          })
        }
      }
      
      // Update discount code revenue when order is marked as PAID
      if (existingOrder.discountCodeId) {
        await prisma.discountCode.update({
          where: { id: existingOrder.discountCodeId },
          data: {
            revenueGenerated: {
              increment: existingOrder.totalAmount,
            },
          },
        })
      }
    }
    
    // If order is being changed from PAID to another status, subtract revenue from discount code
    if (existingOrder.status === 'PAID' && body.status !== 'PAID' && existingOrder.discountCodeId) {
      await prisma.discountCode.update({
        where: { id: existingOrder.discountCodeId },
        data: {
          revenueGenerated: {
            decrement: existingOrder.totalAmount,
          },
        },
      })
    }

    // Send email notification if status changed (don't fail if email fails)
    if (body.status !== existingOrder.status) {
      try {
        // Decrypt email and addresses before sending
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
          status: order.status,
          trackingNumber: order.trackingNumber || undefined,
          shippingProvider: order.shippingProvider || undefined,
          shippingMethod: order.shippingMethod || undefined,
          items: existingOrder.items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          subtotalAmount: existingOrder.subtotalAmount || undefined,
          discountAmount: existingOrder.discountAmount || undefined,
          shippingAmount: existingOrder.shippingAmount || undefined,
          taxAmount: existingOrder.taxAmount || undefined,
          totalAmount: existingOrder.totalAmount || undefined,
          paymentMethod: existingOrder.paymentMethod || undefined,
          shippingAddress: shippingAddress,
          billingAddress: billingAddress,
          orderDate: existingOrder.createdAt.toISOString(),
        })
      } catch (emailError) {
        console.error('Failed to send order status update email:', emailError)
        // Continue even if email fails - order is still updated
      }
    }

    return NextResponse.json(order)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Send payment reminder for a specific order
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request)
    const body = await request.json()
    
    // Only allow sending payment reminders
    if (body.action !== 'send-payment-reminder') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
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
    
    // Only send reminder for pending payment orders
    if (order.status !== 'PENDING_PAYMENT') {
      return NextResponse.json(
        { error: 'Payment reminders can only be sent for orders with PENDING_PAYMENT status' },
        { status: 400 }
      )
    }
    
    // Decrypt email
    const decryptedEmail = order.email ? decryptData(order.email) : order.email
    
    // Calculate hours remaining until 72 hours
    const now = new Date()
    const hoursSinceOrder = (now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60)
    const hoursRemaining = Math.max(0, 72 - hoursSinceOrder)
    
    // Send payment reminder email
    const result = await sendPaymentReminderEmail({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      email: decryptedEmail,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      orderDate: order.createdAt.toISOString(),
      hoursRemaining: hoursRemaining,
    })
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Payment reminder email sent successfully',
        emailId: result.data?.id,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send payment reminder email',
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error sending payment reminder:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


