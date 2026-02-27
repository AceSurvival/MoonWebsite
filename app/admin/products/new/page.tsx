'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'
import { slugify } from '@/lib/client-utils'
import RichTextEditor from '@/components/RichTextEditor'

export default function NewProductPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [uploadingMainImage, setUploadingMainImage] = useState(false)
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
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingMainImage(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'product')

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (res.ok) {
        const data = await res.json()
        setFormData({ ...formData, imageUrl: data.url })
        showToast('Image uploaded successfully!', 'success')
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to upload image', 'error')
      }
    } catch (error) {
      showToast('Failed to upload image', 'error')
    } finally {
      setUploadingMainImage(false)
      // Reset file input
      e.target.value = ''
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
      }

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })

      if (res.ok) {
        showToast('Product created successfully', 'success')
        router.push('/admin/products')
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to create product', 'error')
      }
    } catch (error) {
      console.error('Failed to create product:', error)
      showToast('Failed to create product', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 gradient-text">New Product</h1>

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
          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Slug</label>
          <input
            type="text"
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

        <div>
          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Main Image</label>
          
          {/* File Upload */}
          <div className="mb-3">
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Upload Main Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
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
            {saving ? 'Creating...' : 'Create Product'}
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

