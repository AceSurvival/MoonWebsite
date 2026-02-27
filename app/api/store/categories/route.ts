import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
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
    
    let managedCategories: Array<{ id?: string; name: string; icon: string; order: number; active: boolean }> = []
    
    if (categorySettings) {
      try {
        const parsed = JSON.parse(categorySettings.value) as Array<{ id?: string; name: string; icon: string; order: number; active?: unknown }>
        // Normalize: ensure order is number and active is boolean (DB/form may store strings)
        managedCategories = (parsed || []).map((cat, index) => ({
          ...cat,
          name: String(cat.name ?? ''),
          icon: String(cat.icon ?? '📋'),
          order: Number(cat.order) ?? index,
          active: cat.active === true || String(cat.active) === 'true',
        }))
      } catch (e) {
        // Invalid JSON, start fresh
      }
    }
    
    // Create a map of managed categories by name (source of truth for store nav)
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
    
    // Build final list from managed categories only; dedupe by name. Order 0 = first below "All Products".
    const nameToManaged = new Map<string, { name: string; icon: string; order: number; _index: number }>()
    managedCategories
      .filter(cat => cat.active)
      .forEach((cat, index) => {
        const name = (cat.name || '').trim()
        if (!name || nameToManaged.has(name)) return
        nameToManaged.set(name, {
          name,
          icon: cat.icon,
          order: Number(cat.order),
          _index: index,
        })
      })
    
    const activeManaged = Array.from(nameToManaged.values())
    activeManaged.sort((a, b) => {
      const orderDiff = Number(a.order) - Number(b.order)
      if (orderDiff !== 0) return orderDiff
      return a._index - b._index
    })
    
    const allCategories: Array<{ name: string; icon: string; order: number; active: boolean }> = activeManaged.map(
      ({ name, icon, order }, i) => ({ name, icon, order: i, active: true })
    )
    
    const namesInList = new Set(allCategories.map(c => c.name))
    const maxOrder = allCategories.length
    uniqueProductCategories.forEach((productCatName, index) => {
      const name = (productCatName || '').trim()
      if (!name || namesInList.has(name)) return
      namesInList.add(name)
      allCategories.push({
        name,
        icon: categoryIcons[productCatName] || '📋',
        order: maxOrder + index,
        active: true,
      })
    })
    
    allCategories.sort((a, b) => Number(a.order) - Number(b.order))
    
    const response = NextResponse.json({ categories: allCategories })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ categories: [] })
  }
}
