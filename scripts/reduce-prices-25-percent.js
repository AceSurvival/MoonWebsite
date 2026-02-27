/**
 * Reduces all product prices and sale prices by 25%.
 * Also reduces shipping-related settings (if numeric) by 25%.
 * Run from project root: node scripts/reduce-prices-25-percent.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const MULTIPLIER = 0.75 // 25% reduction => new price = old price * 0.75

const SHIPPING_PRICE_KEYS = [
  'shipping_usps_ups_standard',
  'shipping_ups_2day',
  'shipping_fedex_2day',
  'shipping_amount',
  'free_shipping_threshold',
]

async function main() {
  console.log('Reducing all prices by 25% (multiplier = 0.75)\n')

  // 1. Update all products (price and salePrice)
  const products = await prisma.product.findMany({
    select: { id: true, name: true, price: true, salePrice: true, variantName: true },
  })

  let productUpdates = 0
  for (const p of products) {
    const newPrice = Math.round(p.price * MULTIPLIER * 100) / 100
    const newSalePrice = p.salePrice != null
      ? Math.round(p.salePrice * MULTIPLIER * 100) / 100
      : null

    await prisma.product.update({
      where: { id: p.id },
      data: {
        price: newPrice,
        salePrice: newSalePrice,
      },
    })
    productUpdates++
    const label = p.variantName ? `${p.name} (${p.variantName})` : p.name
    console.log(`  Product: ${label}  $${p.price} -> $${newPrice}${p.salePrice != null ? `, sale $${p.salePrice} -> $${newSalePrice}` : ''}`)
  }
  console.log(`\nUpdated ${productUpdates} product(s).\n`)

  // 2. Update shipping-related settings
  for (const key of SHIPPING_PRICE_KEYS) {
    const setting = await prisma.setting.findUnique({
      where: { key },
    })
    if (!setting) continue
    const num = parseFloat(setting.value)
    if (Number.isNaN(num) || num < 0) continue
    const newVal = Math.round(num * MULTIPLIER * 100) / 100
    await prisma.setting.update({
      where: { key },
      data: { value: String(newVal) },
    })
    console.log(`  Setting: ${key}  ${setting.value} -> ${newVal}`)
  }
  console.log('\nDone. All prices reduced by 25%.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
