import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    const count = await prisma.newsletterSubscription.count({
      where: { subscribed: true },
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching subscriber count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
