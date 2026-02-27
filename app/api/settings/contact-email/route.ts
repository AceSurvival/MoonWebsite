import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route requires database access
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Return from_email instead of contact_email to hide the forwarding address
    const setting = await prisma.setting.findUnique({
      where: { key: 'from_email' },
    })
    return NextResponse.json({ email: setting?.value || '' })
  } catch (error) {
    console.error('Error fetching contact email:', error)
    return NextResponse.json({ email: '' })
  }
}


