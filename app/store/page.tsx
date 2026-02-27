'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  salePrice: number | null
  imageUrl: string | null
  outOfStock: boolean
  stock: number | null
  category: string
  priceRange?: { min: number; max: number } | null
  featuredDisplay?: { displayPrice: number; displayPriceOriginal: number; displayVariantName: string } | null
}

function StoreContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const category = searchParams.get('category') || 'all'
  const sortBy = searchParams.get('sort') || 'newest'
  const page = parseInt(searchParams.get('page') || '1')
  
  const [products, setProducts] = useState<Product[]>([])
  const [categorySettings, setCategorySettings] = useState<Array<{ name: string; icon: string; order: number; active: boolean }>>([])
  const [productSales, setProductSales] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  })

  const fetchCategories = useCallback(async () => {
    try {
      const categoriesRes = await fetch(`/api/store/categories?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategorySettings(categoriesData.categories || [])
      }
    } catch (e) {
      console.error('Failed to fetch categories:', e)
    }
  }, [])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const categoryParam = category !== 'all' ? `&category=${encodeURIComponent(category)}` : ''
        const pageParam = `&page=${page}`
        const [productsRes, salesRes, categoriesRes] = await Promise.all([
          fetch(`/api/store/products?${categoryParam}${pageParam}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          }),
          fetch('/api/store/product-sales', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          }),
          fetch(`/api/store/categories?t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          }),
        ])
        
        if (productsRes.ok) {
          const data = await productsRes.json()
          setProducts(data.products || [])
          if (data.pagination) {
            setPagination(data.pagination)
          }
        }
        
        if (salesRes.ok) {
          const salesData = await salesRes.json()
          setProductSales(salesData.productSales || {})
        }
        
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategorySettings(categoriesData.categories || [])
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [category, page])

  // Refetch categories when tab becomes visible (e.g. after editing in admin)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchCategories()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [fetchCategories])

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', newSort)
    params.set('page', '1') // Reset to first page when sorting changes
    router.push(`/store?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`/store?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        const priceA = a.salePrice ?? a.price
        const priceB = b.salePrice ?? b.price
        return priceA - priceB
      case 'price-high':
        const priceAHigh = a.salePrice ?? a.price
        const priceBHigh = b.salePrice ?? b.price
        return priceBHigh - priceAHigh
      case 'name':
        return a.name.localeCompare(b.name)
      case 'stock':
        const stockA = a.stock ?? Infinity
        const stockB = b.stock ?? Infinity
        return stockB - stockA
      case 'bestsellers':
        const salesA = productSales[a.id] || 0
        const salesB = productSales[b.id] || 0
        return salesB - salesA
      case 'newest':
      default:
        // Default to alphabetical order (products are already sorted alphabetically from API)
        return a.name.localeCompare(b.name)
    }
  })

  // Use only managed categories from admin panel (which already includes all product categories)
  // Filter to only active categories and sort by order
  const sortedCategories = categorySettings
    .filter(cat => cat.active)
    .sort((a, b) => (a.order || 999) - (b.order || 999))

  return (
    <div className="min-h-screen py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 text-gray-900 dark:text-gray-50 tracking-tight">Store</h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-6">Browse our complete collection of research peptides</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All products are for laboratory research use only. Not for human consumption, medical use, veterinary use, or household use.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Sidebar - Categories */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="glass p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 lg:sticky lg:top-24">
              <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-gray-50">Categories</h2>
              <nav className="space-y-2">
                <Link
                  href="/store?page=1"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                    category === 'all'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">📦</span>
                  <span className="flex-1">All Products</span>
                  {category === 'all' && <span className="ml-auto text-xs flex-shrink-0">✓</span>}
                </Link>
                {sortedCategories.map((cat) => {
                  return (
                    <Link
                      key={cat.name}
                      href={`/store?category=${encodeURIComponent(cat.name)}&page=1`}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                        category === cat.name
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="text-lg flex-shrink-0">{cat.icon}</span>
                      <span className="flex-1">{cat.name}</span>
                      {category === cat.name && <span className="ml-auto text-xs flex-shrink-0">✓</span>}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1">
            {/* Sort Controls */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="text-gray-700 dark:text-gray-300 font-medium text-sm">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-4 py-2 text-sm glass border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-500 transition-all"
                >
                  <option value="newest">Newest</option>
                  <option value="bestsellers">Best Sellers</option>
                  <option value="price-low">Lowest Price</option>
                  <option value="price-high">Highest Price</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="stock">Stock</option>
                </select>
              </div>
            </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="glass p-12 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 max-w-md mx-auto">
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-2 font-medium">No products found.</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">Try selecting a different category.</p>
            </div>
          </div>
        ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
                
                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPreviousPage}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                        pagination.hasPreviousPage
                          ? 'glass border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          : 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600'
                      }`}
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => {
                        // Show first page, last page, current page, and pages around current
                        const showPage = 
                          pageNum === 1 ||
                          pageNum === pagination.totalPages ||
                          (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                        
                        if (!showPage) {
                          // Show ellipsis
                          if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                            return <span key={pageNum} className="px-2 text-gray-400 dark:text-gray-500">...</span>
                          }
                          return null
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 min-w-[40px] ${
                              pageNum === pagination.page
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'glass border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNextPage}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                        pagination.hasNextPage
                          ? 'glass border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          : 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
                
                {/* Page Info */}
                {pagination.totalCount > 0 && (
                  <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    Showing {((pagination.page - 1) * 12) + 1} to {Math.min(pagination.page * 12, pagination.totalCount)} of {pagination.totalCount} products
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <StoreContent />
    </Suspense>
  )
}
