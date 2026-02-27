'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BacWaterModal from '@/components/BacWaterModal'
import { normalizeMgDisplay } from '@/lib/variant-utils'

interface CartItem {
  id: string
  name: string
  price: number
  imageUrl: string | null
  quantity: number
}

interface Variant {
  id: string
  variantName: string | null
  price: number
  salePrice: number | null
  imageUrl: string | null
  variantImageUrl: string | null
  stock: number | null
  outOfStock: boolean
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  salePrice: number | null
  imageUrl: string | null
  stock: number | null
  outOfStock: boolean
  variants?: Variant[]
}

export default function CartSlideOut() {
  const [isOpen, setIsOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([])
  const [showPromoCode, setShowPromoCode] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoCodeApplied, setPromoCodeApplied] = useState(false)
  const [promoCodePercent, setPromoCodePercent] = useState(0)
  const [promoCodeMessage, setPromoCodeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showBacWaterModal, setShowBacWaterModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const updateCart = () => {
      const storedCart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCart(storedCart)
    }
    
    updateCart()
    window.addEventListener('storage', updateCart)
    const interval = setInterval(updateCart, 1000)
    
    // Fetch recommended products
    fetchRecommendedProducts()
    
    return () => {
      window.removeEventListener('storage', updateCart)
      clearInterval(interval)
    }
  }, [])

  const fetchRecommendedProducts = async () => {
    try {
      const res = await fetch('/api/store/products?page=1&limit=4', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (res.ok) {
        const data = await res.json()
        // Get random products or featured products
        const products = data.products || []
        // Shuffle and take 4
        const shuffled = [...products].sort(() => 0.5 - Math.random())
        setRecommendedProducts(shuffled.slice(0, 4))
      }
    } catch (error) {
      console.error('Failed to fetch recommended products:', error)
    }
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, quantity } : item
    )
    setCart(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
    window.dispatchEvent(new Event('storage'))
  }

  const removeItem = (id: string) => {
    const updatedCart = cart.filter((item) => item.id !== id)
    setCart(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
    window.dispatchEvent(new Event('storage'))
  }

  const addToCart = (product: Product) => {
    // Use first variant if available, otherwise use product itself
    const variant = product.variants && product.variants.length > 0 ? product.variants[0] : null
    const productToAdd = variant || product
    const productId = variant?.id || product.id
    const productName = variant 
      ? normalizeMgDisplay(`${product.name} ${variant.variantName || ''}`)
      : normalizeMgDisplay(product.name)
    const productImage = variant?.variantImageUrl || variant?.imageUrl || product.imageUrl
    const displayPrice = productToAdd.salePrice ?? productToAdd.price
    
    if (productToAdd.outOfStock) {
      return
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingItem = cart.find((item: CartItem) => item.id === productId)

    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cart.push({
        id: productId,
        name: productName,
        price: displayPrice,
        imageUrl: productImage,
        quantity: 1,
      })
    }

    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('storage'))
  }

  const checkForBacWater = async () => {
    // Check if cart already has BAC water
    const hasBacWater = cart.some(item => 
      item.name.toLowerCase().includes('bac') || 
      item.name.toLowerCase().includes('bacteriostatic')
    )
    
    if (hasBacWater) {
      return false
    }

    // Check if cart has any products (which would be lyophilized peptides)
    if (cart.length === 0) {
      return false
    }

    return true
  }

  const handleProceedToCheckout = async () => {
    const needsBacWater = await checkForBacWater()
    if (needsBacWater) {
      setShowBacWaterModal(true)
    } else {
      // Store promo code in localStorage so checkout can use it
      if (promoCodeApplied && promoCode) {
        localStorage.setItem('appliedPromoCode', JSON.stringify({
          code: promoCode,
          percent: promoCodePercent,
        }))
      }
      setIsOpen(false)
      router.push('/checkout')
    }
  }

  const handleAddBacWater = async () => {
    try {
      // Fetch BAC water products
      const res = await fetch('/api/store/products?category=Bac Water&limit=1')
      if (res.ok) {
        const data = await res.json()
        const bacWaterProducts = data.products || []
        
        if (bacWaterProducts.length > 0) {
          const bacWaterProduct = bacWaterProducts[0]
          // Use first variant if available, otherwise use product itself
          const variant = bacWaterProduct.variants && bacWaterProduct.variants.length > 0 
            ? bacWaterProduct.variants[0] 
            : null
          const productToAdd = variant || bacWaterProduct
          const productId = variant?.id || bacWaterProduct.id
          const productName = normalizeMgDisplay(
            variant ? `${bacWaterProduct.name} ${variant.variantName || ''}` : bacWaterProduct.name
          )
          const productImage = variant?.variantImageUrl || variant?.imageUrl || bacWaterProduct.imageUrl
          const displayPrice = productToAdd.salePrice ?? productToAdd.price

          if (!productToAdd.outOfStock) {
            const currentCart = JSON.parse(localStorage.getItem('cart') || '[]')
            const existingItem = currentCart.find((item: CartItem) => item.id === productId)

            if (existingItem) {
              existingItem.quantity += 1
            } else {
              currentCart.push({
                id: productId,
                name: productName,
                price: displayPrice,
                imageUrl: productImage,
                quantity: 1,
              })
            }

            localStorage.setItem('cart', JSON.stringify(currentCart))
            setCart(currentCart)
            window.dispatchEvent(new Event('storage'))
          }
        }
      }
    } catch (error) {
      console.error('Failed to add BAC water:', error)
    }
    
    // Store promo code in localStorage so checkout can use it
    if (promoCodeApplied && promoCode) {
      localStorage.setItem('appliedPromoCode', JSON.stringify({
        code: promoCode,
        percent: promoCodePercent,
      }))
    }
    setShowBacWaterModal(false)
    setIsOpen(false)
    router.push('/checkout')
  }

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return

    try {
      const res = await fetch(`/api/discount-codes/${promoCode}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (res.ok) {
        const data = await res.json()
        setPromoCodeApplied(true)
        setPromoCodePercent(data.discountPercent)
        setPromoCodeMessage({ type: 'success', text: `Promo code applied! ${data.discountPercent}% off` })
        setTimeout(() => setPromoCodeMessage(null), 3000)
      } else {
        const errorData = await res.json().catch(() => ({}))
        setPromoCodeMessage({ type: 'error', text: errorData.error || 'Invalid promo code' })
        setPromoCodeApplied(false)
        setPromoCodePercent(0)
      }
    } catch (error) {
      setPromoCodeMessage({ type: 'error', text: 'Failed to apply promo code. Please try again.' })
      setPromoCodeApplied(false)
      setPromoCodePercent(0)
    }
  }

  const removePromoCode = () => {
    setPromoCodeApplied(false)
    setPromoCodePercent(0)
    setPromoCode('')
    setPromoCodeMessage(null)
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount = promoCodeApplied ? (subtotal * promoCodePercent) / 100 : 0
  const subtotalAfterDiscount = subtotal - discountAmount
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Don't show if cart is empty
  if (cartCount === 0) {
    return null
  }

  return (
    <>
      {/* Floating Cart Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-all duration-300 flex items-center gap-2"
        style={{ marginBottom: cartCount > 0 ? '0' : '0' }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="font-bold text-lg">{cartCount}</span>
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>

      {/* Slide Out Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-[100] transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Slide Out Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] lg:w-[500px] bg-white dark:bg-gray-800 z-[101] shadow-2xl transform transition-transform duration-300 overflow-y-auto">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Cart</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={normalizeMgDisplay(item.name)}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{normalizeMgDisplay(item.name)}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                          >
                            −
                          </button>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                          >
                            +
                          </button>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 ml-auto">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 text-xs mt-1 flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          REMOVE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Code Section */}
                <div className="mb-6">
                  {!showPromoCode ? (
                    <button
                      onClick={() => setShowPromoCode(true)}
                      className="flex items-center gap-2 text-pink-600 dark:text-pink-400 text-sm font-semibold hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span>Have a Promo Code?</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="Enter promo/creator code"
                          disabled={promoCodeApplied}
                          className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-pink-500 dark:focus:border-pink-500 disabled:opacity-50"
                        />
                        {!promoCodeApplied ? (
                          <button
                            onClick={applyPromoCode}
                            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            Apply
                          </button>
                        ) : (
                          <button
                            onClick={removePromoCode}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {promoCodeMessage && (
                        <p className={`text-xs ${promoCodeMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {promoCodeMessage.text}
                        </p>
                      )}
                      {promoCodeApplied && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {promoCodePercent}% discount applied
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-900 dark:text-gray-100 font-semibold">Subtotal</span>
                      <span className="text-gray-900 dark:text-gray-100 font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    {promoCodeApplied && (
                      <div className="flex justify-between items-center">
                        <span className="text-green-600 dark:text-green-400 text-sm">Discount ({promoCodePercent}%)</span>
                        <span className="text-green-600 dark:text-green-400 font-semibold">-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-900 dark:text-gray-100 font-semibold">Total</span>
                      <span className="text-gray-900 dark:text-gray-100 font-bold text-xl">${subtotalAfterDiscount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Recommended Products */}
                {recommendedProducts.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      Products you might like
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </h3>
                    <div className="space-y-3">
                      {recommendedProducts.map((product) => {
                        // Use first variant if available, otherwise use product itself
                        const variant = product.variants && product.variants.length > 0 ? product.variants[0] : null
                        const productToDisplay = variant || product
                        const displayPrice = productToDisplay.salePrice ?? productToDisplay.price
                        const isOnSale = productToDisplay.salePrice !== null
                        const productImage = variant?.variantImageUrl || variant?.imageUrl || product.imageUrl
                        const displayStock = productToDisplay.stock
                        const displayOutOfStock = productToDisplay.outOfStock ?? false
                        
                        return (
                          <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            {productImage && (
                              <img
                                src={productImage}
                                alt={normalizeMgDisplay(product.name)}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                                {variant ? normalizeMgDisplay(`${product.name} ${variant.variantName || ''}`) : normalizeMgDisplay(product.name)}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                {isOnSale && (
                                  <span className="text-xs text-gray-400 line-through">${productToDisplay.price.toFixed(2)}</span>
                                )}
                                <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
                                  ${displayPrice.toFixed(2)}
                                </span>
                              </div>
                              {displayStock !== null && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {displayStock} in stock
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => addToCart(product)}
                              disabled={displayOutOfStock}
                              className="px-4 py-2 bg-black text-white text-xs font-semibold rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              + ADD
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    router.push('/store')
                  }}
                  className="w-full px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Checkout - ${subtotalAfterDiscount.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      <BacWaterModal
        isOpen={showBacWaterModal}
        onClose={() => {
          setShowBacWaterModal(false)
          // Store promo code in localStorage so checkout can use it
          if (promoCodeApplied && promoCode) {
            localStorage.setItem('appliedPromoCode', JSON.stringify({
              code: promoCode,
              percent: promoCodePercent,
            }))
          }
          setIsOpen(false)
          router.push('/checkout')
        }}
        onAdd={handleAddBacWater}
      />
    </>
  )
}
