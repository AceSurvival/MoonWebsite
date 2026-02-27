import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sortVariants } from '@/lib/variant-utils'

// Force dynamic rendering - this route requires database access
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        variants: {
          where: { active: true },
          orderBy: [
            { sortOrder: 'asc' },
            { variantName: 'asc' },
          ],
        },
        parentProduct: {
          include: {
            variants: {
              where: { active: true },
              orderBy: [
                { sortOrder: 'asc' },
                { variantName: 'asc' },
              ],
            },
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    // If this is a variant, use parent product data but keep variant-specific info
    const displayProduct = product.parentProductId && product.parentProduct 
      ? {
          ...product.parentProduct,
          // Override with variant-specific data
          id: product.id,
          price: product.price,
          salePrice: product.salePrice,
          imageUrl: product.variantImageUrl || product.imageUrl,
          stock: product.stock,
          outOfStock: product.outOfStock,
          variantName: product.variantName,
          variants: product.parentProduct.variants,
        }
      : product

    // Get global sale settings
    const globalSaleSettings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['global_sale_active', 'global_sale_percent'],
        },
      },
    })
    const settingsMap: Record<string, string> = {}
    globalSaleSettings.forEach((s) => {
      settingsMap[s.key] = s.value
    })
    const globalSaleActive = settingsMap['global_sale_active'] === 'true'
    const globalSalePercent = parseFloat(settingsMap['global_sale_percent'] || '0')

    // Apply global sale to display product and all variants
    let finalSalePrice = displayProduct.salePrice
    if (globalSaleActive && globalSalePercent > 0 && !displayProduct.salePrice) {
      finalSalePrice = displayProduct.price * (1 - globalSalePercent / 100)
    }
    
    // Apply global sale to variants and sort them
    const variantsWithSale = sortVariants(displayProduct.variants || []).map((variant: any) => {
      let variantSalePrice = variant.salePrice
      if (globalSaleActive && globalSalePercent > 0 && !variant.salePrice) {
        variantSalePrice = variant.price * (1 - globalSalePercent / 100)
      }
      return {
        ...variant,
        salePrice: variantSalePrice,
      }
    })

    const response = NextResponse.json({
      ...displayProduct,
      salePrice: finalSalePrice,
      variants: variantsWithSale,
    })
    
    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


