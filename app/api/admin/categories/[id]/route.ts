import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PUT - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Find category by ID first
    let index = categories.findIndex(c => c.id === params.id)
    
    // If not found by ID, try to find by name (for product categories that were just added)
    if (index === -1 && body.name) {
      index = categories.findIndex(c => c.name === body.name)
    }
    
    // If still not found, create a new entry (this handles product categories that weren't in managed list)
    if (index === -1) {
      // Use the ID from params or generate stable ID
      const categoryId = params.id.startsWith('cat-') 
        ? params.id 
        : (body.name ? `cat-${body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : `cat-${Date.now()}`)
      
      const maxOrder = categories.length > 0 
        ? Math.max(...categories.map(c => c.order))
        : -1
      
      const newCategory = {
        id: categoryId,
        name: body.name || '',
        icon: body.icon || '📋',
        order: body.order !== undefined ? body.order : maxOrder + 1,
        active: body.active !== undefined ? body.active : true,
      }
      
      categories.push(newCategory)
      index = categories.length - 1
    } else {
      // Update existing category - use body data, normalize types for store consistency
      categories[index] = {
        id: categories[index].id, // Always preserve original ID
        name: body.name !== undefined ? String(body.name) : categories[index].name,
        icon: body.icon !== undefined ? String(body.icon) : categories[index].icon,
        order: body.order !== undefined ? Number(body.order) : categories[index].order,
        active: body.active !== undefined ? (body.active === true || body.active === 'true') : categories[index].active,
      }
    }
    
    await prisma.setting.upsert({
      where: { key: 'category_settings' },
      update: { value: JSON.stringify(categories) },
      create: { key: 'category_settings', value: JSON.stringify(categories) },
    })
    
    const response = NextResponse.json({ category: categories[index] })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete category (mark inactive). Find by id or by name so delete always works.
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request)
    
    const categorySettings = await prisma.setting.findUnique({
      where: { key: 'category_settings' },
    })
    
    if (!categorySettings) {
      return NextResponse.json({ error: 'Categories not found' }, { status: 404 })
    }
    
    let categories: Array<{ id: string; name: string; icon: string; order: number; active: boolean }> = []
    try {
      const parsed = JSON.parse(categorySettings.value) as Array<{ id?: unknown; name?: string; icon?: string; order?: number; active?: unknown }>
      categories = (parsed || []).map((c, i) => ({
        id: String(c.id ?? `cat-${i}`),
        name: String(c.name ?? ''),
        icon: String(c.icon ?? '📋'),
        order: Number(c.order) ?? i,
        active: c.active === true || String(c.active) === 'true',
      }))
    } catch (e) {
      return NextResponse.json({ error: 'Invalid category data' }, { status: 400 })
    }
    
    const idToFind = String(params.id).trim()
    let categoryIndex = categories.findIndex(c => String(c.id) === idToFind)
    if (categoryIndex === -1 && request.nextUrl?.searchParams?.get('name')) {
      const nameParam = request.nextUrl.searchParams.get('name')
      if (nameParam) {
        const decoded = decodeURIComponent(nameParam).trim()
        categoryIndex = categories.findIndex(c => (c.name || '').trim() === decoded)
      }
    }
    if (categoryIndex === -1) {
      const nameFromId = idToFind.replace(/^cat-/, '').replace(/-/g, ' ').trim()
      if (nameFromId) categoryIndex = categories.findIndex(c => (c.name || '').trim().toLowerCase() === nameFromId.toLowerCase())
    }
    
    if (categoryIndex !== -1) {
      categories[categoryIndex] = { ...categories[categoryIndex], active: false }
    } else {
      const nameToUse = request.nextUrl?.searchParams?.get('name')
        ? decodeURIComponent(request.nextUrl.searchParams.get('name')!).trim()
        : idToFind.replace(/^cat-/, '').replace(/-/g, ' ')
      const byName = categories.findIndex(c => (c.name || '').trim().toLowerCase() === nameToUse.toLowerCase())
      if (byName !== -1) {
        categories[byName] = { ...categories[byName], active: false }
      } else {
        categories.push({
          id: idToFind.startsWith('cat-') ? idToFind : `cat-${nameToUse.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          name: nameToUse,
          icon: '📋',
          order: 999,
          active: false,
        })
      }
    }
    
    await prisma.setting.update({
      where: { key: 'category_settings' },
      data: { value: JSON.stringify(categories) },
    })
    
    const response = NextResponse.json({ success: true })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
