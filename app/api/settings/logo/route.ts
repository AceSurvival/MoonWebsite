import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'logo_image' },
    })

    const response = NextResponse.json({
      logoImage: setting?.value || null,
    })
    
    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching logo:', error)
    return NextResponse.json({
      logoImage: null,
    })
  }
}

