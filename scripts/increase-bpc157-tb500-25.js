/**
 * Increase BPC-157 and TB-500 product prices by 25%, rounded up to nearest dollar.
 * Run: node scripts/increase-bpc157-tb500-25.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const MULTIPLIER = 1.25

function roundUp(value) {
  return Math.ceil(value)
}

function isBpc157OrTb500(name) {
  if (!name) return false
  const n = name.toUpperCase()
  return n.includes('BPC-157') || n.includes('BPC157') || n.includes('TB-500') || n.includes('TB500')
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, price: true, salePrice: true, variantName: true },
  })

  const matching = products.filter((p) => isBpc157OrTb500(p.name) || isBpc157OrTb500(p.variantName))
  if (matching.length === 0) {
    console.log('No BPC-157 or TB-500 products found.')
    return
  }

  console.log(`Increasing ${matching.length} BPC-157 / TB-500 product(s) by 25%, rounded up.\n`)

  for (const p of matching) {
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

  console.log(`\nDone. Updated ${matching.length} product(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
