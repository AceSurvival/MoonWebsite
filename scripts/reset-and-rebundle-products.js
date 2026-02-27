const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Resetting product bundles...\n')
  
  try {
    // Reset all variants to be standalone products
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
    
    console.log('✅ Reset all variants\n')
    console.log('Now run: node scripts/bundle-product-variants.js\n')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })



