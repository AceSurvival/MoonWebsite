/**
 * Rounds up all product prices to the nearest dollar (ceiling).
 * Run: node scripts/round-up-prices.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, price: true, salePrice: true, variantName: true },
  })

  for (const p of products) {
    const newPrice = Math.ceil(p.price)
    const newSalePrice = p.salePrice != null ? Math.ceil(p.salePrice) : null

    await prisma.product.update({
      where: { id: p.id },
      data: {
        price: newPrice,
        salePrice: newSalePrice,
      },
    })
    const label = p.variantName ? `${p.name} (${p.variantName})` : p.name
    if (newPrice !== p.price || (p.salePrice != null && newSalePrice !== p.salePrice)) {
      console.log(`${label}: $${p.price} -> $${newPrice}` + (p.salePrice != null ? `, sale $${p.salePrice} -> $${newSalePrice}` : ''))
    }
  }
  console.log(`\nRounded up ${products.length} product(s) to nearest dollar.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
