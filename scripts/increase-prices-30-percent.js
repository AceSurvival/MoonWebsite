/**
 * Increase all product prices by 30%, rounded up to the nearest dollar.
 * Run: node scripts/increase-prices-30-percent.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const MULTIPLIER = 1.3

function roundUp(value) {
  return Math.ceil(value)
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, price: true, salePrice: true, variantName: true },
  })

  console.log(`Increasing ${products.length} product(s) by 30%, rounding up to nearest dollar.\n`)

  for (const p of products) {
    const newPrice = roundUp(p.price * MULTIPLIER)
    const newSalePrice = p.salePrice != null ? roundUp(p.salePrice * MULTIPLIER) : null

    await prisma.product.update({
      where: { id: p.id },
      data: {
        price: newPrice,
        salePrice: newSalePrice,
      },
    })

    const label = p.variantName ? `${p.name} (${p.variantName})` : p.name
    console.log(`${label}: $${p.price} -> $${newPrice}` + (p.salePrice != null ? `, sale $${p.salePrice} -> $${newSalePrice}` : ''))
  }

  console.log(`\nDone. Updated ${products.length} product(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
