'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ToastProvider'
import { replaceMgInText, replaceMgInVialSize, replaceVariantInfoInDescription, extractMgAmount, normalizeMgDisplay } from '@/lib/variant-utils'

interface Variant {
  id: string
  variantName: string | null
  price: number
  salePrice: number | null
  variantImageUrl: string | null
  imageUrl: string | null
  stock: number | null
  outOfStock: boolean
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  salePrice: number | null
  category: string
  imageUrl: string | null
  extraImages: string | null
  purity: string | null
  vialSize: string | null
  coaLink: string | null
  codename: string | null
  stock: number | null
  outOfStock: boolean
  variantName: string | null
  variants?: Variant[]
}

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${params.slug}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        if (res.ok) {
          const data = await res.json()
          setProduct(data)
          // If product has variants, select the first one (or the one matching variantName)
          if (data.variants && data.variants.length > 0) {
            const defaultVariant = data.variantName 
              ? data.variants.find((v: Variant) => v.variantName === data.variantName) || data.variants[0]
              : data.variants[0]
            setSelectedVariant(defaultVariant)
          }
        }
      } catch (error) {
        console.error('Failed to fetch product:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [params.slug])
  
  // Update selected variant when variants change
  useEffect(() => {
    if (product?.variants && product.variants.length > 0 && !selectedVariant) {
      const defaultVariant = product.variantName 
        ? product.variants.find((v: Variant) => v.variantName === product.variantName) || product.variants[0]
        : product.variants[0]
      setSelectedVariant(defaultVariant)
    }
  }, [product, selectedVariant])

  const addToCart = () => {
    if (!product) return
    
    // Use selected variant if available, otherwise use product
    const productToAdd = selectedVariant || product
    const productId = selectedVariant?.id || product.id
    const productName = normalizeMgDisplay(
      selectedVariant ? `${product.name} ${selectedVariant.variantName}` : product.name
    )
    const productImage = selectedVariant?.variantImageUrl || selectedVariant?.imageUrl || product.imageUrl
    
    if (productToAdd.outOfStock) {
      showToast('This product is out of stock', 'error')
      return
    }

    const displayPrice = productToAdd.salePrice ?? productToAdd.price
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingItem = cart.find((item: any) => item.id === productId)

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cart.push({
        id: productId,
        name: productName,
        price: displayPrice,
        imageUrl: productImage,
        quantity,
      })
    }

    localStorage.setItem('cart', JSON.stringify(cart))
    showToast('Added to cart!', 'success')
    window.dispatchEvent(new Event('storage'))
  }
  
  const handleVariantChange = (variant: Variant) => {
    setSelectedVariant(variant)
  }
  
  // Get display product (selected variant or main product)
  const displayProduct = selectedVariant || product
  const displayImage = selectedVariant?.variantImageUrl || selectedVariant?.imageUrl || product?.imageUrl
  const displayPrice = displayProduct?.salePrice ?? displayProduct?.price ?? 0
  const displayStock = displayProduct?.stock
  const displayOutOfStock = displayProduct?.outOfStock ?? false

  // Dynamically update description with selected variant's information
  const dynamicDescription = useMemo(() => {
    if (!product?.description) return ''
    
    // If a variant is selected, update description with variant-specific info
    if (selectedVariant?.variantName) {
      return replaceVariantInfoInDescription(
        product.description, 
        selectedVariant.variantName,
        product.variantName
      )
    }
    
    // Otherwise return original description
    return product.description
  }, [product?.description, selectedVariant?.variantName, product?.variantName])

  // Dynamically update vial size with selected variant's MG amount
  const dynamicVialSize = useMemo(() => {
    if (!product?.vialSize) return null
    
    // If a variant is selected, extract its MG amount and replace in vial size
    if (selectedVariant?.variantName) {
      const variantMg = extractMgAmount(selectedVariant.variantName)
      if (variantMg !== null) {
        return replaceMgInVialSize(product.vialSize, variantMg)
      }
    }
    
    // Otherwise return original vial size
    return product.vialSize
  }, [product?.vialSize, selectedVariant?.variantName])

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">Product not found.</p>
          <Link href="/store" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mt-4 inline-block">
            Back to Store
          </Link>
        </div>
      </div>
    )
  }

  const extraImages = product?.extraImages ? JSON.parse(product.extraImages) : []
  const isOnSale = displayProduct?.salePrice !== null && displayProduct?.salePrice !== undefined
  
  // Get the correct product for cart (use variant ID if selected)
  const productForCart = selectedVariant || product

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto">
          <Link
            href="/store"
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mb-8 inline-flex items-center gap-2 transition-all duration-300 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Back to Store
          </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 animate-fade-in">
          {/* Images */}
          <div className="space-y-4 relative">
            {displayOutOfStock && (
              <div className="absolute top-2 left-2 z-20 transform -rotate-12 origin-top-left">
                <div className="bg-pink-500 text-white font-bold px-6 py-2 text-sm shadow-lg rounded">
                  Out of Stock
                </div>
              </div>
            )}
            {isOnSale && !displayOutOfStock && (
              <div className="absolute top-2 right-2 z-20 transform rotate-12 origin-top-right">
                <div className="bg-red-500 text-white font-bold px-6 py-2 text-sm shadow-lg rounded">
                  SALE
                </div>
              </div>
            )}
            {displayImage && (
              <div className="glass rounded-2xl overflow-hidden border border-purple-500/20 dark:border-purple-700/50 group">
                <img
                  src={displayImage}
                  alt={product?.name || ''}
                  className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                  key={selectedVariant?.id || product?.id} // Force re-render on variant change
                />
              </div>
            )}
            {extraImages.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {extraImages.map((img: string, idx: number) => (
                  <div key={idx} className="glass rounded-xl overflow-hidden border border-purple-500/20 group cursor-pointer">
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 gradient-text break-words">
              {normalizeMgDisplay(product?.name)}
              {selectedVariant && ` ${normalizeMgDisplay(selectedVariant.variantName)}`}
            </h1>
            
            {/* Variant Selector */}
            {product?.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <label className="block text-gray-900 dark:text-gray-100 font-bold mb-3 text-lg">Select Size:</label>
                <select
                  value={selectedVariant?.id || ''}
                  onChange={(e) => {
                    const variant = product.variants?.find((v: Variant) => v.id === e.target.value)
                    if (variant) handleVariantChange(variant)
                  }}
                  className="w-full px-4 py-3 glass border border-purple-500/30 dark:border-purple-700/50 rounded-xl text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-800/80 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500 text-lg font-semibold"
                >
                  {product.variants.map((variant: Variant) => {
                    const variantPrice = variant.salePrice ?? variant.price
                    const variantDisplayName = normalizeMgDisplay(variant.variantName) || 'Default'
                    return (
                      <option key={variant.id} value={variant.id}>
                        {variantDisplayName} - ${variantPrice.toFixed(2)}
                        {variant.outOfStock ? ' (Out of Stock)' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
              {isOnSale && (
                <span className="text-xl sm:text-2xl text-gray-400 dark:text-gray-500 line-through">
                  ${displayProduct?.price.toFixed(2)}
                </span>
              )}
              <p className={`text-3xl sm:text-4xl font-bold ${isOnSale ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                ${displayPrice.toFixed(2)}
              </p>
              {isOnSale && (
                <span className="text-xs sm:text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 sm:px-3 py-1 rounded font-semibold">
                  SALE
                </span>
              )}
            </div>
            </div>

            <div className="glass p-6 rounded-2xl border border-purple-500/20 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-purple-600 dark:text-purple-400 font-semibold min-w-[100px]">Category:</span>
                <span className="text-gray-700 dark:text-gray-300">{product.category}</span>
              </div>
              {product.purity && (
                <div className="flex items-center gap-3">
                  <span className="text-purple-600 dark:text-purple-400 font-semibold min-w-[100px]">Purity:</span>
                  <span className="text-gray-700 dark:text-gray-300">{product.purity}</span>
                </div>
              )}
              {dynamicVialSize && (
                <div className="flex items-center gap-3">
                  <span className="text-purple-600 dark:text-purple-400 font-semibold min-w-[100px]">Vial Size:</span>
                  <span className="text-gray-700 dark:text-gray-300">{dynamicVialSize}</span>
                </div>
              )}
              {product.codename && (
                <div className="flex items-center gap-3">
                  <span className="text-purple-600 dark:text-purple-400 font-semibold min-w-[100px]">Codename:</span>
                  <span className="text-gray-700 dark:text-gray-300 font-mono">{product.codename}</span>
                </div>
              )}
              {product.coaLink && (
                <div className="flex items-center gap-3">
                  <span className="text-purple-600 dark:text-purple-400 font-semibold min-w-[100px]">COA:</span>
                  <a 
                    href={product.coaLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline"
                  >
                    View Certificate of Analysis
                  </a>
                </div>
              )}
              {displayStock !== null && displayStock !== undefined && (
                <div className="flex items-center gap-3">
                  <span className="text-purple-600 font-semibold min-w-[100px]">Stock:</span>
                  <span className={`font-semibold ${(displayStock ?? 0) > 0 ? 'text-neon-teal' : 'text-orange-600'}`}>
                    {(displayStock ?? 0) > 0 ? `${displayStock} available` : 'Out of stock (Backorder available)'}
                  </span>
                </div>
              )}
            </div>

            <div className="glass p-6 rounded-2xl border border-purple-500/20 dark:border-purple-700/50">
              <label className="block text-gray-900 dark:text-gray-100 font-bold mb-4 text-lg">Quantity</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-6 py-3 glass border border-purple-500/30 dark:border-purple-700/50 hover:border-purple-500 dark:hover:border-purple-500 rounded-xl font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-800 transition-all duration-300"
                >
                  −
                </button>
                <span className="text-3xl font-bold w-16 text-center text-gray-900 dark:text-gray-100">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-6 py-3 glass border border-purple-500/30 dark:border-purple-700/50 hover:border-purple-500 dark:hover:border-purple-500 rounded-xl font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-800 transition-all duration-300"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={addToCart}
              disabled={displayOutOfStock || (displayStock !== null && displayStock === 0)}
              className="w-full px-8 py-4 bg-gradient-to-r from-neon-purple to-purple-600 dark:from-purple-700 dark:to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:hover:from-purple-600 dark:hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 shadow-2xl shadow-purple-500/50 dark:shadow-purple-700/50 hover:shadow-purple-500/70 dark:hover:shadow-purple-700/70 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 btn-modern text-lg"
            >
              {displayOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="mt-16 animate-fade-in">
          <h2 className="text-3xl font-bold mb-6 gradient-text">Description</h2>
          <div className="glass p-8 rounded-2xl border border-purple-500/20 dark:border-purple-700/50">
            <div className="space-y-6 text-gray-700 dark:text-white">
              {/* Display structured format from description HTML with dynamic MG amounts */}
            <div 
                className="leading-relaxed text-base prose prose-base max-w-none dark:prose-invert [&_*]:text-gray-700 [&_*]:dark:text-white [&_strong]:text-gray-900 [&_strong]:dark:text-white [&_strong]:font-semibold [&_h4]:text-gray-900 [&_h4]:dark:text-white [&_h4]:font-semibold [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:space-y-1 [&_li]:mb-1 [&_li]:text-gray-700 [&_li]:dark:text-white [&_p]:text-gray-700 [&_p]:dark:text-white [&_a]:text-purple-600 [&_a]:dark:text-purple-400 [&_a:hover]:underline"
              dangerouslySetInnerHTML={{ __html: normalizeMgDisplay(dynamicDescription) }}
            />
            </div>
          </div>
        </div>
        
        {/* Disclaimer - subtle */}
        <div className="mt-8 animate-fade-in">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            For laboratory research use only. Not for human consumption, medical use, veterinary use, or household use.
          </p>
        </div>
      </div>
    </div>
  )
}


