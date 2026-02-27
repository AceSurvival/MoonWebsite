import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    // Filter out abandoned cart codes (codes starting with "CART")
    const codes = await prisma.discountCode.findMany({
      where: {
        code: {
          not: {
            startsWith: 'CART',
          },
        },
      },
      include: {
        orders: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            discountAmount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(codes)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)
    const body = await request.json()
    const code = await prisma.discountCode.create({
      data: {
        code: body.code.toUpperCase(),
        discountType: body.discountType || 'PERCENTAGE',
        discountPercent: body.discountType === 'FIXED_AMOUNT' ? null : (body.discountPercent || 0),
        discountAmount: body.discountType === 'FIXED_AMOUNT' ? (body.discountAmount || 0) : null,
        active: body.active !== undefined ? body.active : true,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      },
    })
    return NextResponse.json(code)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error creating discount code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


