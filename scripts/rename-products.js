const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function renameProducts() {
  console.log('Starting product renaming...\n')
  
  try {
    // Get all products
    const products = await prisma.product.findMany({
      where: { active: true },
    })
    
    console.log(`Found ${products.length} products to check\n`)
    
    let renamed = 0
    
    for (const product of products) {
      const name = product.name.trim()
      let newName = null
      let newSlug = null
      
      // Check for Retatrutide
      if (name.toLowerCase().includes('retatrutide')) {
        const match = name.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)/i)
        if (match) {
          const amount = match[1]
          newName = `GLP3-RETA ${amount}MG`
          newSlug = `glp3-reta-${amount}mg`.toLowerCase()
        }
      }
      // Check for Tirzepatide
      else if (name.toLowerCase().includes('tirzepatide')) {
        const match = name.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)/i)
        if (match) {
          const amount = match[1]
          newName = `GLP2-TIRZ ${amount}MG`
          newSlug = `glp2-tirz-${amount}mg`.toLowerCase()
        }
      }
      // Check for Semaglutide
      else if (name.toLowerCase().includes('semaglutide')) {
        const match = name.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)/i)
        if (match) {
          const amount = match[1]
          newName = `GLP1-SEMA ${amount}MG`
          newSlug = `glp1-sema-${amount}mg`.toLowerCase()
        }
      }
      
      if (newName && newSlug) {
        // Check if slug already exists (for duplicates)
        const existing = await prisma.product.findUnique({
          where: { slug: newSlug },
        })
        
        if (existing && existing.id !== product.id) {
          console.log(`⚠️  Skipping ${product.name} -> ${newName} (slug ${newSlug} already exists)`)
          continue
        }
        
        try {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              name: newName,
              slug: newSlug,
            },
          })
          
          console.log(`✅ Renamed: ${product.name} -> ${newName}`)
          renamed++
        } catch (error) {
          console.error(`❌ Error renaming ${product.name}:`, error.message)
        }
      }
    }
    
    console.log(`\n✨ Done! Renamed ${renamed} products.`)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

renameProducts()
  .finally(async () => {
    await prisma.$disconnect()
  })





