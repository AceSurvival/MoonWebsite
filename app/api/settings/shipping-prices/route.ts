import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['shipping_usps_ups_standard', 'shipping_ups_2day', 'shipping_fedex_2day'],
        },
      },
    })

    const settingsMap: Record<string, string> = {}
    settings.forEach((s) => {
      settingsMap[s.key] = s.value
    })

    const response = NextResponse.json({
      uspsUpsStandard: parseFloat(settingsMap['shipping_usps_ups_standard'] || '15'),
      ups2Day: parseFloat(settingsMap['shipping_ups_2day'] || '25'),
      fedex2Day: parseFloat(settingsMap['shipping_fedex_2day'] || '30'),
    })
    
    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching shipping prices:', error)
    return NextResponse.json({
      uspsUpsStandard: 15,
      ups2Day: 25,
      fedex2Day: 30,
    })
  }
}
