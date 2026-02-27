const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({
    where: { active: true },
    select: {
      name: true,
      slug: true,
      imageUrl: true,
    },
    take: 10,
  })
  
  console.log('Sample products and their image URLs:')
  products.forEach(p => {
    console.log(`${p.name}: ${p.imageUrl || 'NO IMAGE URL'}`)
  })
  
  await prisma.$disconnect()
}

main().catch(console.error)

