#!/usr/bin/env node

/**
 * Backfill discount code usage and revenue statistics from existing orders
 * 
 * This script:
 * 1. Calculates uses count from all orders using each discount code
 * 2. Calculates revenue from all PAID orders using each discount code
 * 3. Updates the discount code records with these stats
 * 
 * Usage:
 *   node scripts/backfill-discount-code-stats.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function backfillDiscountCodeStats() {
  try {
    console.log('🔄 Starting backfill of discount code statistics...\n')
    
    // Get all discount codes
    const discountCodes = await prisma.discountCode.findMany({
      include: {
        orders: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
          },
        },
      },
    })
    
    console.log(`Found ${discountCodes.length} discount codes to process\n`)
    
    let updated = 0
    let skipped = 0
    
    for (const code of discountCodes) {
      // Calculate uses (all orders using this code)
      const uses = code.orders.length
      
      // Calculate revenue (only from PAID orders)
      const revenueGenerated = code.orders
        .filter(order => order.status === 'PAID')
        .reduce((sum, order) => sum + order.totalAmount, 0)
      
      // Update the discount code
      await prisma.discountCode.update({
        where: { id: code.id },
        data: {
          uses,
          revenueGenerated,
        },
      })
      
      updated++
      console.log(`✅ Updated ${code.code}: ${uses} uses, $${revenueGenerated.toFixed(2)} revenue`)
    }
    
    console.log(`\n✅ Backfill complete!`)
    console.log(`   Updated: ${updated} discount codes`)
    console.log(`   Skipped: ${skipped} discount codes`)
  } catch (error) {
    console.error('\n❌ Error backfilling discount code stats:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

backfillDiscountCodeStats()
