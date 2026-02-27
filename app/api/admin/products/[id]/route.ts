import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route requires authentication and database access
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request)
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        variants: {
          orderBy: [
            { sortOrder: 'asc' },
            { variantName: 'asc' },
          ],
        },
      },
    })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json(product)
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
    
    // Get the existing product to preserve fields that aren't being updated
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    })
    
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    // Auto-set outOfStock if stock is 0
    const updateData: any = { ...body }
    if (updateData.stock !== null && updateData.stock !== undefined) {
      if (updateData.stock === 0) {
        updateData.outOfStock = true
      } else if (updateData.stock > 0 && updateData.outOfStock === undefined) {
        // Only auto-unset if not explicitly set
        // If outOfStock is explicitly set to false, keep it
        if (body.outOfStock === false) {
          updateData.outOfStock = false
        }
      }
    }
    
    // For variants, ensure imageUrl persists (inherit from parent if not provided)
    if (existingProduct.parentProductId && !updateData.imageUrl && existingProduct.imageUrl) {
      // Keep existing imageUrl if not being updated
      updateData.imageUrl = existingProduct.imageUrl
    } else if (existingProduct.parentProductId && !updateData.imageUrl && !existingProduct.imageUrl) {
      // If variant has no imageUrl, inherit from parent
      const parentProduct = await prisma.product.findUnique({
        where: { id: existingProduct.parentProductId },
        select: { imageUrl: true },
      })
      if (parentProduct?.imageUrl) {
        updateData.imageUrl = parentProduct.imageUrl
      }
    }
    
    const product = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
    })
    return NextResponse.json(product)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request)
    
    // Check if product has any order items
    const orderItemsCount = await prisma.orderItem.count({
      where: { productId: params.id },
    })
    
    if (orderItemsCount > 0) {
      // Product has orders, so we'll deactivate it instead of deleting
      // This preserves order history
      await prisma.product.update({
        where: { id: params.id },
        data: { active: false },
      })
      return NextResponse.json({ 
        success: true, 
        message: 'Product deactivated (has existing orders)',
        deactivated: true 
      })
    } else {
      // No orders, safe to delete
      await prisma.product.delete({
        where: { id: params.id },
      })
      return NextResponse.json({ success: true, deleted: true })
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error deleting product:', error)
    
    // If it's a foreign key constraint error, try to deactivate instead
    if (error.code === 'P2003') {
      try {
        await prisma.product.update({
          where: { id: params.id },
          data: { active: false },
        })
        return NextResponse.json({ 
          success: true, 
          message: 'Product deactivated (has existing orders)',
          deactivated: true 
        })
      } catch (updateError) {
        return NextResponse.json({ 
          error: 'Could not delete or deactivate product. It may be referenced in orders.' 
        }, { status: 400 })
      }
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


