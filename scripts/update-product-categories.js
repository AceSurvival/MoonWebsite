const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Map products to new categories
function getNewCategory(productName) {
  const name = productName.toLowerCase()
  
  // Cognitive Compounds (check before GLP's to avoid conflicts)
  if (name.includes('semax')) {
    return 'Cognitive Compounds'
  }
  if (name.includes('selank')) {
    return 'Cognitive Compounds'
  }
  
  // GLP's
  if (name.includes('retatrutide') || name.includes('glp3-reta') || name.includes('reta')) {
    return "GLP's"
  }
  if (name.includes('tirzepatide') || name.includes('glp2-tirz') || name.includes('tirz')) {
    return "GLP's"
  }
  if (name.includes('semaglutide') || name.includes('glp1-sema') || (name.includes('sema') && !name.includes('semax'))) {
    return "GLP's"
  }
  if (name.includes('cagrilintide') || name.includes('cag')) {
    return "GLP's"
  }
  
  // Bac Water
  if (name.includes('bacwater') || name.includes('bac water')) {
    return 'Bac Water'
  }
  
  // Formulas and Bundles
  if (name.includes('glow')) {
    return 'Formulas and Bundles'
  }
  if (name.includes('klow')) {
    return 'Formulas and Bundles'
  }
  if (name.includes('bb10')) {
    return 'Formulas and Bundles'
  }
  
  
  // Aminos
  if (name.includes('nad')) {
    return 'Aminos'
  }
  
  // Peptides (default for most research peptides)
  // BPC-157, TB-500, GHK-CU, Sermorelin, Ipamorelin, Tesamorelin, CJC 1295, MOTS-c, SS-31, AOD-9604, PT-141, SNAP-8, MT-1, MT-2, Epithalon, Kisspeptin, KPV
  if (name.includes('bpc-157') || name.includes('bpc157')) {
    return 'Peptides'
  }
  if (name.includes('tb-500') || name.includes('tb500')) {
    return 'Peptides'
  }
  if (name.includes('ghk') || name.includes('copper')) {
    return 'Peptides'
  }
  if (name.includes('sermorelin')) {
    return 'Peptides'
  }
  if (name.includes('ipamorelin')) {
    return 'Peptides'
  }
  if (name.includes('tesamorelin')) {
    return 'Peptides'
  }
  if (name.includes('cjc') && name.includes('1295')) {
    return 'Peptides'
  }
  if (name.includes('mots')) {
    return 'Peptides'
  }
  if (name.includes('ss-31') || name.includes('ss31')) {
    return 'Peptides'
  }
  if (name.includes('aod-9604') || name.includes('aod9604')) {
    return 'Peptides'
  }
  if (name.includes('pt-141') || name.includes('pt141')) {
    return 'Peptides'
  }
  if (name.includes('snap')) {
    return 'Peptides'
  }
  if (name.includes('mt-1') || name.includes('mt-2') || name.includes('mt1') || name.includes('mt2')) {
    return 'Peptides'
  }
  if (name.includes('epithalon')) {
    return 'Peptides'
  }
  if (name.includes('kisspeptin')) {
    return 'Peptides'
  }
  if (name.includes('kpv') && !name.includes('klow')) {
    return 'Peptides'
  }
  if (name.includes('slu-pp-332')) {
    return 'Peptides'
  }
  
  // Default fallback
  return 'Research Supplies'
}

async function main() {
  console.log('Starting product category update...\n')
  
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
    })
    
    console.log(`Found ${products.length} products to update\n`)
    
    let updated = 0
    let categoryCounts = {}
    
    for (const product of products) {
      try {
        const newCategory = getNewCategory(product.name)
        
        await prisma.product.update({
          where: { id: product.id },
          data: { category: newCategory },
        })
        
        categoryCounts[newCategory] = (categoryCounts[newCategory] || 0) + 1
        console.log(`✅ Updated: ${product.name} -> ${newCategory}`)
        updated++
      } catch (error) {
        console.error(`❌ Error updating ${product.name}:`, error.message)
      }
    }
    
    console.log(`\n✨ Done! Updated ${updated} products.`)
    console.log('\nCategory distribution:')
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} products`)
    })
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })

