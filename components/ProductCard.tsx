'use client'

import Link from 'next/link'
import { normalizeMgDisplay } from '@/lib/variant-utils'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription?: string | null
  price: number
  salePrice?: number | null
  imageUrl?: string | null
  outOfStock?: boolean
  priceRange?: {
    min: number
    max: number
  } | null
  /** For featured products with variants: cheapest size price + original + label (e.g. "10mg") */
  featuredDisplay?: {
    displayPrice: number
    displayPriceOriginal: number
    displayVariantName: string
  } | null
}

interface ProductCardProps {
  product: Product
  index?: number
  className?: string
}

// Helper function to strip HTML and get preview text (fallback)
function getPreviewText(html: string): string {
  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, ' ')
  // Decode HTML entities
  const decoded = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  
  // Try to extract product name from structured format
  const productMatch = decoded.match(/Product:\s*([^\n]+)/i)
  if (productMatch) {
    return productMatch[1].trim()
  }
  
  // Clean up whitespace and get first meaningful part
  const cleaned = decoded.replace(/\s+/g, ' ').trim()
  if (cleaned.length > 0) {
    return cleaned.substring(0, 100)
  }
  
  return 'Research peptide for laboratory use.'
}

export default function ProductCard({ product, index = 0, className = '' }: ProductCardProps) {
  const fd = product.featuredDisplay
  const useFeaturedDisplay = fd && product.priceRange
  const displayPrice = useFeaturedDisplay ? fd!.displayPrice : (product.salePrice ?? product.price)
  const displayPriceOriginal = useFeaturedDisplay ? fd!.displayPriceOriginal : product.price
  const isOnSale = useFeaturedDisplay
    ? fd!.displayPrice < fd!.displayPriceOriginal
    : (product.salePrice !== null && product.salePrice !== undefined)
  const hasPriceRange = product.priceRange !== null && product.priceRange !== undefined
  const previewText = product.shortDescription || getPreviewText(product.description)

  return (
    <Link
      href={`/products/${product.slug}`}
      className={`group relative block bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600/50 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${className}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Out of Stock */}
      {product.outOfStock && (
        <div className="absolute top-3 left-3 z-20">
          <span className="bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-xs font-medium px-2.5 py-1 rounded">
            Out of Stock
          </span>
        </div>
      )}

      {/* Sale */}
      {isOnSale && !product.outOfStock && (
        <div className="absolute top-3 right-3 z-20">
          <span className="bg-purple-600 text-white text-xs font-medium px-2.5 py-1 rounded">
            Sale!
          </span>
        </div>
      )}

      {product.imageUrl && (
        <div className="aspect-square mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
            loading="lazy"
          />
        </div>
      )}
      <div className="relative z-10">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2 mb-1">
          {normalizeMgDisplay(product.name)}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 mb-4">
          {normalizeMgDisplay(previewText)}
        </p>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-col gap-0.5">
            {hasPriceRange ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  {isOnSale && (
                    <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
                      ${displayPriceOriginal.toFixed(2)}
                    </span>
                  )}
                  <span className={`text-lg font-bold ${isOnSale ? 'text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-white'}`}>
                    ${displayPrice.toFixed(2)}
                    {product.priceRange && product.priceRange.min !== product.priceRange.max && (
                      <span className="text-gray-500 dark:text-gray-400 font-normal text-sm"> – ${product.priceRange.max.toFixed(2)}</span>
                    )}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {fd?.displayVariantName ? `${normalizeMgDisplay(fd.displayVariantName)} · ` : ''}Select options
                </span>
              </>
            ) : (
              <>
                {isOnSale && (
                  <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
                    ${product.price.toFixed(2)}
                  </span>
                )}
                <span className={`text-lg font-bold ${isOnSale ? 'text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-white'}`}>
                  ${displayPrice.toFixed(2)}
                </span>
              </>
            )}
          </div>
          <span className="text-purple-600 dark:text-purple-400 text-sm font-medium group-hover:translate-x-0.5 transition-transform inline-block">
            →
          </span>
        </div>
      </div>
    </Link>
  )
}

