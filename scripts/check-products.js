const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: 'Retatrutide', mode: 'insensitive' } },
        { name: { contains: 'Tirzepatide', mode: 'insensitive' } },
        { name: { contains: 'Semaglutide', mode: 'insensitive' } },
        { name: { contains: 'Reta', mode: 'insensitive' } },
        { name: { contains: 'Tirz', mode: 'insensitive' } },
        { name: { contains: 'Sema', mode: 'insensitive' } },
        { name: { contains: 'GLP3', mode: 'insensitive' } },
        { name: { contains: 'GLP2', mode: 'insensitive' } },
        { name: { contains: 'GLP1', mode: 'insensitive' } },
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      variantName: true,
      parentProductId: true,
      codename: true,
    },
    orderBy: { name: 'asc' }
  })
  
  console.log(`Found ${products.length} products:\n`)
  products.forEach(p => {
    console.log(`${p.name} | slug: ${p.slug} | variantName: ${p.variantName || 'none'} | parentId: ${p.parentProductId || 'none'} | codename: ${p.codename || 'none'}`)
  })
  
  await prisma.$disconnect()
}

main().catch(console.error)



