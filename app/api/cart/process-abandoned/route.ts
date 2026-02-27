import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decryptData } from '@/lib/encryption'
import { sendAbandonedCartEmail } from '@/lib/email'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Process abandoned carts and send emails with discount codes
// Can be called via POST (manual) or GET (cron job)
export async function GET(request: NextRequest) {
  return await processAbandonedCarts()
}

export async function POST(request: NextRequest) {
  return await processAbandonedCarts()
}

async function processAbandonedCarts() {
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
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000) // 12 hours ago
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    
    const processed = []
    const errors = []

    for (const setting of abandonedCarts) {
      try {
        const data = JSON.parse(setting.value)
        const cartTimestamp = new Date(data.timestamp)
        
        // Skip if already sent
        if (data.emailSent) {
          continue
        }
        
        // Skip if less than 12 hours old
        if (cartTimestamp > twelveHoursAgo) {
          continue
        }
        
        // Skip if email was attempted and failed (to prevent infinite retries)
        // Allow manual retry after 24 hours if needed
        if (data.emailAttempted) {
          const attemptedAt = data.emailAttemptedAt ? new Date(data.emailAttemptedAt) : null
          if (attemptedAt && (now.getTime() - attemptedAt.getTime()) < 24 * 60 * 60 * 1000) {
            continue // Skip if attempted less than 24 hours ago
          }
        }

        // Decrypt email
        const email = decryptData(data.email)
        
        // Check if customer has received an abandoned cart discount code in the last week
        // Only check abandoned cart records that have been sent (emailSent: true)
        let hasRecentCode = false
        for (const otherCart of abandonedCarts) {
          // Skip checking the current cart
          if (otherCart.key === setting.key) {
            continue
          }
          
          try {
            const otherCartData = JSON.parse(otherCart.value)
            
            // Only check carts that have been sent
            if (!otherCartData.emailSent || !otherCartData.sentAt) {
              continue
            }
            
            const otherCartEmail = decryptData(otherCartData.email)
            
            // Check if this is the same customer
            if (otherCartEmail.toLowerCase() === email.toLowerCase()) {
              // Check if they received a code in the last week
              const sentAt = new Date(otherCartData.sentAt)
              if (sentAt > oneWeekAgo) {
                hasRecentCode = true
                break
              }
            }
          } catch (e) {
            // Skip if decryption or parsing fails
            continue
          }
        }
        
        // Skip if customer has received a code in the last week
        if (hasRecentCode) {
          // Clean up this abandoned cart record since they already got a code recently
          await prisma.setting.delete({
            where: { key: setting.key },
          })
          continue
        }
        
        // Check if customer has already checked out (order created after cart timestamp)
        const hasOrdered = await prisma.order.findFirst({
          where: {
            email: {
              // We need to check encrypted emails, so we'll decrypt and compare
              // Since emails are encrypted, we'll check by decrypting each order email
            },
            createdAt: {
              gte: cartTimestamp, // Order created after cart was abandoned
            },
          },
        })
        
        // Check if customer has ordered by decrypting and comparing emails
        // Get all orders created after cart timestamp and check if any match
        const recentOrders = await prisma.order.findMany({
          where: {
            createdAt: {
              gte: cartTimestamp,
            },
          },
          select: {
            email: true,
          },
        })
        
        // Check if any recent order matches this email
        let customerOrdered = false
        for (const order of recentOrders) {
          try {
            const decryptedOrderEmail = decryptData(order.email)
            if (decryptedOrderEmail.toLowerCase() === email.toLowerCase()) {
              customerOrdered = true
              break
            }
          } catch (e) {
            // Skip if decryption fails
            continue
          }
        }
        
        // Skip if customer has already checked out
        if (customerOrdered) {
          // Clean up the abandoned cart record since they've ordered
          await prisma.setting.delete({
            where: { key: setting.key },
          })
          continue
        }
        
        // Check if discount code already exists for this cart (to prevent duplicates)
        let discountCode = data.discountCode
        const discountPercent = 5
        
        // Only create a new discount code if one doesn't exist
        if (!discountCode) {
          // Generate unique discount code
          let codeExists = true
          while (codeExists) {
            discountCode = `CART${crypto.randomBytes(4).toString('hex').toUpperCase()}`
            const existing = await prisma.discountCode.findUnique({
              where: { code: discountCode },
            })
            if (!existing) {
              codeExists = false
            }
          }
          
          // Create discount code in database with 48 hour expiry
          await prisma.discountCode.create({
            data: {
              code: discountCode,
              discountPercent,
              active: true,
              expiryDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
            },
          })
          
          // Store the discount code in the cart data immediately
          await prisma.setting.update({
            where: { key: setting.key },
            data: {
              value: JSON.stringify({
                ...data,
                discountCode,
              }),
            },
          })
        }

        // Send email
        const emailResult = await sendAbandonedCartEmail({
          email,
          customerName: email.split('@')[0], // Use email prefix as name
          cartItems: data.cartItems,
          discountCode,
          discountPercent,
        })

        if (emailResult.success) {
          // Mark as sent
          await prisma.setting.update({
            where: { key: setting.key },
            data: {
              value: JSON.stringify({
                ...data,
                emailSent: true,
                discountCode,
                sentAt: now.toISOString(),
              }),
            },
          })
          processed.push({ email, discountCode })
        } else {
          // Email failed - mark as attempted so we don't keep retrying and creating codes
          // Keep the discount code in case we want to retry manually later
          await prisma.setting.update({
            where: { key: setting.key },
            data: {
              value: JSON.stringify({
                ...data,
                emailAttempted: true,
                emailAttemptedAt: now.toISOString(),
                emailError: emailResult.error,
                discountCode, // Keep the code we created
              }),
            },
          })
          errors.push({ email, error: emailResult.error, discountCode })
        }
      } catch (error: any) {
        console.error('Error processing abandoned cart:', error)
        errors.push({ key: setting.key, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      processed: processed.length,
      errors: errors.length,
      details: {
        processed,
        errors: errors.slice(0, 10), // Limit error details
      },
    })
  } catch (error: any) {
    console.error('Error processing abandoned carts:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
