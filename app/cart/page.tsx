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

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([])
  const [showBacWaterModal, setShowBacWaterModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCart(storedCart)
    fetchRecommendedProducts()
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
        const products = data.products || []
        const shuffled = [...products].sort(() => 0.5 - Math.random())
        setRecommendedProducts(shuffled.slice(0, 4))
      }
    } catch (error) {
      console.error('Failed to fetch recommended products:', error)
    }
  }

  const addToCart = (product: Product) => {
    const variant = product.variants && product.variants.length > 0 ? product.variants[0] : null
    const productToAdd = variant || product
    const productId = variant?.id || product.id
    const productName = normalizeMgDisplay(
      variant ? `${product.name} ${variant.variantName || ''}` : product.name
    )
    const productImage = variant?.variantImageUrl || variant?.imageUrl || product.imageUrl
    const displayPrice = productToAdd.salePrice ?? productToAdd.price
    
    if (productToAdd.outOfStock) {
      return
    }

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
    // Since we don't store category in cart items, we assume any product that's not BAC water
    // is a lyophilized peptide that needs reconstitution
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
    
    setShowBacWaterModal(false)
    router.push('/checkout')
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (cart.length === 0) {
    return (
      <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="glass p-12 rounded-2xl border border-purple-500/20">
            <h1 className="text-5xl font-bold mb-6 gradient-text">Your Cart</h1>
            <p className="text-gray-400 text-xl mb-8">Your cart is empty.</p>
            <Link
              href="/store"
              className="inline-block px-8 py-4 bg-gradient-to-r from-neon-purple to-purple-600 dark:from-purple-700 dark:to-purple-600 text-white font-bold rounded-xl transition-all duration-300 shadow-xl shadow-purple-500/50 dark:shadow-purple-700/50 hover:shadow-purple-500/70 dark:hover:shadow-purple-700/70 hover:scale-105 btn-modern"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-12 gradient-text animate-fade-in">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {cart.map((item, index) => (
              <div
                key={item.id}
                className="glass p-6 rounded-2xl border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 card-hover"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  {item.imageUrl && (
                    <div className="w-32 h-32 sm:w-24 sm:h-24 glass rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={normalizeMgDisplay(item.name)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">{normalizeMgDisplay(item.name)}</h3>
                    <p className="text-purple-600 dark:text-purple-400 font-bold text-lg mb-4">${item.price.toFixed(2)}</p>
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="text-gray-600 dark:text-gray-400 font-semibold">Quantity:</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-4 py-2 glass border border-purple-500/30 dark:border-purple-700/50 hover:border-purple-500 dark:hover:border-purple-500 rounded-xl font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-800 transition-all"
                        >
                          −
                        </button>
                        <span className="w-12 text-center font-bold text-gray-900 dark:text-gray-100">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-4 py-2 glass border border-purple-500/30 dark:border-purple-700/50 hover:border-purple-500 dark:hover:border-purple-500 rounded-xl font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-800 transition-all"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right sm:text-left">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="glass p-8 rounded-2xl border border-purple-500/20 sticky top-24">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Order Summary</h2>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="border-t border-purple-500/20 dark:border-purple-700/50 pt-4">
                  <div className="flex justify-between text-gray-900 dark:text-gray-100 font-bold text-2xl">
                    <span>Total</span>
                    <span className="text-gray-900 dark:text-gray-100 font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleProceedToCheckout}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-700 dark:to-purple-600 text-white font-bold rounded-xl transition-all duration-300 shadow-xl shadow-purple-500/50 dark:shadow-purple-700/50 hover:shadow-purple-500/70 dark:hover:shadow-purple-700/70 hover:scale-105 btn-modern mb-4"
              >
                Proceed to Checkout
              </button>
              <Link
                href="/store"
                className="block text-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        {/* Recommended Products */}
        {recommendedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-8 gradient-text animate-fade-in">Products you might like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedProducts.map((product) => {
                const variant = product.variants && product.variants.length > 0 ? product.variants[0] : null
                const productToDisplay = variant || product
                const displayPrice = productToDisplay.salePrice ?? productToDisplay.price
                const isOnSale = productToDisplay.salePrice !== null
                const productImage = variant?.variantImageUrl || variant?.imageUrl || product.imageUrl
                const displayStock = productToDisplay.stock
                const displayOutOfStock = productToDisplay.outOfStock ?? false
                
                return (
                  <div key={product.id} className="glass p-4 rounded-xl border border-purple-500/20 hover:border-purple-500/50 transition-all">
                    {productImage && (
                      <Link href={`/products/${product.slug}`}>
                        <img
                          src={productImage}
                          alt={normalizeMgDisplay(product.name)}
                          className="w-full aspect-square object-cover rounded-lg mb-3 hover:scale-105 transition-transform"
                        />
                      </Link>
                    )}
                    <div className="space-y-2">
                      <Link href={`/products/${product.slug}`}>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                          {variant ? normalizeMgDisplay(`${product.name} ${variant.variantName || ''}`) : normalizeMgDisplay(product.name)}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2">
                        {isOnSale && (
                          <span className="text-sm text-gray-400 line-through">${productToDisplay.price.toFixed(2)}</span>
                        )}
                        <span className="text-lg font-bold text-pink-600 dark:text-pink-400">
                          ${displayPrice.toFixed(2)}
                        </span>
                      </div>
                      {displayStock !== null && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {displayStock} in stock
                        </p>
                      )}
                      <button
                        onClick={() => addToCart(product)}
                        disabled={displayOutOfStock}
                        className="w-full px-4 py-2 bg-black dark:bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {displayOutOfStock ? 'OUT OF STOCK' : '+ ADD TO CART'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
      <BacWaterModal
        isOpen={showBacWaterModal}
        onClose={() => {
          setShowBacWaterModal(false)
          router.push('/checkout')
        }}
        onAdd={handleAddBacWater}
      />
    </div>
  )
}


