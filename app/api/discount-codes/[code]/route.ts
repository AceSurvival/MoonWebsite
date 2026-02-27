import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.toUpperCase()
    
    // First check if it's a discount code
    const discountCode = await prisma.discountCode.findUnique({
      where: { code },
    })

    if (discountCode && discountCode.active) {
      // Check if code has expired
      if (discountCode.expiryDate && new Date(discountCode.expiryDate) < new Date()) {
        const errorResponse = NextResponse.json({ error: 'Discount code has expired' }, { status: 404 })
        errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        return errorResponse
      }

      const response = NextResponse.json({
        discountType: discountCode.discountType,
        discountPercent: discountCode.discountPercent,
        discountAmount: discountCode.discountAmount,
        type: 'discount',
      })
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      return response
    }

    // If not a discount code, check if it's a creator code
    const creatorCode = await prisma.creatorCode.findUnique({
      where: { code },
    })

    if (creatorCode && creatorCode.active) {
    const response = NextResponse.json({
      discountPercent: creatorCode.discountPercent,
      type: 'creator',
    })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return response
    }

    const errorResponse = NextResponse.json({ error: 'Invalid promo code' }, { status: 404 })
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return errorResponse
  } catch (error) {
    console.error('Error fetching promo code:', error)
    const errorResponse = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return errorResponse
  }
}


