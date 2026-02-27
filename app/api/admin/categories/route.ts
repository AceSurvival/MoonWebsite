import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Fetch all categories
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    
    // Get actual product categories from database
    const productCategories = await prisma.product.findMany({
      where: { active: true },
      select: { category: true },
      distinct: ['category'],
    })
    
    const uniqueProductCategories = Array.from(new Set(productCategories.map(p => p.category)))
    
    // Get managed category settings from database
    const categorySettings = await prisma.setting.findUnique({
      where: { key: 'category_settings' },
    })
    
    let managedCategories: Array<{ id: string; name: string; icon: string; order: number; active: boolean }> = []
    
    if (categorySettings) {
      try {
        const parsed = JSON.parse(categorySettings.value) as Array<{ id?: string; name: string; icon: string; order?: number; active?: unknown }>
        managedCategories = (parsed || []).map((cat, index) => ({
          id: cat.id ?? `cat-${index}`,
          name: String(cat.name ?? ''),
          icon: String(cat.icon ?? '📋'),
          order: Number(cat.order) ?? index,
          active: cat.active === true || String(cat.active) === 'true',
        }))
      } catch (e) {
        // Invalid JSON, start fresh
      }
    }
    
    // Create a map of managed categories by name for quick lookup
    const managedMap = new Map(managedCategories.map(cat => [cat.name, cat]))
    
    // Default icons for common categories
    const categoryIcons: Record<string, string> = {
      "GLP's": "💉",
      "Peptides": "🧬",
      "Aminos": "⚡",
      "Bac Water": "💧",
      "Formulas and Bundles": "📦",
      "Best Sellers": "⭐",
      "Research Supplies": "🔬",
      "Cognitive Compounds": "🧠"
    }
    
    // Merge: managed first, then product categories not in managed. Dedupe by name so we never show duplicates.
    const allCategories: Array<{ id: string; name: string; icon: string; order: number; active: boolean }> = []
    const namesSeen = new Set<string>()
    
    managedCategories.forEach(cat => {
      const name = (cat.name || '').trim()
      if (!name || namesSeen.has(name)) return
      namesSeen.add(name)
      allCategories.push(cat)
    })
    
    uniqueProductCategories.forEach((productCatName, index) => {
      const name = (productCatName || '').trim()
      if (!name || namesSeen.has(name)) return
      namesSeen.add(name)
      const stableId = `cat-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      const maxOrder = allCategories.length > 0 ? Math.max(...allCategories.map(c => c.order)) : -1
      allCategories.push({
        id: stableId,
        name,
        icon: categoryIcons[productCatName] || '📋',
        order: maxOrder + 1 + index,
        active: true,
      })
    })
    
    allCategories.sort((a, b) => a.order - b.order)
    
    const response = NextResponse.json({ categories: allCategories })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    if (error?.message === 'Unauthorized' || error?.message?.includes('Unauthorized')) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      return response
    }
    const response = NextResponse.json({ error: 'Internal server error', details: process.env.NODE_ENV === 'development' ? error.message : undefined }, { status: 500 })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return response
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)
    const body = await request.json()
    
    const categorySettings = await prisma.setting.findUnique({
      where: { key: 'category_settings' },
    })
    
    let categories: Array<{ id: string; name: string; icon: string; order: number; active: boolean }> = []
    
    if (categorySettings) {
      try {
        categories = JSON.parse(categorySettings.value)
      } catch (e) {
        // Invalid JSON, start fresh
      }
    }
    
    // Check if category already exists
    const existingIndex = categories.findIndex(cat => cat.name === body.name)
    if (existingIndex !== -1) {
      // Update existing category instead of creating duplicate
      categories[existingIndex] = {
        ...categories[existingIndex],
        icon: body.icon || categories[existingIndex].icon,
        active: body.active !== undefined ? body.active : categories[existingIndex].active,
      }
    } else {
      // Find max order
      const maxOrder = categories.length > 0 
        ? Math.max(...categories.map(c => c.order))
        : -1
      
      const newCategory = {
        id: `cat-${Date.now()}`,
        name: body.name,
        icon: body.icon || '📋',
        order: maxOrder + 1,
        active: body.active !== undefined ? body.active : true,
      }
      
      categories.push(newCategory)
    }
    
    await prisma.setting.upsert({
      where: { key: 'category_settings' },
      update: { value: JSON.stringify(categories) },
      create: { key: 'category_settings', value: JSON.stringify(categories) },
    })
    
    return NextResponse.json({ category: categories[existingIndex !== -1 ? existingIndex : categories.length - 1] })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
