import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Calculate distance between two zip codes using a simple approximation
// For production, you'd want to use a proper geocoding API
async function calculateDistance(originZip: string, destZip: string): Promise<number> {
  // This is a simplified calculation - in production, use a geocoding service
  // For now, we'll use a basic approximation based on zip code regions
  try {
    // Extract first 3 digits for region approximation
    const originRegion = parseInt(originZip.substring(0, 3))
    const destRegion = parseInt(destZip.substring(0, 3))
    
    // Rough distance calculation (miles) - this is very approximate
    // In production, use Google Maps API, Mapbox, or similar
    const regionDiff = Math.abs(originRegion - destRegion)
    const baseDistance = regionDiff * 10 // Rough approximation
    
    // Minimum distance
    return Math.max(baseDistance, 5)
  } catch (error) {
    // Fallback to a default distance
    return 50
  }
}

// Calculate shipping cost based on distance
function calculateDistanceShipping(distance: number): number {
  // Base rate
  let cost = 5.0
  
  // Add cost per 50 miles
  const additionalMiles = Math.max(0, distance - 25)
  cost += Math.ceil(additionalMiles / 50) * 2.5
  
  // Cap at reasonable maximum
  return Math.min(cost, 25.0)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postalCode, subtotal } = body

    if (!postalCode) {
      return NextResponse.json({ error: 'Postal code is required' }, { status: 400 })
    }

    // Get shipping settings
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['shipping_type', 'shipping_amount', 'free_shipping_threshold', 'shipping_origin_zip'],
        },
      },
    })

    const settingsMap: Record<string, string> = {}
    settings.forEach((s) => {
      settingsMap[s.key] = s.value
    })

    const shippingType = settingsMap['shipping_type'] || 'flat'
    const flatShippingAmount = parseFloat(settingsMap['shipping_amount'] || '0')
    const freeShippingThreshold = parseFloat(settingsMap['free_shipping_threshold'] || '0')
    const originZip = settingsMap['shipping_origin_zip'] || '94544'

    // Check if order qualifies for free shipping
    if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) {
      return NextResponse.json({ shippingAmount: 0, isFreeShipping: true })
    }

    let shippingAmount = 0

    if (shippingType === 'distance') {
      // Calculate distance-based shipping
      const distance = await calculateDistance(originZip, postalCode)
      shippingAmount = calculateDistanceShipping(distance)
    } else {
      // Use flat rate
      shippingAmount = flatShippingAmount
    }

    return NextResponse.json({
      shippingAmount: Math.round(shippingAmount * 100) / 100,
      isFreeShipping: false,
    })
  } catch (error) {
    console.error('Error calculating shipping:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

