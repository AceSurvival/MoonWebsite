import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route requires authentication and database access
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request)
    const code = await prisma.discountCode.findUnique({
      where: { id: params.id },
    })
    if (!code) {
      return NextResponse.json({ error: 'Discount code not found' }, { status: 404 })
    }
    return NextResponse.json(code)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request)
    const body = await request.json()
    const code = await prisma.discountCode.update({
      where: { id: params.id },
      data: {
        code: body.code?.toUpperCase(),
        discountType: body.discountType || 'PERCENTAGE',
        discountPercent: body.discountType === 'FIXED_AMOUNT' ? null : (body.discountPercent ?? undefined),
        discountAmount: body.discountType === 'FIXED_AMOUNT' ? (body.discountAmount ?? undefined) : null,
        active: body.active,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      },
    })
    return NextResponse.json(code)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error updating discount code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request)
    await prisma.discountCode.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error deleting discount code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


