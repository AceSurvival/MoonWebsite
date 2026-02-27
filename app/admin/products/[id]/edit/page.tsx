'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ToastProvider'
import { slugify } from '@/lib/client-utils'
import RichTextEditor from '@/components/RichTextEditor'

interface Variant {
  id: string
  variantName: string | null
  price: number
  salePrice: number | null
  variantImageUrl: string | null
  imageUrl: string | null
  stock: number | null
  outOfStock: boolean
  sortOrder: number | null
  active: boolean
}

interface EditingVariantForm {
  variantName: string
  price: string
  salePrice: string
  stock: string
  outOfStock: boolean
  active: boolean
  variantImageUrl: string
  imageUrl: string
}

interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription: string | null
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
  featured: boolean
  active: boolean
  parentProductId: string | null
  variantName: string | null
  variantImageUrl: string | null
  variants?: Variant[]
}

function EditProductPageContent() {
  const router = useRouter()
  const params = useParams()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [uploadingMainImage, setUploadingMainImage] = useState(false)
  const [uploadingVariantImage, setUploadingVariantImage] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: '',
    salePrice: '',
    category: '',
    imageUrl: '',
    extraImages: '',
    purity: '',
    vialSize: '',
    coaLink: '',
    codename: '',
    stock: '',
    outOfStock: false,
    featured: false,
    active: true,
    parentProductId: '',
    variantName: '',
    variantImageUrl: '',
  })
  const [variants, setVariants] = useState<Variant[]>([])
  const [showAddVariant, setShowAddVariant] = useState(false)
  const [creatingVariant, setCreatingVariant] = useState(false)
  const [uploadingNewVariantImage, setUploadingNewVariantImage] = useState(false)
  const [draggedVariant, setDraggedVariant] = useState<string | null>(null)
  const [reorderingVariants, setReorderingVariants] = useState(false)
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set())
  const [editingVariants, setEditingVariants] = useState<Record<string, Partial<EditingVariantForm>>>({})
  const [uploadingVariantImages, setUploadingVariantImages] = useState<Record<string, boolean>>({})
  const [savingVariant, setSavingVariant] = useState<string | null>(null)
  const [newVariant, setNewVariant] = useState({
    variantName: '',
    price: '',
    salePrice: '',
    stock: '',
    outOfStock: false,
    active: true,
    variantImageUrl: '',
  })

  useEffect(() => {
    try {
      console.log('EditProductPage mounted, params:', params)
      if (params.id && typeof params.id === 'string') {
        setDebugInfo(`Fetching product with ID: ${params.id}`)
        fetchProduct()
      } else {
        const errorMsg = `Invalid product ID: ${JSON.stringify(params.id)}`
        console.error(errorMsg)
        setError(errorMsg)
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Error in useEffect:', err)
      setError(`Initialization error: ${err?.message || 'Unknown error'}`)
      setLoading(false)
    }
  }, [params.id])

  const fetchProduct = async () => {
    try {
      console.log('Fetching product:', params.id)
      const productId = params.id as string
      const res = await fetch(`/api/admin/products/${productId}`, {
        cache: 'no-store',
        credentials: 'include',
      })
      console.log('Fetch response status:', res.status)
      
      if (res.ok) {
        const product: Product = await res.json()
        console.log('Product loaded:', product.name)
        setFormData({
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDescription: product.shortDescription || '',
          price: product.price.toString(),
          salePrice: product.salePrice?.toString() || '',
          category: product.category,
          imageUrl: product.imageUrl || '',
          extraImages: product.extraImages || '',
          purity: product.purity || '',
          vialSize: product.vialSize || '',
          coaLink: product.coaLink || '',
          codename: product.codename || '',
          stock: product.stock?.toString() || '',
          outOfStock: product.outOfStock,
          featured: product.featured,
          active: product.active,
          parentProductId: product.parentProductId || '',
          variantName: product.variantName || '',
          variantImageUrl: product.variantImageUrl || '',
        })
        if (product.variants) {
          setVariants(product.variants)
        }
        setError(null)
        setDebugInfo('')
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to load product' }))
        const errorMessage = errorData.error || `Failed to load product (Status: ${res.status})`
        console.error('Fetch error:', errorMessage)
        setError(errorMessage)
        setDebugInfo(`API returned status ${res.status}`)
        showToast(errorMessage, 'error')
        setTimeout(() => {
          router.push('/admin/products')
        }, 2000)
      }
    } catch (error: any) {
      console.error('Failed to fetch product:', error)
      const errorMessage = error?.message || 'Failed to load product'
      setError(errorMessage)
      setDebugInfo(`Exception: ${errorMessage}`)
      showToast(errorMessage, 'error')
      setTimeout(() => {
        router.push('/admin/products')
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'main' | 'variant') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size too large. Maximum size is 10MB.', 'error')
      return
    }

    if (imageType === 'main') {
      setUploadingMainImage(true)
    } else {
      setUploadingVariantImage(true)
    }

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', imageType === 'main' ? 'product' : 'variant')

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (res.ok) {
        const data = await res.json()
        if (imageType === 'main') {
          setFormData({ ...formData, imageUrl: data.url })
        } else {
          setFormData({ ...formData, variantImageUrl: data.url })
        }
        showToast('Image uploaded successfully!', 'success')
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to upload image', 'error')
      }
    } catch (error) {
      showToast('Failed to upload image', 'error')
    } finally {
      if (imageType === 'main') {
        setUploadingMainImage(false)
      } else {
        setUploadingVariantImage(false)
      }
      // Reset file input
      e.target.value = ''
    }
  }

  const handleCreateVariant = async () => {
    if (!newVariant.variantName.trim()) {
      showToast('Variant name is required', 'error')
      return
    }

    setCreatingVariant(true)
    try {
      const variantData: any = {
        variantName: newVariant.variantName.trim(),
        price: newVariant.price ? parseFloat(newVariant.price) : formData.price ? parseFloat(formData.price) : 0,
        salePrice: newVariant.salePrice ? parseFloat(newVariant.salePrice) : null,
        stock: newVariant.stock ? parseInt(newVariant.stock) : null,
        outOfStock: newVariant.outOfStock,
        active: newVariant.active,
        variantImageUrl: newVariant.variantImageUrl.trim() || null,
      }

      const res = await fetch(`/api/admin/products/${params.id}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variantData),
      })

      if (res.ok) {
        const createdVariant = await res.json()
        showToast('Variant created successfully', 'success')
        setShowAddVariant(false)
        setNewVariant({
          variantName: '',
          price: '',
          salePrice: '',
          stock: '',
          outOfStock: false,
          active: true,
          variantImageUrl: '',
        })
        // Refresh product to get updated variants list
        fetchProduct()
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to create variant', 'error')
      }
    } catch (error) {
      console.error('Failed to create variant:', error)
      showToast('Failed to create variant', 'error')
    } finally {
      setCreatingVariant(false)
    }
  }

  const toggleVariantExpanded = (variantId: string) => {
    setExpandedVariants(prev => {
      const newSet = new Set(prev)
      if (newSet.has(variantId)) {
        newSet.delete(variantId)
        // Clear editing state when collapsing
        setEditingVariants(prev => {
          const updated = { ...prev }
          delete updated[variantId]
          return updated
        })
      } else {
        newSet.add(variantId)
        // Initialize editing state with current variant data
        const variant = variants.find(v => v.id === variantId)
        if (variant) {
          setEditingVariants(prev => ({
            ...prev,
            [variantId]: {
              variantName: variant.variantName || '',
              price: variant.price.toString(),
              salePrice: variant.salePrice?.toString() || '',
              stock: variant.stock?.toString() || '',
              outOfStock: variant.outOfStock,
              active: variant.active,
              variantImageUrl: variant.variantImageUrl || '',
              imageUrl: variant.imageUrl || formData.imageUrl, // Inherit from parent if not set
            }
          }))
        }
      }
      return newSet
    })
  }

  const updateEditingVariant = (variantId: string, updates: Partial<EditingVariantForm>) => {
    setEditingVariants(prev => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        ...updates,
      }
    }))
  }

  const handleSaveVariant = async (variantId: string) => {
    const editingVariant = editingVariants[variantId]
    if (!editingVariant?.variantName?.trim()) {
      showToast('Variant name is required', 'error')
      return
    }

    setSavingVariant(variantId)
    try {
      const variantData: any = {
        variantName: editingVariant.variantName.trim(),
        price: editingVariant.price ? parseFloat(editingVariant.price) : 0,
        salePrice: editingVariant.salePrice ? parseFloat(editingVariant.salePrice) : null,
        stock: editingVariant.stock ? parseInt(editingVariant.stock) : null,
        outOfStock: editingVariant.outOfStock || false,
        active: editingVariant.active !== undefined ? editingVariant.active : true,
        variantImageUrl: editingVariant.variantImageUrl?.trim() || null,
        imageUrl: editingVariant.imageUrl?.trim() || formData.imageUrl || null, // Persist main image
      }

      const res = await fetch(`/api/admin/products/${variantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variantData),
      })

      if (res.ok) {
        showToast('Variant updated successfully', 'success')
        // Refresh product to get updated data
        fetchProduct()
        // Keep the variant expanded after save
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to update variant', 'error')
      }
    } catch (error) {
      console.error('Failed to update variant:', error)
      showToast('Failed to update variant', 'error')
    } finally {
      setSavingVariant(null)
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/products/${variantId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        showToast('Variant deleted successfully', 'success')
        // Refresh product to get updated variants list
        fetchProduct()
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to delete variant', 'error')
      }
    } catch (error) {
      console.error('Failed to delete variant:', error)
      showToast('Failed to delete variant', 'error')
    }
  }

  const handleDragStart = (variantId: string) => {
    setDraggedVariant(variantId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (targetVariantId: string) => {
    if (!draggedVariant || draggedVariant === targetVariantId) {
      setDraggedVariant(null)
      return
    }

    const draggedIndex = variants.findIndex(v => v.id === draggedVariant)
    const targetIndex = variants.findIndex(v => v.id === targetVariantId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedVariant(null)
      return
    }

    // Reorder variants
    const newVariants = [...variants]
    const [removed] = newVariants.splice(draggedIndex, 1)
    newVariants.splice(targetIndex, 0, removed)

    // Update sortOrder for all variants
    const variantsWithOrder = newVariants.map((variant, index) => ({
      ...variant,
      sortOrder: index,
    }))

    setVariants(variantsWithOrder)
    setDraggedVariant(null)

    // Save to server
    setReorderingVariants(true)
    try {
      const res = await fetch(`/api/admin/products/${params.id}/variants/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variants: variantsWithOrder.map(v => ({ id: v.id, sortOrder: v.sortOrder || 0 })),
        }),
      })

      if (res.ok) {
        showToast('Variant order updated', 'success')
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to update variant order', 'error')
        // Revert on error
        fetchProduct()
      }
    } catch (error) {
      console.error('Failed to update variant order:', error)
      showToast('Failed to update variant order', 'error')
      // Revert on error
      fetchProduct()
    } finally {
      setReorderingVariants(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Validate extraImages JSON if provided
      let extraImagesValue = null
      if (formData.extraImages.trim()) {
        try {
          const parsed = JSON.parse(formData.extraImages.trim())
          if (!Array.isArray(parsed)) {
            showToast('Extra images must be a JSON array', 'error')
            setSaving(false)
            return
          }
          extraImagesValue = formData.extraImages.trim()
        } catch {
          showToast('Invalid JSON format for extra images', 'error')
          setSaving(false)
          return
        }
      }

      const productData: any = {
        name: formData.name,
        slug: formData.slug.trim() || slugify(formData.name),
        description: formData.description,
        shortDescription: formData.shortDescription.trim() || null,
        price: parseFloat(formData.price),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
        category: formData.category,
        imageUrl: formData.imageUrl.trim() || null,
        extraImages: extraImagesValue,
        purity: formData.purity.trim() || null,
        vialSize: formData.vialSize.trim() || null,
        coaLink: formData.coaLink.trim() || null,
        codename: formData.codename.trim() || null,
        stock: formData.stock ? parseInt(formData.stock) : null,
        outOfStock: formData.outOfStock,
        featured: formData.featured,
        active: formData.active,
        parentProductId: formData.parentProductId || null,
        variantName: formData.variantName.trim() || null,
        variantImageUrl: formData.variantImageUrl.trim() || null,
      }

      const res = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })

      if (res.ok) {
        showToast('Product updated successfully', 'success')
        router.push('/admin/products')
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to update product', 'error')
      }
    } catch (error) {
      console.error('Failed to update product:', error)
      showToast('Failed to update product', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">Error Loading Product</h2>
          <p className="text-red-700 dark:text-red-300 mb-2">{error}</p>
          {debugInfo && (
            <p className="text-red-600 dark:text-red-400 text-sm mb-4">Debug: {debugInfo}</p>
          )}
          <p className="text-red-600 dark:text-red-400 text-sm mb-4">
            Product ID: {params.id ? JSON.stringify(params.id) : 'undefined'}
          </p>
          <button
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 gradient-text">Edit Product</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm space-y-6">
        <div>
          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
          />
        </div>

        <div>
          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Slug *</label>
          <input
            type="text"
            required
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="auto-generated-from-name"
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 font-mono"
          />
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">URL-friendly identifier (leave empty to auto-generate from name)</p>
        </div>

        <div>
          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Description *</label>
          <RichTextEditor
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            placeholder="Enter product description..."
          />
        </div>

        <div>
          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Short Description</label>
          <textarea
            value={formData.shortDescription}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            placeholder="Enter a short description for product cards (displayed in store menu before clicking product)..."
            rows={3}
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 resize-none"
          />
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">This will be displayed on product cards in the store. If left empty, will extract from full description.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Price ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
            />
          </div>

          <div>
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Sale Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.salePrice}
              onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
              placeholder="Leave empty if not on sale"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Category *</label>
          <input
            type="text"
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
          />
        </div>

        {/* Variant Info (if this is a variant) */}
        {formData.parentProductId && (
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Variant Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Variant Name (e.g., "10mg", "20mg")</label>
                <input
                  type="text"
                  value={formData.variantName}
                  onChange={(e) => setFormData({ ...formData, variantName: e.target.value })}
                  placeholder="10mg"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Variant-Specific Image</label>
                
                {/* File Upload */}
                <div className="mb-3">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Upload Variant Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'variant')}
                    disabled={uploadingVariantImage}
                    className="block w-full text-sm text-gray-900 dark:text-gray-100
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-purple-50 dark:file:bg-purple-900/30
                      file:text-purple-700 dark:file:text-purple-300
                      hover:file:bg-purple-100 dark:hover:file:bg-purple-900/50
                      file:cursor-pointer
                      disabled:opacity-50 disabled:cursor-not-allowed
                      cursor-pointer"
                  />
                  {uploadingVariantImage && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Uploading...</p>
                  )}
                </div>

                {/* URL Input (alternative) */}
                <div className="mb-3">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Or enter Variant Image URL</label>
                  <input
                    type="url"
                    value={formData.variantImageUrl}
                    onChange={(e) => setFormData({ ...formData, variantImageUrl: e.target.value })}
                    placeholder="https://example.com/variant-image.jpg"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
                  />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">This image will be shown when this variant is selected</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Main Image</label>
          
          {/* File Upload */}
          <div className="mb-3">
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Upload Main Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'main')}
              disabled={uploadingMainImage}
              className="block w-full text-sm text-gray-900 dark:text-gray-100
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-purple-50 dark:file:bg-purple-900/30
                file:text-purple-700 dark:file:text-purple-300
                hover:file:bg-purple-100 dark:hover:file:bg-purple-900/50
                file:cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed
                cursor-pointer"
            />
            {uploadingMainImage && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Uploading...</p>
            )}
          </div>

          {/* URL Input (alternative) */}
          <div className="mb-3">
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Or enter Main Image URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
            />
          </div>
        </div>
        
        {/* Variants Section (only show if this is a parent product, not a variant itself) */}
        {!formData.parentProductId && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Product Variants {variants.length > 0 && `(${variants.length})`}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddVariant(!showAddVariant)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                {showAddVariant ? 'Cancel' : '+ Add Variant'}
              </button>
            </div>

            {/* Add Variant Form */}
            {showAddVariant && (
              <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-300 dark:border-blue-600">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Create New Variant</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Variant Name * (e.g., "10mg", "20mg")</label>
                    <input
                      type="text"
                      value={newVariant.variantName}
                      onChange={(e) => setNewVariant({ ...newVariant, variantName: e.target.value })}
                      placeholder="10mg"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newVariant.price}
                        onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                        placeholder={formData.price || "0.00"}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Sale Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newVariant.salePrice}
                        onChange={(e) => setNewVariant({ ...newVariant, salePrice: e.target.value })}
                        placeholder="Optional"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={newVariant.stock}
                      onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                      placeholder="Leave empty for unlimited"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Variant Image</label>
                    
                    {/* File Upload */}
                    <div className="mb-2">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Upload Variant Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return

                          if (!file.type.startsWith('image/')) {
                            showToast('Please select an image file', 'error')
                            return
                          }

                          if (file.size > 10 * 1024 * 1024) {
                            showToast('File size too large. Maximum size is 10MB.', 'error')
                            return
                          }

                          setUploadingNewVariantImage(true)
                          try {
                            const uploadFormData = new FormData()
                            uploadFormData.append('file', file)
                            uploadFormData.append('type', 'variant')

                            const res = await fetch('/api/admin/upload', {
                              method: 'POST',
                              body: uploadFormData,
                            })

                            if (res.ok) {
                              const data = await res.json()
                              setNewVariant({ ...newVariant, variantImageUrl: data.url })
                              showToast('Image uploaded successfully!', 'success')
                            } else {
                              const error = await res.json()
                              showToast(error.error || 'Failed to upload image', 'error')
                            }
                          } catch (error) {
                            showToast('Failed to upload image', 'error')
                          } finally {
                            setUploadingNewVariantImage(false)
                            e.target.value = ''
                          }
                        }}
                        disabled={uploadingNewVariantImage}
                        className="block w-full text-xs text-gray-900 dark:text-gray-100
                          file:mr-4 file:py-1 file:px-3
                          file:rounded-lg file:border-0
                          file:text-xs file:font-semibold
                          file:bg-blue-50 dark:file:bg-blue-900/30
                          file:text-blue-700 dark:file:text-blue-300
                          hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50
                          file:cursor-pointer
                          disabled:opacity-50 disabled:cursor-not-allowed
                          cursor-pointer"
                      />
                      {uploadingNewVariantImage && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Uploading...</p>
                      )}
                    </div>

                    {/* URL Input (alternative) */}
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Or enter Variant Image URL</label>
                      <input
                        type="url"
                        value={newVariant.variantImageUrl}
                        onChange={(e) => setNewVariant({ ...newVariant, variantImageUrl: e.target.value })}
                        placeholder="Optional - variant-specific image"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newVariant.outOfStock}
                        onChange={(e) => setNewVariant({ ...newVariant, outOfStock: e.target.checked })}
                        className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Out of Stock</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newVariant.active}
                        onChange={(e) => setNewVariant({ ...newVariant, active: e.target.checked })}
                        className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateVariant}
                    disabled={creatingVariant}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingVariant ? 'Creating...' : 'Create Variant'}
                  </button>
                </div>
              </div>
            )}

            {/* Existing Variants List */}
            {variants.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Click to expand and edit variants. Multiple variants can be edited at once. Drag and drop to reorder.
                </p>
                {variants.map((variant, index) => {
                  const isExpanded = expandedVariants.has(variant.id)
                  const editingVariant = editingVariants[variant.id] || {}
                  const isUploading = uploadingVariantImages[variant.id] || false
                  
                  return (
                    <div key={variant.id} className="border border-blue-200 dark:border-blue-700 rounded-lg overflow-hidden">
                      {/* Variant Header - Always Visible */}
                      <div
                        draggable={!reorderingVariants && !isExpanded}
                        onDragStart={() => handleDragStart(variant.id)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(variant.id)}
                        className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-800 transition-all ${
                          draggedVariant === variant.id ? 'opacity-50' : 'hover:bg-blue-50 dark:hover:bg-gray-700'
                        } ${reorderingVariants ? 'opacity-50 cursor-wait' : isExpanded ? 'cursor-default' : 'cursor-move'}`}
                      >
                        {/* Drag Handle */}
                        <div className="flex flex-col gap-1 text-gray-400 dark:text-gray-500">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M7 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
                          </svg>
                        </div>
                        
                        {/* Variant Info */}
                        <div className="flex-1 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{variant.variantName}</span>
                            <span className="ml-2 text-gray-600 dark:text-gray-400">
                              - ${(variant.salePrice ?? variant.price).toFixed(2)}
                            </span>
                            {variant.outOfStock && (
                              <span className="ml-2 text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">Out of Stock</span>
                            )}
                            {!variant.active && (
                              <span className="ml-2 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">Inactive</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Expand/Collapse Button */}
                        <button
                          type="button"
                          onClick={() => toggleVariantExpanded(variant.id)}
                          disabled={reorderingVariants}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              Collapse
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              Edit
                            </>
                          )}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleDeleteVariant(variant.id)}
                          disabled={reorderingVariants || isExpanded}
                          className="px-3 py-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </div>
                      
                      {/* Edit Form - Collapsible */}
                      {isExpanded && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-blue-200 dark:border-blue-700">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Variant Name *</label>
                              <input
                                type="text"
                                value={editingVariant.variantName || ''}
                                onChange={(e) => updateEditingVariant(variant.id, { variantName: e.target.value })}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Price ($)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editingVariant.price || ''}
                                  onChange={(e) => updateEditingVariant(variant.id, { price: e.target.value })}
                                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Sale Price ($)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editingVariant.salePrice || ''}
                                  onChange={(e) => updateEditingVariant(variant.id, { salePrice: e.target.value })}
                                  placeholder="Optional"
                                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Stock</label>
                              <input
                                type="number"
                                min="0"
                                value={editingVariant.stock || ''}
                                onChange={(e) => updateEditingVariant(variant.id, { stock: e.target.value })}
                                placeholder="Leave empty for unlimited"
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Variant Image</label>
                              
                              {/* File Upload */}
                              <div className="mb-2">
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Upload Variant Image</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return

                                    if (!file.type.startsWith('image/')) {
                                      showToast('Please select an image file', 'error')
                                      return
                                    }

                                    if (file.size > 10 * 1024 * 1024) {
                                      showToast('File size too large. Maximum size is 10MB.', 'error')
                                      return
                                    }

                                    setUploadingVariantImages(prev => ({ ...prev, [variant.id]: true }))
                                    try {
                                      const uploadFormData = new FormData()
                                      uploadFormData.append('file', file)
                                      uploadFormData.append('type', 'variant')

                                      const res = await fetch('/api/admin/upload', {
                                        method: 'POST',
                                        body: uploadFormData,
                                      })

                                      if (res.ok) {
                                        const data = await res.json()
                                        updateEditingVariant(variant.id, { variantImageUrl: data.url })
                                        showToast('Image uploaded successfully!', 'success')
                                      } else {
                                        const error = await res.json()
                                        showToast(error.error || 'Failed to upload image', 'error')
                                      }
                                    } catch (error) {
                                      showToast('Failed to upload image', 'error')
                                    } finally {
                                      setUploadingVariantImages(prev => ({ ...prev, [variant.id]: false }))
                                      e.target.value = ''
                                    }
                                  }}
                                  disabled={isUploading}
                                  className="block w-full text-xs text-gray-900 dark:text-gray-100
                                    file:mr-4 file:py-1 file:px-3
                                    file:rounded-lg file:border-0
                                    file:text-xs file:font-semibold
                                    file:bg-blue-50 dark:file:bg-blue-900/30
                                    file:text-blue-700 dark:file:text-blue-300
                                    hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50
                                    file:cursor-pointer
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    cursor-pointer"
                                />
                                {isUploading && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Uploading...</p>
                                )}
                              </div>

                              {/* URL Input */}
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Or enter Variant Image URL</label>
                                <input
                                  type="url"
                                  value={editingVariant.variantImageUrl || ''}
                                  onChange={(e) => updateEditingVariant(variant.id, { variantImageUrl: e.target.value })}
                                  placeholder="Optional - variant-specific image"
                                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                                />
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Main image: {editingVariant.imageUrl || formData.imageUrl || 'None (inherits from parent)'}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={editingVariant.outOfStock || false}
                                  onChange={(e) => updateEditingVariant(variant.id, { outOfStock: e.target.checked })}
                                  className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Out of Stock</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={editingVariant.active !== undefined ? editingVariant.active : true}
                                  onChange={(e) => updateEditingVariant(variant.id, { active: e.target.checked })}
                                  className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                              </label>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSaveVariant(variant.id)}
                              disabled={savingVariant === variant.id}
                              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              {savingVariant === variant.id ? 'Saving...' : 'Save Variant'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No variants yet. Click "Add Variant" to create one.
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Extra Images (JSON array)</label>
          <textarea
            rows={3}
            value={formData.extraImages}
            onChange={(e) => setFormData({ ...formData, extraImages: e.target.value })}
            placeholder='["https://example.com/image1.jpg", "https://example.com/image2.jpg"]'
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 resize-none font-mono text-sm"
          />
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">JSON array of image URLs</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Purity</label>
            <input
              type="text"
              value={formData.purity}
              onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
              placeholder="e.g., 99%"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
            />
          </div>

          <div>
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Vial Size</label>
            <input
              type="text"
              value={formData.vialSize}
              onChange={(e) => setFormData({ ...formData, vialSize: e.target.value })}
              placeholder="e.g., 10mg"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">COA Link</label>
            <input
              type="url"
              value={formData.coaLink}
              onChange={(e) => setFormData({ ...formData, coaLink: e.target.value })}
              placeholder="https://example.com/coa.pdf"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
            />
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Certificate of Analysis link</p>
          </div>

          <div>
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Codename</label>
            <input
              type="text"
              value={formData.codename}
              onChange={(e) => setFormData({ ...formData, codename: e.target.value })}
              placeholder="e.g., Reta, Tirz"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
            />
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Short code name for product</p>
          </div>
        </div>

        <div>
          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Stock</label>
          <input
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            placeholder="Leave empty for unlimited"
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
          />
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Leave empty for unlimited stock</p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.outOfStock}
            onChange={(e) => setFormData({ ...formData, outOfStock: e.target.checked })}
            className="mr-2 w-4 h-4 text-purple-600 dark:text-purple-400 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 dark:focus:ring-purple-400"
          />
          <label className="text-gray-900 dark:text-gray-100 font-semibold">Out of Stock</label>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="mr-2 w-4 h-4 text-purple-600 dark:text-purple-400 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 dark:focus:ring-purple-400"
            />
            <span className="text-gray-900 dark:text-gray-100 font-semibold">Featured</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="mr-2 w-4 h-4 text-purple-600 dark:text-purple-400 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 dark:focus:ring-purple-400"
            />
            <span className="text-gray-900 dark:text-gray-100 font-semibold">Active</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-neon-purple hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Product'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default function EditProductPage() {
  try {
    return <EditProductPageContent />
  } catch (error: any) {
    console.error('Error rendering EditProductPage:', error)
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">Error Loading Page</h2>
          <p className="text-red-700 dark:text-red-300 mb-4">
            {error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.href = '/admin/products'}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
  }
}
