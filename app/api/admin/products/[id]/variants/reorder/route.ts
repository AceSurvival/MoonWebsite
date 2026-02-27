import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Update variant sort order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request)
    const body = await request.json()
    
    // body should be an array of { id: string, sortOrder: number }
    if (!Array.isArray(body.variants)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    
    // Verify all variants belong to this parent product
    const parentProduct = await prisma.product.findUnique({
      where: { id: params.id },
      select: { id: true },
    })
    
    if (!parentProduct) {
      return NextResponse.json({ error: 'Parent product not found' }, { status: 404 })
    }
    
    // Update all variants in a transaction
    await prisma.$transaction(
      body.variants.map((variant: { id: string; sortOrder: number }) =>
        prisma.product.update({
          where: { id: variant.id },
          data: { sortOrder: variant.sortOrder },
        })
      )
    )
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error updating variant sort order:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to update variant sort order'
    }, { status: 500 })
  }
}
