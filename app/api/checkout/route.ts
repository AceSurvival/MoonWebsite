import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '@/lib/email'
import { encryptData } from '@/lib/encryption'
import { rateLimit, sanitizeInput, validateEmail, validatePhone, addSecurityHeaders } from '@/lib/security'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = rateLimit(request, 5, 60000) // 5 requests per minute
    if (!rateLimitResult.allowed) {
      return addSecurityHeaders(
        NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        )
      )
    }
    
    const body = await request.json()
    
    // Input validation and sanitization
    try {
      if (body.name) body.name = sanitizeInput(body.name, 100)
      if (body.email) {
        if (!validateEmail(body.email)) {
          return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
        }
      }
      if (body.phone && body.phone.trim()) {
        if (!validatePhone(body.phone)) {
          return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
        }
      }
      if (body.address) body.address = sanitizeInput(body.address, 200)
      if (body.city) body.city = sanitizeInput(body.city, 100)
      if (body.state) body.state = sanitizeInput(body.state, 50)
      if (body.postalCode) body.postalCode = sanitizeInput(body.postalCode, 20)
      if (body.country) body.country = sanitizeInput(body.country, 100)
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Invalid input' }, { status: 400 })
    }
    
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      postalCode,
      country,
      billingAddress,
      items,
      paymentMethod,
      shippingMethod,
      orderNotes,
      discountCode,
      total,
      subtotal,
      discountAmount,
      taxAmount,
      shippingAmount,
      newsletterSubscribed,
    } = body

    if (!name || !email || !address || !city || !state || !postalCode || !country) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 })
    }

    // Verify products exist and get current prices
    const productIds = items.map((item: any) => item.id)
    let products
    try {
      products = await prisma.product.findMany({
        where: { id: { in: productIds }, active: true },
      })
    } catch (error: any) {
      console.error('Database connection error:', error)
      if (error.message?.includes('db.prisma.io') || error.message?.includes("Can't reach database")) {
        return NextResponse.json(
          { 
            error: 'Database connection failed. Please check your DATABASE_URL environment variable.',
            details: 'The database server is not accessible. Please verify your connection string in Vercel Environment Variables.'
          },
          { status: 503 }
        )
      }
      throw error
    }

    if (products.length !== items.length) {
      return NextResponse.json({ error: 'Some products are no longer available' }, { status: 400 })
    }

    // Check stock availability (allow backorders if stock is 0 or null)
    for (const item of items) {
      const product = products.find((p) => p.id === item.id)
      if (!product) continue
      
      // If product has stock tracking (stock is not null)
      if (product.stock !== null && product.stock < item.quantity && product.stock > 0) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}` },
          { status: 400 }
        )
      }
      // If stock is 0 or null, allow backorder (no error)
    }

    // Handle discount code
    let discountCodeId = null
    let creatorCodeId = null
    let creatorCode = null

    if (discountCode) {
      const code = await prisma.discountCode.findUnique({
        where: { code: discountCode.toUpperCase() },
      })
      if (code && code.active) {
        // Check if code has expired
        if (!code.expiryDate || new Date(code.expiryDate) >= new Date()) {
          discountCodeId = code.id
        }
      }
      
      // If not a valid discount code, check if it's a creator code
      if (!discountCodeId) {
        const creator = await prisma.creatorCode.findUnique({
          where: { code: discountCode.toUpperCase() },
        })
        if (creator && creator.active) {
          creatorCodeId = creator.id
          creatorCode = creator
        }
      }
    }

    // Use the price the customer saw (cart/sale price) so store sales and discounts are reflected
    const effectivePrice = (item: any) => {
      const product = products.find((p: any) => p.id === item.id)
      const cartPrice = typeof item.price === 'number' && item.price >= 0 ? item.price : null
      return cartPrice ?? product?.price ?? 0
    }

    // Apply 10% Bitcoin discount
    let bitcoinDiscountAmount = 0
    if (paymentMethod === 'BITCOIN') {
      const baseSubtotalForBtc = items.reduce((sum: number, item: any) => sum + effectivePrice(item) * item.quantity, 0)
      bitcoinDiscountAmount = (baseSubtotalForBtc * 10) / 100
    }

    // Subtotal from cart/sale prices (what the customer saw), then we apply discount code + Bitcoin
    const baseSubtotal = items.reduce((sum: number, item: any) => sum + effectivePrice(item) * item.quantity, 0)
    
    // Get tax rate from settings if needed
    let taxRateValue = 0
    if (state?.toUpperCase() === 'CA') {
      const taxSetting = await prisma.setting.findUnique({
        where: { key: 'tax_rate' },
      })
      if (taxSetting) {
        taxRateValue = parseFloat(taxSetting.value) || 0
      }
    }
    
    // Apply discount code discount first (if any)
    let codeDiscountAmount = 0
    if (discountCodeId) {
      const code = await prisma.discountCode.findUnique({
        where: { id: discountCodeId },
      })
      if (code) {
        if (code.discountType === 'PERCENTAGE' && code.discountPercent) {
          codeDiscountAmount = (baseSubtotal * code.discountPercent) / 100
        } else if (code.discountType === 'FIXED_AMOUNT' && code.discountAmount) {
          codeDiscountAmount = Math.min(code.discountAmount, baseSubtotal)
        }
      }
    }
    
    // Apply creator code discount if used
    if (creatorCode) {
      codeDiscountAmount = (baseSubtotal * creatorCode.discountPercent) / 100
    }
    
    // Apply Bitcoin discount (10% off base subtotal)
    if (paymentMethod === 'BITCOIN') {
      bitcoinDiscountAmount = (baseSubtotal * 10) / 100
    }
    
    // Calculate final subtotal after all discounts
    const finalSubtotal = baseSubtotal - codeDiscountAmount - bitcoinDiscountAmount
    
    // Recalculate tax on discounted subtotal (for CA)
    let finalTaxAmount = 0
    if (state?.toUpperCase() === 'CA' && taxRateValue > 0) {
      // Tax should be calculated on the discounted subtotal
      finalTaxAmount = (finalSubtotal * taxRateValue) / 100
    }
    
    // Calculate final total
    const finalTotal = finalSubtotal + finalTaxAmount + (shippingAmount || 0)
    
    // Encrypt sensitive customer data before storing
    const encryptedEmail = encryptData(email)
    const encryptedPhone = phone ? encryptData(phone) : null
    
    // Encrypt shipping address
    const shippingAddressData = {
      address: encryptData(address),
      city: encryptData(city),
      state: encryptData(state),
      postalCode: encryptData(postalCode),
      country: encryptData(country),
    }
    const shippingAddress = JSON.stringify(shippingAddressData)
    
    // Encrypt billing address if provided
    const billingAddressJson = billingAddress ? JSON.stringify({
      address: encryptData(billingAddress.address),
      city: encryptData(billingAddress.city),
      state: encryptData(billingAddress.state),
      postalCode: encryptData(billingAddress.postalCode),
      country: encryptData(billingAddress.country),
    }) : null

    // Create order with retry logic for order number uniqueness
    let order
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      try {
        const orderNumber = await generateOrderNumber()
        // Create order with all fields including tax and shipping
        order = await prisma.order.create({
          data: {
            orderNumber,
            customerName: name, // Name is not encrypted as it may be needed for shipping labels
            email: encryptedEmail,
            phone: encryptedPhone,
            paymentMethod,
            shippingMethod: shippingMethod || null,
            orderNotes: orderNotes || null,
            totalAmount: finalTotal,
            subtotalAmount: baseSubtotal,
            taxAmount: finalTaxAmount,
            shippingAmount: shippingAmount || 0,
            discountAmount: codeDiscountAmount + bitcoinDiscountAmount, // Combined discount amount
            discountCodeId,
            shippingAddress,
            billingAddress: billingAddressJson,
            items: {
              create: items.map((item: any) => ({
                productId: item.id,
                quantity: item.quantity,
                unitPrice: effectivePrice(item),
              })),
            },
          },
        })
        
        break // Success, exit loop
      } catch (error: any) {
        // If it's a unique constraint error on orderNumber, retry
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
          const target = error.meta?.target
          const isOrderNumberError = Array.isArray(target) 
            ? target.includes('orderNumber')
            : typeof target === 'string' && target.includes('orderNumber')
          
          if (isOrderNumberError) {
            attempts++
            if (attempts >= maxAttempts) {
              throw new Error('Failed to generate unique order number after multiple attempts')
            }
            // Wait a small random amount before retrying to avoid collisions
            await new Promise((resolve) => setTimeout(resolve, Math.random() * 100))
            continue
          }
        }
        // If it's a different error, throw it
        throw error
      }
    }

    if (!order) {
      throw new Error('Failed to create order')
    }

    // Note: Stock will be reduced when order status is changed to PAID

    // If discount code was used, update its usage stats
    // Note: Revenue will be updated when order status changes to PAID
    if (discountCodeId) {
      await prisma.discountCode.update({
        where: { id: discountCodeId },
        data: {
          uses: {
            increment: 1,
          },
          // Revenue will be updated when order is marked as PAID
        },
      })
    }

    // If creator code was used, create usage record
    if (creatorCodeId && creatorCode) {
      const revenueAmount = (total * creatorCode.discountPercent) / 100
      await prisma.creatorCodeUsage.create({
        data: {
          creatorCodeId,
          orderId: order.id,
          revenueAmount,
        },
      })
    }

    // Build admin notification payload once (used for send + retry)
    const adminNotificationPayload = {
      orderNumber: order.orderNumber,
      customerName: name,
      email,
      phone: phone || 'Not provided',
      totalAmount: finalTotal,
      subtotalAmount: baseSubtotal,
      discountAmount: codeDiscountAmount + bitcoinDiscountAmount,
      taxAmount: finalTaxAmount,
      shippingAmount: shippingAmount || 0,
      shippingMethod: shippingMethod || 'Not specified',
      paymentMethod,
      orderNotes: orderNotes || 'None',
      items: items.map((item: any) => {
        const product = products.find((p) => p.id === item.id)
        return {
          name: product?.name || item.name,
          quantity: item.quantity,
          unitPrice: effectivePrice(item),
        }
      }),
      shippingAddress: {
        address,
        city,
        state,
        postalCode,
        country,
      },
      billingAddress: billingAddress || null,
    }

    // Send admin notification first so you always get notified (with one retry on failure)
    try {
      let adminResult = await sendAdminOrderNotification(adminNotificationPayload)
      if (!adminResult.success && adminResult.error) {
        console.warn('Admin order notification failed, retrying in 2s:', adminResult.error)
        await new Promise((r) => setTimeout(r, 2000))
        adminResult = await sendAdminOrderNotification(adminNotificationPayload)
      }
      if (!adminResult.success) {
        console.error('Admin order notification failed (after retry). Check ADMIN_EMAIL or contact_email setting and Resend config.')
      }
    } catch (emailError) {
      console.error('Failed to send admin order notification email:', emailError)
    }

    // Send order confirmation email to customer (don't fail if email fails)
    try {
      await sendOrderConfirmationEmail({
        orderNumber: order.orderNumber,
        customerName: name,
        email,
        totalAmount: finalTotal,
        subtotalAmount: baseSubtotal,
        discountAmount: codeDiscountAmount + bitcoinDiscountAmount,
        shippingAmount: shippingAmount || 0,
        taxAmount: finalTaxAmount,
        items: adminNotificationPayload.items,
        paymentMethod,
        shippingAddress: adminNotificationPayload.shippingAddress,
        billingAddress: adminNotificationPayload.billingAddress,
        orderDate: order.createdAt.toISOString(),
      })
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError)
    }

    // Save newsletter subscription if opted in
    if (newsletterSubscribed) {
      try {
        await prisma.newsletterSubscription.upsert({
          where: { email: encryptedEmail },
          update: { subscribed: true },
          create: {
            email: encryptedEmail,
            subscribed: true,
          },
        })
      } catch (subError) {
        console.error('Failed to save newsletter subscription:', subError)
        // Continue even if subscription save fails
      }
    }

    return addSecurityHeaders(
      NextResponse.json({ orderNumber: order.orderNumber })
    )
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Internal server error', message: String(error) }, { status: 500 })
  }
}


