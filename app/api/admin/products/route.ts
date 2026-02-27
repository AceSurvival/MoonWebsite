import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

// Force dynamic rendering - this route requires authentication and database access
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    // Only fetch parent products (not variants)
    const products = await prisma.product.findMany({
      where: {
        parentProductId: null, // Only show main products, not variants
      },
      orderBy: { name: 'asc' }, // Sort alphabetically by name
    })
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)
    const body = await request.json()
    
    // Auto-generate slug if not provided
    let slug = body.slug?.trim() || slugify(body.name)
    
    // Ensure slug is unique
    let uniqueSlug = slug
    let counter = 1
    while (true) {
      const existing = await prisma.product.findUnique({
        where: { slug: uniqueSlug },
        select: { id: true },
      })
      
      if (!existing) {
        break
      }
      
      uniqueSlug = `${slug}-${counter}`
      counter++
      
      // Safety check to prevent infinite loop
      if (counter > 100) {
        uniqueSlug = `${slug}-${Date.now()}`
        break
      }
    }
    
    const productData: any = {
      ...body,
      slug: uniqueSlug,
    }
    
    // Auto-set outOfStock if stock is 0
    if (productData.stock !== null && productData.stock !== undefined && productData.stock === 0) {
      productData.outOfStock = true
    }
    
    const product = await prisma.product.create({ data: productData })
    return NextResponse.json(product)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error creating product:', error)
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A product with this slug already exists' }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to create product'
    }, { status: 500 })
  }
}


