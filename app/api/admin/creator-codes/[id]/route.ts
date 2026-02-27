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
    const code = await prisma.creatorCode.findUnique({
      where: { id: params.id },
    })
    if (!code) {
      return NextResponse.json({ error: 'Creator code not found' }, { status: 404 })
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
    const code = await prisma.creatorCode.update({
      where: { id: params.id },
      data: {
        code: body.code?.toUpperCase(),
        discountPercent: body.discountPercent,
        active: body.active,
      },
    })
    return NextResponse.json(code)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error updating creator code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request)
    await prisma.creatorCode.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error deleting creator code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


