import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sortVariants } from '@/lib/variant-utils'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 12
    const skip = (page - 1) * limit

    // Get total count for pagination (only parent products, not variants)
    const totalCount = await prisma.product.count({
      where: {
        active: true,
        parentProductId: null, // Only show parent products
        ...(category && category !== 'all' ? { category } : {}),
      },
    })

    const products = await prisma.product.findMany({
      where: {
        active: true,
        parentProductId: null, // Only show parent products
        ...(category && category !== 'all' ? { category } : {}),
      },
      // Always sort alphabetically by name
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      include: {
        variants: {
          where: { active: true },
          orderBy: [
            { sortOrder: 'asc' },
            { variantName: 'asc' },
          ],
        },
      },
    })

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

    // Apply global sale and compute price range + featuredDisplay (cheapest variant) for store cards
    const productsWithGlobalSale = products.map((product) => {
      let finalSalePrice = product.salePrice
      if (globalSaleActive && globalSalePercent > 0 && !product.salePrice) {
        finalSalePrice = product.price * (1 - globalSalePercent / 100)
      }

      const sortedVariants = sortVariants(product.variants || [])
      let priceRange: { min: number; max: number } | null = null
      let featuredDisplay: { displayPrice: number; displayPriceOriginal: number; displayVariantName: string } | null = null

      if (product.variants && product.variants.length > 0) {
        const variantOptions: { effective: number; original: number; variantName: string }[] = sortedVariants.map((v: any) => {
          let variantSale = v.salePrice
          if (globalSaleActive && globalSalePercent > 0 && !v.salePrice) {
            variantSale = v.price * (1 - globalSalePercent / 100)
          }
          return {
            effective: variantSale ?? v.price,
            original: v.price,
            variantName: v.variantName || '',
          }
        })
        const parentEffective = finalSalePrice ?? product.price
        const allEffective = [parentEffective, ...variantOptions.map((o) => o.effective)]
        const minEffective = Math.min(...allEffective)
        const maxEffective = Math.max(...allEffective)
        if (minEffective !== maxEffective) {
          priceRange = { min: minEffective, max: maxEffective }
        }
        const cheapest = variantOptions.reduce((best, o) => (o.effective < best.effective ? o : best))
        featuredDisplay = {
          displayPrice: cheapest.effective,
          displayPriceOriginal: cheapest.original,
          displayVariantName: cheapest.variantName || 'Lowest price',
        }
      }

      return {
        ...product,
        salePrice: finalSalePrice,
        priceRange,
        featuredDisplay,
        variants: sortedVariants,
      }
    })

    // Get unique categories
    const categories = await prisma.product.findMany({
      where: { active: true },
      select: { category: true },
      distinct: ['category'],
    })
    const uniqueCategories = Array.from(new Set(categories.map((p) => p.category)))

    const totalPages = Math.ceil(totalCount / limit)

    const response = NextResponse.json({
      products: productsWithGlobalSale,
      categories: uniqueCategories,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    })
    
    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ products: [], categories: [] }, { status: 500 })
  }
}

