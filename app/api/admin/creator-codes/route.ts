import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route requires authentication and database access
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    const codes = await prisma.creatorCode.findMany({
      include: {
        usages: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
                totalAmount: true,
              },
            },
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
    const code = await prisma.creatorCode.create({
      data: {
        code: body.code.toUpperCase(),
        discountPercent: body.discountPercent,
        active: body.active !== undefined ? body.active : true,
      },
    })
    return NextResponse.json(code)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error creating creator code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


