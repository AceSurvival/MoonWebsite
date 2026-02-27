import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encryptData } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

// Track abandoned cart when user enters email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, cartItems } = body

    if (!email || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Email and cart items required' }, { status: 400 })
    }

    // Encrypt email
    const encryptedEmail = encryptData(email)
    
    // Store or update abandoned cart record
    const cartData = JSON.stringify(cartItems)
    const timestamp = new Date()

    // Check if abandoned cart already exists for this email
    const existing = await prisma.setting.findUnique({
      where: { key: `abandoned_cart_${encryptedEmail}` },
    })

    if (existing) {
      // Update existing
      await prisma.setting.update({
        where: { key: `abandoned_cart_${encryptedEmail}` },
        data: {
          value: JSON.stringify({
            email: encryptedEmail,
            cartItems,
            timestamp: timestamp.toISOString(),
            emailSent: false,
          }),
        },
      })
    } else {
      // Create new
      await prisma.setting.create({
        data: {
          key: `abandoned_cart_${encryptedEmail}`,
          value: JSON.stringify({
            email: encryptedEmail,
            cartItems,
            timestamp: timestamp.toISOString(),
            emailSent: false,
          }),
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking abandoned cart:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Process abandoned carts and send emails (called by cron job or manually)
export async function GET(request: NextRequest) {
  try {
    // Get all abandoned cart settings
    const abandonedCarts = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'abandoned_cart_',
        },
      },
    })

    const now = new Date()
    const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000)
    
    const cartsToProcess = abandonedCarts
      .map(setting => {
        try {
          const data = JSON.parse(setting.value)
          const cartTimestamp = new Date(data.timestamp)
          
          if (!data.emailSent && cartTimestamp <= twentyMinutesAgo) {
            return { ...data, key: setting.key }
          }
        } catch (error) {
          console.error('Error parsing abandoned cart:', error)
        }
        return null
      })
      .filter(Boolean)

    return NextResponse.json({
      cartsToProcess: cartsToProcess.length,
      carts: cartsToProcess,
    })
  } catch (error) {
    console.error('Error fetching abandoned carts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
