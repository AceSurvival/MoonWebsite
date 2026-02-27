import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Create a new variant for a product
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request)
    const body = await request.json()
    
    // Get the parent product
    const parentProduct = await prisma.product.findUnique({
      where: { id: params.id },
    })
    
    if (!parentProduct) {
      return NextResponse.json({ error: 'Parent product not found' }, { status: 404 })
    }
    
    // Check if parent product already has a variant with this name
    const existingVariant = await prisma.product.findFirst({
      where: {
        parentProductId: params.id,
        variantName: body.variantName,
      },
    })
    
    if (existingVariant) {
      return NextResponse.json({ error: 'A variant with this name already exists' }, { status: 400 })
    }
    
    // Generate slug for variant
    const variantSlug = `${parentProduct.slug}-${slugify(body.variantName || 'variant')}`
    
    // Ensure slug is unique
    let uniqueSlug = variantSlug
    let counter = 1
    while (true) {
      const existing = await prisma.product.findUnique({
        where: { slug: uniqueSlug },
        select: { id: true },
      })
      
      if (!existing) {
        break
      }
      
      uniqueSlug = `${variantSlug}-${counter}`
      counter++
      
      if (counter > 100) {
        uniqueSlug = `${variantSlug}-${Date.now()}`
        break
      }
    }
    
    // Create variant product
    const variantData: any = {
      name: `${parentProduct.name} ${body.variantName || ''}`.trim(),
      slug: uniqueSlug,
      description: body.description || parentProduct.description,
      shortDescription: body.shortDescription || parentProduct.shortDescription,
      price: body.price || parentProduct.price,
      salePrice: body.salePrice || null,
      category: parentProduct.category,
      imageUrl: body.imageUrl || parentProduct.imageUrl,
      variantImageUrl: body.variantImageUrl || null,
      extraImages: body.extraImages || parentProduct.extraImages,
      purity: body.purity || parentProduct.purity,
      vialSize: body.vialSize || parentProduct.vialSize,
      coaLink: body.coaLink || parentProduct.coaLink,
      codename: parentProduct.codename,
      stock: body.stock ?? null,
      outOfStock: body.outOfStock || false,
      featured: false, // Variants are not featured
      active: body.active !== undefined ? body.active : true,
      parentProductId: params.id,
      variantName: body.variantName || null,
    }
    
    // Auto-set outOfStock if stock is 0
    if (variantData.stock !== null && variantData.stock !== undefined && variantData.stock === 0) {
      variantData.outOfStock = true
    }
    
    const variant = await prisma.product.create({ data: variantData })
    
    return NextResponse.json(variant)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error creating variant:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A product with this slug already exists' }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to create variant'
    }, { status: 500 })
  }
}
