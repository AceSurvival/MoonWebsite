const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Extract base product name and variant name
function extractProductInfo(productName, variantName = null, codename = null) {
  const name = productName.toLowerCase()
  
  // Try to extract mg amount from name first
  let mgMatch = productName.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)/i)
  let extractedVariantName = null
  
  if (mgMatch) {
    extractedVariantName = `${mgMatch[1]}${mgMatch[2].toLowerCase()}`
  } else if (variantName) {
    // Use existing variantName if name doesn't have mg
    extractedVariantName = variantName
    mgMatch = variantName.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)/i)
  } else if (codename) {
    // Try to extract from codename (e.g., "RETA 20" -> "20mg")
    const codenameMatch = codename.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)?/i)
    if (codenameMatch) {
      extractedVariantName = codenameMatch[2] ? `${codenameMatch[1]}${codenameMatch[2].toLowerCase()}` : `${codenameMatch[1]}mg`
      mgMatch = codenameMatch
    }
  }
  
  // If still no mg found, try to extract from name again with different patterns
  if (!mgMatch && !extractedVariantName) {
    // Try patterns like "R3TA 20" or "20MG" at the end
    const altMatch = productName.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)/i)
    if (altMatch) {
      extractedVariantName = `${altMatch[1]}${altMatch[2].toLowerCase()}`
      mgMatch = altMatch
    }
  }
  
  // Don't return false yet - let the product-specific checks handle it
  // They might extract from codename or other sources, or assign a default
  const variantNameFinal = extractedVariantName
  
  // Patterns to match - order matters! More specific first
  // Check for exact matches first, then partial matches
  // Handle both "GLP3-RETA", "GLP3-R3TA", and "Retatrutide" formats
  if (name.includes('glp3-r3ta') || name.includes('glp3 r3ta') || 
      name.includes('glp3-reta') || name.includes('glp3 reta') || 
      name.includes('retatrutide') ||
      (name.includes('reta') && !name.includes('retatrutide') && !name.includes('klow'))) {
    // If no mg found, try to extract from name or codename
    let finalVariantName = variantNameFinal
    if (!finalVariantName) {
      // Try to extract from product name (e.g., "GLP3-R3TA 20MG" -> "20mg")
      const nameMgMatch = productName.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)/i)
      if (nameMgMatch) {
        finalVariantName = `${nameMgMatch[1]}${nameMgMatch[2].toLowerCase()}`
      } else if (codename && codename.toLowerCase().includes('reta')) {
        // Try codename
        const codenameMg = codename.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)?/i)
        if (codenameMg) {
          finalVariantName = codenameMg[2] ? `${codenameMg[1]}${codenameMg[2].toLowerCase()}` : `${codenameMg[1]}mg`
        }
      }
      // If still no variant name, try to extract any number from the name
      if (!finalVariantName) {
        const anyNumberMatch = productName.match(/(\d+)/)
        if (anyNumberMatch) {
          finalVariantName = `${anyNumberMatch[1]}mg`
        }
      }
    }
    // Bundle even if we don't have a variant name - we'll handle it in the bundling logic
    if (finalVariantName || name.includes('glp3-r3ta') || name.includes('glp3-reta') || name.includes('glp3 reta') || name.includes('retatrutide')) {
      // If no variant name, use a default that will be sorted appropriately
      if (!finalVariantName) {
        finalVariantName = '0mg' // Will be sorted first, or we can extract from slug later
      }
      return { baseName: 'retatrutide', variantName: finalVariantName, shouldBundle: true }
    }
  }
  if (name.includes('glp2-tirz') || name.includes('glp2 tirz') || 
      name.includes('tirzepatide') ||
      (name.includes('tirz') && !name.includes('tirzepatide'))) {
    // If no mg found, try to extract from name or codename
    let finalVariantName = variantNameFinal
    if (!finalVariantName) {
      const nameMgMatch = productName.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)/i)
      if (nameMgMatch) {
        finalVariantName = `${nameMgMatch[1]}${nameMgMatch[2].toLowerCase()}`
      } else if (codename && codename.toLowerCase().includes('tirz')) {
        const codenameMg = codename.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)?/i)
        if (codenameMg) {
          finalVariantName = codenameMg[2] ? `${codenameMg[1]}${codenameMg[2].toLowerCase()}` : `${codenameMg[1]}mg`
        }
      }
      // Try to extract any number from the name
      if (!finalVariantName) {
        const anyNumberMatch = productName.match(/(\d+)/)
        if (anyNumberMatch) {
          finalVariantName = `${anyNumberMatch[1]}mg`
        }
      }
    }
    // Bundle even if we don't have a variant name
    if (finalVariantName || name.includes('glp2-tirz') || name.includes('glp2 tirz') || name.includes('tirzepatide')) {
      if (!finalVariantName) {
        finalVariantName = '0mg'
      }
      return { baseName: 'tirzepatide', variantName: finalVariantName, shouldBundle: true }
    }
  }
  if (name.includes('glp1-sema') || name.includes('glp1 sema') || 
      name.includes('semaglutide') ||
      (name.includes('sema') && !name.includes('semax') && !name.includes('semaglutide'))) {
    // If no mg found, try to extract from name or codename
    let finalVariantName = variantNameFinal
    if (!finalVariantName) {
      const nameMgMatch = productName.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)/i)
      if (nameMgMatch) {
        finalVariantName = `${nameMgMatch[1]}${nameMgMatch[2].toLowerCase()}`
      } else if (codename && codename.toLowerCase().includes('sema')) {
        const codenameMg = codename.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)?/i)
        if (codenameMg) {
          finalVariantName = codenameMg[2] ? `${codenameMg[1]}${codenameMg[2].toLowerCase()}` : `${codenameMg[1]}mg`
        }
      }
      // Try to extract any number from the name
      if (!finalVariantName) {
        const anyNumberMatch = productName.match(/(\d+)/)
        if (anyNumberMatch) {
          finalVariantName = `${anyNumberMatch[1]}mg`
        }
      }
    }
    // Bundle even if we don't have a variant name
    if (finalVariantName || name.includes('glp1-sema') || name.includes('glp1 sema') || name.includes('semaglutide')) {
      if (!finalVariantName) {
        finalVariantName = '0mg'
      }
      return { baseName: 'semaglutide', variantName: finalVariantName, shouldBundle: true }
    }
  }
  if (name.includes('cagrilintide') || (name.includes('cag') && !name.includes('cagrilintide'))) {
    return { baseName: 'cagrilintide', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('ghk-cu') || name.includes('ghk cu')) {
    return { baseName: 'ghk-cu', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('bpc-157') || name.includes('bpc157')) {
    return { baseName: 'bpc-157', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('tb-500') || name.includes('tb500')) {
    return { baseName: 'tb-500', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('nad+') || (name.includes('nad') && name.includes('buffered'))) {
    return { baseName: 'nad+', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('sermorelin')) {
    return { baseName: 'sermorelin', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('ipamorelin')) {
    return { baseName: 'ipamorelin', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('tesamorelin')) {
    return { baseName: 'tesamorelin', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('cjc') && name.includes('1295')) {
    return { baseName: 'cjc-1295', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('mots-c') || (name.includes('mots') && !name.includes('mots-c'))) {
    return { baseName: 'mots-c', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('ss31') || name.includes('ss-31')) {
    return { baseName: 'ss-31', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('aod-9604') || name.includes('aod9604')) {
    return { baseName: 'aod-9604', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('pt141') || name.includes('pt-141')) {
    return { baseName: 'pt-141', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('semax') && !name.includes('semaglutide')) {
    return { baseName: 'semax', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('selank')) {
    return { baseName: 'selank', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('snap8') || name.includes('snap-8')) {
    return { baseName: 'snap-8', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('mt-1') || (name.includes('mt1') && !name.includes('mt-1'))) {
    return { baseName: 'mt-1', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('mt-2') || (name.includes('mt2') && !name.includes('mt-2'))) {
    return { baseName: 'mt-2', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('epithalon')) {
    return { baseName: 'epithalon', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('kisspeptin')) {
    return { baseName: 'kisspeptin', variantName: variantNameFinal, shouldBundle: true }
  }
  if (name.includes('kpv') && !name.includes('klow')) {
    if (!variantNameFinal) {
      return { shouldBundle: false }
    }
    return { baseName: 'kpv', variantName: variantNameFinal, shouldBundle: true }
  }
  
  // For products that need variant names, return false if we don't have one
  return { shouldBundle: false }
}

async function main() {
  console.log('Starting product bundling...\n')
  
  try {
    // First, reset all variants to be standalone (so we can re-bundle correctly)
    await prisma.product.updateMany({
      where: {
        parentProductId: { not: null }
      },
      data: {
        parentProductId: null,
        variantName: null,
        variantImageUrl: null,
      }
    })
    
    // Get all active products
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    })
    
    console.log(`Found ${products.length} parent/standalone products to process\n`)
    
    // Group products by base name
    const productGroups = {}
    
    for (const product of products) {
      const info = extractProductInfo(product.name, product.variantName, product.codename)
      if (info.shouldBundle) {
        const key = info.baseName
        if (!productGroups[key]) {
          productGroups[key] = []
        }
        productGroups[key].push({
          product,
          variantName: info.variantName,
          sortValue: parseFloat(info.variantName.replace(/[^0-9.]/g, '')) || 0
        })
      }
    }
    
    console.log(`\nFound ${Object.keys(productGroups).length} product groups to bundle`)
    
    let bundlesCreated = 0
    let variantsCreated = 0
    
    // Process each group
    for (const [baseName, group] of Object.entries(productGroups)) {
      if (group.length < 2) {
        // Need at least 2 products to bundle
        continue
      }
      
      // Sort by variant size
      group.sort((a, b) => a.sortValue - b.sortValue)
      
      // Use the first product as the parent
      const firstProduct = group[0].product
      const parentProduct = firstProduct
      
      // Update parent product name to base name (without mg)
      const baseDisplayName = firstProduct.name.replace(/\s*\d+(?:\.\d+)?\s*(mg|ml|g).*/i, '').trim()
      const baseSlug = baseDisplayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      
      // Check if slug already exists (might be from another product)
      let finalSlug = baseSlug
      let slugCounter = 1
      while (true) {
        const existing = await prisma.product.findUnique({
          where: { slug: finalSlug },
          select: { id: true },
        })
        if (!existing || existing.id === parentProduct.id) {
          break
        }
        finalSlug = `${baseSlug}-${slugCounter}`
        slugCounter++
        if (slugCounter > 100) break // Safety check
      }
      
      await prisma.product.update({
        where: { id: parentProduct.id },
        data: {
          name: baseDisplayName,
          slug: finalSlug,
          variantName: group[0].variantName,
          // Keep the first product's image as the default
        }
      })
      
      console.log(`\n📦 Bundling ${baseName}:`)
      console.log(`   Parent: ${baseDisplayName} (${group[0].variantName})`)
      
      // Make other products variants
      for (let i = 1; i < group.length; i++) {
        const variant = group[i]
        await prisma.product.update({
          where: { id: variant.product.id },
          data: {
            parentProductId: parentProduct.id,
            variantName: variant.variantName,
            variantImageUrl: variant.product.imageUrl, // Store variant-specific image
          }
        })
        console.log(`   Variant: ${variant.variantName}`)
        variantsCreated++
      }
      
      bundlesCreated++
    }
    
    console.log(`\n✨ Done! Created ${bundlesCreated} bundles with ${variantsCreated} variants.`)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
