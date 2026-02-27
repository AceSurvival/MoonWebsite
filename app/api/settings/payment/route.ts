import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route requires database access
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['zelle_instructions', 'bitcoin_address', 'bitcoin_qr', 'cashapp_tag'],
        },
      },
    })

    const settingsMap: Record<string, string> = {}
    settings.forEach((s) => {
      settingsMap[s.key] = s.value
    })

    const response = NextResponse.json({
      zelle: settingsMap['zelle_instructions'] || '',
      bitcoin: settingsMap['bitcoin_address'] || '',
      bitcoinQr: settingsMap['bitcoin_qr'] || null,
      cashapp: settingsMap['cashapp_tag'] || '',
    })
    
    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching payment settings:', error)
    return NextResponse.json({
      zelle: '',
      bitcoin: '',
      bitcoinQr: null,
      cashapp: '',
    })
  }
}


