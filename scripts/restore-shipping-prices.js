/**
 * Restores shipping prices to original values (before 25% reduction).
 * Run: node scripts/restore-shipping-prices.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const SHIPPING_DEFAULTS = {
  shipping_usps_ups_standard: '15',
  shipping_ups_2day: '25',
  shipping_fedex_2day: '30',
  shipping_amount: '15.00',
  free_shipping_threshold: '150.00',
}

async function main() {
  for (const [key, value] of Object.entries(SHIPPING_DEFAULTS)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
    console.log(`  ${key}: ${value}`)
  }
  console.log('\nShipping prices restored.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
