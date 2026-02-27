import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PUT - Reorder categories
export async function PUT(request: NextRequest) {
  try {
    await requireAuth(request)
    const body = await request.json()
    
    const categorySettings = await prisma.setting.findUnique({
      where: { key: 'category_settings' },
    })
    
    if (!categorySettings) {
      return NextResponse.json({ error: 'Categories not found' }, { status: 404 })
    }
    
    let categories: Array<{ id: string; name: string; icon: string; order: number; active: boolean }> = []
    try {
      categories = JSON.parse(categorySettings.value)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid category data' }, { status: 400 })
    }
    
    // Create a map of all categories by ID for quick lookup
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]))
    
    // Dedupe body.categories by id (first occurrence wins) to avoid duplicates when reordering
    const seenIds = new Set<string>()
    const bodyCategoriesDeduped = (body.categories || []).filter((c: { id: string }) => {
      if (seenIds.has(c.id)) return false
      seenIds.add(c.id)
      return true
    })
    
    const updatedCategories: Array<{ id: string; name: string; icon: string; order: number; active: boolean }> = []
    const processedIds = new Set<string>()
    const processedNames = new Set<string>()
    
    // Process categories in the order they were provided; use position as order (0, 1, 2...) so #1 = first below All Products
    bodyCategoriesDeduped.forEach((c: { id: string; order: number; name?: string; icon?: string; active?: boolean }, index: number) => {
      const existing = categoryMap.get(c.id)
      const order = Number(c.order)
      const numericOrder = Number.isNaN(order) ? index : order
      const name = (existing?.name ?? c.name ?? c.id.replace(/^cat-/, '').replace(/-/g, ' ')).trim()
      if (processedNames.has(name)) return
      processedNames.add(name)
      processedIds.add(c.id)
      if (existing) {
        updatedCategories.push({
          ...existing,
          name,
          order: numericOrder,
        })
      } else {
        updatedCategories.push({
          id: c.id,
          name,
          icon: (c as { icon?: string }).icon ?? '📋',
          order: numericOrder,
          active: true,
        })
      }
    })
    
    // Add any remaining categories that weren't in the reorder list (and not duplicate by name)
    categories.forEach(cat => {
      if (processedIds.has(cat.id) || processedNames.has(cat.name)) return
      processedIds.add(cat.id)
      processedNames.add(cat.name)
      updatedCategories.push({ ...cat, order: updatedCategories.length })
    })
    
    // Final dedupe by name (keep first occurrence = display order)
    const byName = new Map<string, (typeof updatedCategories)[0]>()
    updatedCategories.forEach(cat => {
      if (!byName.has(cat.name)) byName.set(cat.name, cat)
    })
    const finalCategories = Array.from(byName.values())
    finalCategories.sort((a, b) => a.order - b.order)
    
    // Reassign order 0, 1, 2... so store shows admin #1 as first below All Products
    const sorted = finalCategories.map((cat, i) => ({ ...cat, order: i }))
    
    await prisma.setting.update({
      where: { key: 'category_settings' },
      data: { value: JSON.stringify(sorted) },
    })
    
    const response = NextResponse.json({ success: true, categories: sorted })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error reordering categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
