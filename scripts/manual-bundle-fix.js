const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Manually bundling missing products...\n')
  
  try {
    // Get the parent IDs directly from the check output
    const retaParentId = '969be499-6fd6-4db5-8259-a57bada9f143'
    const tirzParentId = '9cf01230-d072-4197-b188-943a54df4b54'
    
    // Bundle GLP3-R3TA products to Retatrutide - query by exact slugs
    const r3taSlugs = ['glp3-r3ta', 'glp3-r3ta-20']
    console.log(`Looking for GLP3-R3TA products with slugs: ${r3taSlugs.join(', ')}`)
    
    for (const slug of r3taSlugs) {
      const product = await prisma.product.findUnique({
        where: { slug: slug }
      })
      
      if (product && product.parentProductId === null) {
        const mgMatch = product.name.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)/i)
        const variantName = mgMatch ? `${mgMatch[1]}${mgMatch[2].toLowerCase()}` : '0mg'
        
        await prisma.product.update({
          where: { id: product.id },
          data: {
            parentProductId: retaParentId,
            variantName: variantName,
            variantImageUrl: product.imageUrl
          }
        })
        console.log(`   ✅ Bundled: ${product.name} (${slug}) -> ${variantName}`)
      } else if (product) {
        console.log(`   ⏭️  Skipping ${product.name} (${slug}) - parentProductId: ${product.parentProductId}, active: ${product.active}`)
      } else {
        console.log(`   ❌ Product with slug ${slug} not found`)
      }
    }
    
    // Bundle remaining GLP3-RETA product (the one with slug glp3-reta, not glp3-reta-1)
    const retaProduct = await prisma.product.findUnique({
      where: { slug: 'glp3-reta' }
    })
    
    if (retaProduct && retaProduct.parentProductId === null && retaProduct.id !== retaParentId) {
      const variantName = retaProduct.variantName || '3mg'
      await prisma.product.update({
        where: { id: retaProduct.id },
        data: {
          parentProductId: retaParentId,
          variantName: variantName,
          variantImageUrl: retaProduct.imageUrl
        }
      })
      console.log(`   ✅ Bundled: ${retaProduct.name} -> ${variantName}`)
    } else if (retaProduct) {
      console.log(`   ⏭️  Skipping GLP3-RETA - parentProductId: ${retaProduct.parentProductId}, id: ${retaProduct.id}`)
    }
    
    // Bundle remaining GLP2-TIRZ product (the one with slug glp2-tirz, not glp2-tirz-1)
    const tirzProduct = await prisma.product.findUnique({
      where: { slug: 'glp2-tirz' }
    })
    
    if (tirzProduct && tirzProduct.parentProductId === null && tirzProduct.id !== tirzParentId) {
      const variantName = tirzProduct.variantName || '2mg'
      await prisma.product.update({
        where: { id: tirzProduct.id },
        data: {
          parentProductId: tirzParentId,
          variantName: variantName,
          variantImageUrl: tirzProduct.imageUrl
        }
      })
      console.log(`   ✅ Bundled: ${tirzProduct.name} -> ${variantName}`)
    } else if (tirzProduct) {
      console.log(`   ⏭️  Skipping GLP2-TIRZ - parentProductId: ${tirzProduct.parentProductId}, id: ${tirzProduct.id}`)
    }
    
    // For Semaglutide, we need to handle GLP1-SEMA 20MG
    // First, check if there's a better parent
    const allSema = await prisma.product.findMany({
      where: {
        name: { contains: 'GLP1-SEMA', mode: 'insensitive' },
        parentProductId: null,
        active: true
      },
      orderBy: { name: 'asc' }
    })
    
    if (allSema.length > 1) {
      // Use the first one as parent, make others variants
      const semaParent = allSema[0]
      console.log(`\nUsing ${semaParent.name} as Semaglutide parent`)
      
      for (let i = 1; i < allSema.length; i++) {
        const product = allSema[i]
        const mgMatch = product.name.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)/i)
        const variantName = mgMatch ? `${mgMatch[1]}${mgMatch[2].toLowerCase()}` : (product.variantName || '0mg')
        
        await prisma.product.update({
          where: { id: product.id },
          data: {
            parentProductId: semaParent.id,
            variantName: variantName,
            variantImageUrl: product.imageUrl
          }
        })
        console.log(`   ✅ Bundled: ${product.name} -> ${variantName}`)
      }
    }
    
    console.log('\n✨ Done!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })

