import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decryptData } from '@/lib/encryption'

// Force dynamic rendering - this route requires authentication and database access
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    })
    
    // Decrypt sensitive customer data before returning
    const decryptedOrders = orders.map(order => {
      try {
        const decryptedEmail = order.email ? decryptData(order.email) : order.email
        const decryptedPhone = order.phone ? decryptData(order.phone) : order.phone
        
        // Check if decryption actually worked (email should look like an email, not base64)
        if (decryptedEmail && decryptedEmail.length > 50 && !decryptedEmail.includes('@')) {
          console.warn(`⚠️  Order ${order.orderNumber}: Email appears to still be encrypted. Check ENCRYPTION_KEY.`)
        }
        
        return {
          ...order,
          email: decryptedEmail,
          phone: decryptedPhone,
          shippingAddress: order.shippingAddress ? (() => {
            try {
              const addr = JSON.parse(order.shippingAddress)
              const decryptedAddr = {
                address: decryptData(addr.address),
                city: decryptData(addr.city),
                state: decryptData(addr.state),
                postalCode: decryptData(addr.postalCode),
                country: decryptData(addr.country),
              }
              return JSON.stringify(decryptedAddr)
            } catch (error) {
              console.error('Error decrypting shipping address:', error)
              return order.shippingAddress
            }
          })() : order.shippingAddress,
          billingAddress: order.billingAddress ? (() => {
            try {
              const addr = JSON.parse(order.billingAddress)
              const decryptedAddr = {
                address: decryptData(addr.address),
                city: decryptData(addr.city),
                state: decryptData(addr.state),
                postalCode: decryptData(addr.postalCode),
                country: decryptData(addr.country),
              }
              return JSON.stringify(decryptedAddr)
            } catch (error) {
              console.error('Error decrypting billing address:', error)
              return order.billingAddress
            }
          })() : order.billingAddress,
        }
      } catch (error) {
        console.error('Error decrypting order data:', error)
        return order // Return original if decryption fails
      }
    })
    
    return NextResponse.json(decryptedOrders)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
