'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ToastProvider'

interface Category {
  id: string
  name: string
  icon: string
  order: number
  active: boolean
}

export default function AdminCategoriesPage() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📋', active: true })
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null)
  const [editingCategories, setEditingCategories] = useState<Record<string, Partial<Category>>>({})
  const [saveTimeouts, setSaveTimeouts] = useState<Record<string, NodeJS.Timeout>>({})
  const [savingCategories, setSavingCategories] = useState<Set<string>>(new Set())
  const [savedCategories, setSavedCategories] = useState<Set<string>>(new Set())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Set<string>>(new Set())

  useEffect(() => {
    let mounted = true
    
    const loadCategories = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/admin/categories?t=${Date.now()}`, {
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        
        if (!mounted) return
        
        if (res.ok) {
          const data = await res.json()
          console.log('Categories fetched:', data)
          setCategories(data.categories || [])
        } else {
          // Try to parse error, but handle non-JSON responses
          let errorMessage = 'Failed to load categories'
          try {
            const error = await res.json()
            errorMessage = error.error || errorMessage
            console.error('Failed to fetch categories:', error)
          } catch (e) {
            // Response might not be JSON
            const text = await res.text()
            console.error('Failed to fetch categories - non-JSON response:', res.status, text)
            if (res.status === 401) {
              errorMessage = 'Unauthorized - Please log in'
            } else if (res.status === 403) {
              errorMessage = 'Forbidden - Access denied'
            }
          }
          if (mounted) {
            showToast(errorMessage, 'error')
          }
        }
      } catch (error: any) {
        if (!mounted) return
        console.error('Failed to fetch categories - network error:', error)
        showToast(error?.message || 'Failed to load categories - Network error', 'error')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    loadCategories()
    
    // Fallback timeout - if loading takes too long, show error
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.error('Categories fetch timed out')
        showToast('Loading categories timed out. Please refresh the page.', 'error')
        setLoading(false)
      }
    }, 10000) // 10 second timeout
    
    // Cleanup timeouts on unmount
    return () => {
      mounted = false
      clearTimeout(timeoutId)
      Object.values(saveTimeouts).forEach(timeout => clearTimeout(timeout))
    }
  }, [showToast])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/categories?t=${Date.now()}`, {
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (res.ok) {
        const data = await res.json()
        console.log('Categories fetched:', data)
        setCategories(data.categories || [])
      } else {
        // Try to parse error, but handle non-JSON responses
        let errorMessage = 'Failed to load categories'
        try {
          const error = await res.json()
          errorMessage = error.error || errorMessage
          console.error('Failed to fetch categories:', error)
        } catch (e) {
          // Response might not be JSON
          const text = await res.text()
          console.error('Failed to fetch categories - non-JSON response:', res.status, text)
          if (res.status === 401) {
            errorMessage = 'Unauthorized - Please log in'
          } else if (res.status === 403) {
            errorMessage = 'Forbidden - Access denied'
          }
        }
        showToast(errorMessage, 'error')
      }
    } catch (error: any) {
      console.error('Failed to fetch categories - network error:', error)
      showToast(error?.message || 'Failed to load categories - Network error', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      showToast('Category name is required', 'error')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
        credentials: 'include',
      })

      if (res.ok) {
        showToast('Category added successfully', 'success')
        setNewCategory({ name: '', icon: '📋', active: true })
        fetchCategories()
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to add category', 'error')
      }
    } catch (error) {
      showToast('Failed to add category', 'error')
    } finally {
      setSaving(false)
    }
  }

  const saveCategoryUpdate = async (id: string, updates: Partial<Category>, showSuccessToast: boolean = false) => {
    // Prevent concurrent saves for the same category
    if (savingCategories.has(id)) {
      return
    }

    // Get the current category state and merge with updates
    const currentCategory = categories.find(c => c.id === id)
    if (!currentCategory) {
      console.error('Category not found:', id)
      return
    }

    // Merge current state with updates to ensure we send complete data
    const fullCategory = { ...currentCategory, ...updates }

    setSavingCategories(prev => new Set(prev).add(id))
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullCategory),
        credentials: 'include',
      })

      if (res.ok) {
        if (showSuccessToast) {
          showToast('Category updated successfully', 'success')
        }
        // Mark as saved and clear unsaved changes
        setSavedCategories(prev => new Set(prev).add(id))
        setHasUnsavedChanges(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
        setTimeout(() => {
          setSavedCategories(prev => {
            const newSet = new Set(prev)
            newSet.delete(id)
            return newSet
          })
        }, 2000)
        fetchCategories()
      } else {
        const error = await res.json()
        if (res.status === 429) {
          showToast('Too many requests. Please try again in a moment.', 'error')
        } else {
          showToast(error.error || 'Failed to update category', 'error')
        }
        fetchCategories() // Revert on error
      }
    } catch (error) {
      showToast('Failed to update category', 'error')
      fetchCategories() // Revert on error
    } finally {
      setSaving(false)
      setSavingCategories(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleUpdateCategory = (id: string, updates: Partial<Category>, immediate: boolean = false) => {
    // Update local state immediately for responsive UI
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, ...updates } : cat
    ))

    // If immediate (like checkbox), save right away
    if (immediate) {
      // Clear any pending timeout
      if (saveTimeouts[id]) {
        clearTimeout(saveTimeouts[id])
        setSaveTimeouts(prev => {
          const newTimeouts = { ...prev }
          delete newTimeouts[id]
          return newTimeouts
        })
      }
      // Clear editing state
      setEditingCategories(prev => {
        const newEditing = { ...prev }
        delete newEditing[id]
        return newEditing
      })
      saveCategoryUpdate(id, updates, true)
      return
    }

    // Mark as having unsaved changes
    setHasUnsavedChanges(prev => new Set(prev).add(id))
    
    // Store updates for debouncing
    setEditingCategories(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }))

    // Clear any existing timeout for this category
    if (saveTimeouts[id]) {
      clearTimeout(saveTimeouts[id])
    }

    // Debounce the API call - wait 1.5 seconds after last change
    const timeout = setTimeout(() => {
      // Get the latest category state (which already has edits applied)
      setCategories(currentCategories => {
        const currentCategory = currentCategories.find(c => c.id === id)
        if (currentCategory && !savingCategories.has(id)) {
          saveCategoryUpdate(id, currentCategory, false)
        }
        return currentCategories
      })
      
      // Clear editing state and unsaved changes flag
      setEditingCategories(prev => {
        const newEditing = { ...prev }
        delete newEditing[id]
        return newEditing
      })
      setHasUnsavedChanges(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      
      // Clear timeout
      setSaveTimeouts(prev => {
        const newTimeouts = { ...prev }
        delete newTimeouts[id]
        return newTimeouts
      })
    }, 1500) // Wait 1.5 seconds after last change

    setSaveTimeouts(prev => ({ ...prev, [id]: timeout }))
  }

  const handleManualSave = (id: string) => {
    // Clear any pending timeout
    if (saveTimeouts[id]) {
      clearTimeout(saveTimeouts[id])
      setSaveTimeouts(prev => {
        const newTimeouts = { ...prev }
        delete newTimeouts[id]
        return newTimeouts
      })
    }

    // Get current category state (which already has edits applied)
    const currentCategory = categories.find(c => c.id === id)
    if (currentCategory && !savingCategories.has(id)) {
      // Merge any pending edits
      const edits = editingCategories[id]
      const finalCategory = edits ? { ...currentCategory, ...edits } : currentCategory
      
      // Ensure we have all required fields
      const completeCategory: Category = {
        id: finalCategory.id,
        name: finalCategory.name || '',
        icon: finalCategory.icon || '📋',
        order: finalCategory.order ?? 0,
        active: finalCategory.active !== undefined ? finalCategory.active : true,
      }
      
      // Clear editing state and unsaved changes flag
      setEditingCategories(prev => {
        const newEditing = { ...prev }
        delete newEditing[id]
        return newEditing
      })
      setHasUnsavedChanges(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      saveCategoryUpdate(id, completeCategory, true)
    }
  }

  const handleCategoryBlur = async (id: string) => {
    // Save immediately on blur (but only if not already saving)
    if (saveTimeouts[id]) {
      clearTimeout(saveTimeouts[id])
      setSaveTimeouts(prev => {
        const newTimeouts = { ...prev }
        delete newTimeouts[id]
        return newTimeouts
      })
    }
    
    // Only save if there are unsaved changes
    if (hasUnsavedChanges.has(id)) {
      // Get current category state (which already has edits applied)
      const currentCategory = categories.find(c => c.id === id)
      if (currentCategory && !savingCategories.has(id)) {
        // Clear editing state and unsaved changes flag
        setEditingCategories(prev => {
          const newEditing = { ...prev }
          delete newEditing[id]
          return newEditing
        })
        setHasUnsavedChanges(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
        saveCategoryUpdate(id, currentCategory, false)
      }
    }
  }

  const handleDeleteCategory = async (id: string, name?: string) => {
    if (!confirm('Are you sure you want to delete this category? Products in this category will not be deleted.')) {
      return
    }

    setSaving(true)
    try {
      const url = name
        ? `/api/admin/categories/${encodeURIComponent(id)}?name=${encodeURIComponent(name)}`
        : `/api/admin/categories/${encodeURIComponent(id)}`
      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        showToast('Category deleted successfully', 'success')
        // Small delay to ensure database is updated
        setTimeout(() => {
          fetchCategories()
        }, 500)
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to delete category', 'error')
      }
    } catch (error) {
      showToast('Failed to delete category', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDragStart = (categoryId: string) => {
    setDraggedCategory(categoryId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (targetIndex: number) => {
    if (draggedCategory === null) return
    
    const draggedIndex = categories.findIndex(c => c.id === draggedCategory)
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedCategory(null)
      return
    }

    const newCategories = [...categories]
    const [moved] = newCategories.splice(draggedIndex, 1)
    newCategories.splice(targetIndex, 0, moved)
    
    // Update order values
    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      order: index,
    }))
    
    setCategories(updatedCategories)
    setDraggedCategory(null)
    
    // Save to server
    setSaving(true)
    try {
      const res = await fetch('/api/admin/categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: updatedCategories.map(c => ({ id: c.id, order: c.order, name: c.name, icon: c.icon, active: c.active })) }),
        credentials: 'include',
      })

      if (res.ok) {
        showToast('Category order updated', 'success')
        // Refresh to get updated data from server
        await fetchCategories()
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to update order', 'error')
        fetchCategories() // Revert on error
      }
    } catch (error) {
      showToast('Failed to update order', 'error')
      fetchCategories() // Revert on error
    } finally {
      setSaving(false)
    }
  }

  const commonIcons = ['📦', '💉', '🧬', '⚡', '💧', '⭐', '🔬', '🧠', '📋', '💊', '🧪', '🔍', '📊', '🎯', '✨']

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 gradient-text">Manage Categories</h1>

      {/* Add New Category */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Add New Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Category Name *</label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="e.g., GLP's, Peptides"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
            />
          </div>
          <div>
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Icon</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory.icon}
                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                placeholder="📋"
                maxLength={2}
                className="w-20 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-center text-xl"
              />
              <div className="flex-1 grid grid-cols-5 gap-1">
                {commonIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewCategory({ ...newCategory, icon })}
                    className="px-2 py-1 text-lg hover:bg-purple-100 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddCategory}
              disabled={saving || !newCategory.name.trim()}
              className="w-full px-6 py-2 bg-neon-purple hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Adding...' : 'Add Category'}
            </button>
          </div>
        </div>
      </div>

      {/* Existing Categories */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Categories ({categories.length})</h2>
          <button
            onClick={() => {
              setLoading(true)
              fetchCategories()
            }}
            disabled={loading}
            className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm"
          >
            🔄 Refresh
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
          Drag and drop to reorder categories. The order here determines how categories appear in the store navigation.
          <br />
          <span className="text-xs text-gray-500 dark:text-gray-500 mt-1 block">
            Changes auto-save after 1.5 seconds of inactivity, or click the Save button to save immediately. Categories with unsaved changes are highlighted in yellow.
            <br />
            <span className="font-semibold">Note:</span> Categories are synced with actual product categories. Click Save to persist changes.
          </span>
        </p>

        {categories.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">No categories yet. Add one above!</p>
        ) : categories.filter(c => c.active).length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">No active categories. All categories have been deleted. Add a new one above!</p>
        ) : (
          <div className="space-y-3">
            {categories.filter(c => c.active).map((category, index) => {
              // Find the actual index in the full categories array for proper ordering
              const actualIndex = categories.findIndex(c => c.id === category.id)
              return (
              <div
                key={category.id}
                draggable
                onDragStart={() => handleDragStart(category.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(actualIndex)}
                className={`flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border transition-all ${
                  draggedCategory === category.id 
                    ? 'opacity-50 border-gray-200 dark:border-gray-700' 
                    : hasUnsavedChanges.has(category.id)
                    ? 'border-yellow-400 dark:border-yellow-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-move'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-move'
                }`}
              >
                {/* Drag Handle */}
                <div className="text-gray-400 dark:text-gray-500">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
                  </svg>
                </div>

                {/* Order Number */}
                <div className="w-8 text-center text-gray-500 dark:text-gray-400 font-semibold">
                  {index + 1}
                </div>

                {/* Icon */}
                <input
                  type="text"
                  value={category.icon}
                  onChange={(e) => handleUpdateCategory(category.id, { icon: e.target.value })}
                  onBlur={() => handleCategoryBlur(category.id)}
                  maxLength={2}
                  className="w-16 px-2 py-2 text-xl text-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-purple-500"
                />

                {/* Name */}
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) => handleUpdateCategory(category.id, { name: e.target.value })}
                  onBlur={() => handleCategoryBlur(category.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur()
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500"
                />

                {/* Active Toggle */}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={category.active}
                    onChange={(e) => handleUpdateCategory(category.id, { active: e.target.checked }, true)}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>

                {/* Save Button - Always visible */}
                <button
                  onClick={() => handleManualSave(category.id)}
                  disabled={savingCategories.has(category.id) || saving}
                  className={`px-4 py-2 font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[100px] ${
                    hasUnsavedChanges.has(category.id)
                      ? 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300'
                      : savedCategories.has(category.id)
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {savingCategories.has(category.id) ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : savedCategories.has(category.id) ? (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Saved
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save
                    </>
                  )}
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteCategory(category.id, category.name)}
                  disabled={saving}
                  className="px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
