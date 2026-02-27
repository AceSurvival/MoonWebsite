const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Fixing missing product bundles...\n')
  
  try {
    // Find the parent products for each type (the ones that already have variants)
    const retaParent = await prisma.product.findFirst({
      where: {
        OR: [
          { name: { contains: 'GLP3-RETA', mode: 'insensitive' } },
          { name: { contains: 'Retatrutide', mode: 'insensitive' } }
        ],
        parentProductId: null,
        active: true,
        variants: { some: {} } // Has at least one variant
      },
      orderBy: { name: 'asc' }
    })
    
    const tirzParent = await prisma.product.findFirst({
      where: {
        OR: [
          { name: { contains: 'GLP2-TIRZ', mode: 'insensitive' } },
          { name: { contains: 'Tirzepatide', mode: 'insensitive' } }
        ],
        parentProductId: null,
        active: true,
        variants: { some: {} } // Has at least one variant
      },
      orderBy: { name: 'asc' }
    })
    
    // For Semaglutide, we need to create a parent if GLP1-SEMA 20MG is currently the parent
    // First check if there's already a parent with variants
    let semaParent = await prisma.product.findFirst({
      where: {
        OR: [
          { name: { contains: 'GLP1-SEMA', mode: 'insensitive' } },
          { name: { contains: 'Semaglutide', mode: 'insensitive' } }
        ],
        parentProductId: null,
        active: true,
        variants: { some: {} } // Has at least one variant
      },
      orderBy: { name: 'asc' }
    })
    
    // If no parent with variants exists, use the first GLP1-SEMA product as parent
    if (!semaParent) {
      semaParent = await prisma.product.findFirst({
        where: {
          name: { contains: 'GLP1-SEMA', mode: 'insensitive' },
          parentProductId: null,
          active: true
        },
        orderBy: { name: 'asc' }
      })
    }
    
    if (!retaParent) {
      console.log('❌ Could not find Retatrutide parent product')
    } else {
      console.log(`✅ Found Retatrutide parent: ${retaParent.name} (${retaParent.id})`)
    }
    
    if (!tirzParent) {
      console.log('❌ Could not find Tirzepatide parent product')
    } else {
      console.log(`✅ Found Tirzepatide parent: ${tirzParent.name} (${tirzParent.id})`)
    }
    
    if (!semaParent) {
      console.log('❌ Could not find Semaglutide parent product')
    } else {
      console.log(`✅ Found Semaglutide parent: ${semaParent.name} (${semaParent.id})`)
    }
    
      // Find and bundle missing Retatrutide products
    if (retaParent) {
      // Find all Retatrutide products that are not the parent and not already variants
      const missingReta = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: 'GLP3-R3TA', mode: 'insensitive' } },
            { name: { contains: 'GLP3-RETA', mode: 'insensitive' } }
          ],
          id: { not: retaParent.id },
          parentProductId: null, // Only get products that aren't already variants
          active: true
        }
      })
      
      console.log(`\n📦 Bundling ${missingReta.length} missing Retatrutide products...`)
      for (const product of missingReta) {
        // Extract mg from name
        const mgMatch = product.name.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)/i)
        const variantName = mgMatch ? `${mgMatch[1]}${mgMatch[2].toLowerCase()}` : (product.variantName || '0mg')
        
        await prisma.product.update({
          where: { id: product.id },
          data: {
            parentProductId: retaParent.id,
            variantName: variantName,
            variantImageUrl: product.imageUrl
          }
        })
        console.log(`   ✅ Bundled: ${product.name} -> ${variantName}`)
      }
    }
    
    // Find and bundle missing Tirzepatide products
    if (tirzParent) {
      const missingTirz = await prisma.product.findMany({
        where: {
          name: { contains: 'GLP2-TIRZ', mode: 'insensitive' },
          id: { not: tirzParent.id },
          parentProductId: null, // Only get products that aren't already variants
          active: true
        }
      })
      
      console.log(`\n📦 Bundling ${missingTirz.length} missing Tirzepatide products...`)
      for (const product of missingTirz) {
        // Extract mg from name or use variantName
        const mgMatch = product.name.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)/i)
        const variantName = mgMatch ? `${mgMatch[1]}${mgMatch[2].toLowerCase()}` : (product.variantName || '0mg')
        
        await prisma.product.update({
          where: { id: product.id },
          data: {
            parentProductId: tirzParent.id,
            variantName: variantName,
            variantImageUrl: product.imageUrl
          }
        })
        console.log(`   ✅ Bundled: ${product.name} -> ${variantName}`)
      }
    }
    
    // Find and bundle missing Semaglutide products
    // Note: GLP1-SEMA 20MG might be the parent, so we need to handle it specially
    if (semaParent) {
      // If the parent is "GLP1-SEMA 20MG", we need to rename it and make it a variant
      // First, find a better parent or create one
      let actualSemaParent = semaParent
      if (semaParent.name.includes('20MG')) {
        // Find another GLP1-SEMA product to use as parent, or use the first one
        const otherSema = await prisma.product.findFirst({
          where: {
            name: { contains: 'GLP1-SEMA', mode: 'insensitive' },
            id: { not: semaParent.id },
            active: true
          },
          orderBy: { name: 'asc' }
        })
        
        if (otherSema) {
          // Use the other one as parent
          actualSemaParent = otherSema
          // Make the 20MG one a variant
          await prisma.product.update({
            where: { id: semaParent.id },
            data: {
              parentProductId: otherSema.id,
              variantName: '20mg',
              variantImageUrl: semaParent.imageUrl
            }
          })
          console.log(`   ✅ Made ${semaParent.name} a variant of ${otherSema.name}`)
        }
      }
      
      const missingSema = await prisma.product.findMany({
        where: {
          name: { contains: 'GLP1-SEMA', mode: 'insensitive' },
          id: { not: actualSemaParent.id },
          parentProductId: null, // Only get products that aren't already variants
          active: true
        }
      })
      
      console.log(`\n📦 Bundling ${missingSema.length} missing Semaglutide products...`)
      for (const product of missingSema) {
        // Extract mg from name
        const mgMatch = product.name.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g)/i)
        const variantName = mgMatch ? `${mgMatch[1]}${mgMatch[2].toLowerCase()}` : (product.variantName || '0mg')
        
        await prisma.product.update({
          where: { id: product.id },
          data: {
            parentProductId: actualSemaParent.id,
            variantName: variantName,
            variantImageUrl: product.imageUrl
          }
        })
        console.log(`   ✅ Bundled: ${product.name} -> ${variantName}`)
      }
    }
    
    console.log('\n✨ Done fixing missing bundles!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })

