import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route requires database access
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['tax_rate', 'shipping_amount', 'free_shipping_threshold', 'shipping_type', 'shipping_origin_zip'],
        },
      },
    })

    const settingsMap: Record<string, string> = {}
    settings.forEach((s) => {
      settingsMap[s.key] = s.value
    })

    const response = NextResponse.json({
      taxRate: parseFloat(settingsMap['tax_rate'] || '0'),
      shippingAmount: parseFloat(settingsMap['shipping_amount'] || '0'),
      freeShippingThreshold: parseFloat(settingsMap['free_shipping_threshold'] || '0'),
      shippingType: settingsMap['shipping_type'] || 'flat',
      shippingOriginZip: settingsMap['shipping_origin_zip'] || '94544',
    })
    
    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching tax/shipping settings:', error)
    return NextResponse.json({
      taxRate: 0,
      shippingAmount: 0,
      freeShippingThreshold: 0,
      shippingType: 'flat',
      shippingOriginZip: '94544',
    })
  }
}




