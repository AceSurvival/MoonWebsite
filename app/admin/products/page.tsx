'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'
import { useConfirm } from '@/hooks/useConfirm'

interface Product {
  id: string
  name: string
  price: number
  active: boolean
  createdAt: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { showToast } = useToast()
  const { confirm, ConfirmComponent } = useConfirm()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    confirm(
      'Are you sure you want to delete this product?',
      async () => {
        try {
          const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
          if (res.ok) {
            const data = await res.json()
            if (data.deactivated) {
              showToast('Product deactivated (has existing orders)', 'info')
            } else {
              showToast('Product deleted successfully', 'success')
            }
            fetchProducts()
          } else {
            const errorData = await res.json().catch(() => ({}))
            showToast(errorData.error || 'Failed to delete product', 'error')
          }
        } catch (error) {
          showToast('Failed to delete product', 'error')
        }
      },
      'Delete',
      'Cancel'
    )
  }

  const handleClone = async (id: string) => {
    try {
      // Fetch the full product data
      const res = await fetch(`/api/admin/products/${id}`)
      if (!res.ok) {
        showToast('Failed to fetch product data', 'error')
        return
      }

      const product = await res.json()

      // Create a new product with cloned data
      const clonedProduct = {
        name: `${product.name} (Copy)`,
        slug: '', // Will be auto-generated from name
        description: product.description || '',
        price: product.price || 0,
        category: product.category || '',
        imageUrl: product.imageUrl || null,
        extraImages: product.extraImages || null,
        purity: product.purity || null,
        vialSize: product.vialSize || null,
        stock: product.stock ?? null,
        featured: false, // Reset featured status
        active: product.active !== undefined ? product.active : true,
      }

      const createRes = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clonedProduct),
      })

      if (createRes.ok) {
        const newProduct = await createRes.json()
        showToast('Product cloned successfully', 'success')
        // Redirect to edit the new product
        router.push(`/admin/products/${newProduct.id}/edit`)
      } else {
        const errorData = await createRes.json().catch(() => ({ error: 'Failed to clone product' }))
        console.error('Clone error:', errorData)
        showToast(errorData.error || errorData.message || 'Failed to clone product', 'error')
      }
    } catch (error: any) {
      console.error('Failed to clone product:', error)
      showToast(error.message || 'Failed to clone product', 'error')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <>
      {ConfirmComponent}
      <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold gradient-text">Products</h1>
        <Link
          href="/admin/products/new"
          className="px-4 sm:px-6 py-2 sm:py-3 bg-neon-purple hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap"
        >
          New Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No products yet.</p>
          <Link
            href="/admin/products/new"
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold"
          >
            Create your first product →
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Name
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Price
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase hidden md:table-cell">
                  Created
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-900 dark:text-gray-100 text-sm sm:text-base break-words">{product.name}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-purple-600 dark:text-purple-400 font-semibold text-sm sm:text-base">${product.price.toFixed(2)}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                        product.active
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-600 dark:text-gray-400 text-xs sm:text-sm hidden md:table-cell">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                    <div className="flex justify-end gap-1 sm:gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="px-2 sm:px-3 py-1 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs sm:text-sm rounded transition-colors whitespace-nowrap"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleClone(product.id)}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm rounded transition-colors"
                        title="Clone this product"
                      >
                        Clone
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="px-3 py-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-sm rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </>
  )
}


