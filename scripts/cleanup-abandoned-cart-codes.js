#!/usr/bin/env node

/**
 * Cleanup script to remove duplicate abandoned cart discount codes
 * 
 * This script:
 * 1. Finds all discount codes starting with "CART"
 * 2. Checks which ones are referenced in abandoned cart records
 * 3. Checks which ones are used in orders
 * 4. Deletes unused/duplicate codes
 * 
 * Usage:
 *   node scripts/cleanup-abandoned-cart-codes.js
 *   node scripts/cleanup-abandoned-cart-codes.js --dry-run  (preview only)
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanupAbandonedCartCodes() {
  const isDryRun = process.argv.includes('--dry-run')
  
  try {
    console.log('🧹 Starting cleanup of abandoned cart discount codes...\n')
    
    if (isDryRun) {
      console.log('⚠️  DRY RUN MODE - No codes will be deleted\n')
    }
    
    // Get all CART discount codes
    const cartCodes = await prisma.discountCode.findMany({
      where: {
        code: {
          startsWith: 'CART',
        },
      },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    })
    
    console.log(`Found ${cartCodes.length} CART discount codes\n`)
    
    // Get all abandoned cart records
    const abandonedCarts = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: 'abandoned_cart_',
        },
      },
    })
    
    // Extract discount codes from abandoned cart records
    const codesInCarts = new Set()
    for (const cart of abandonedCarts) {
      try {
        const data = JSON.parse(cart.value)
        if (data.discountCode) {
          codesInCarts.add(data.discountCode)
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
    
    console.log(`Found ${codesInCarts.size} discount codes referenced in abandoned cart records\n`)
    
    // Find codes to delete
    const codesToDelete = []
    const codesToKeep = []
    
    for (const code of cartCodes) {
      const isInCart = codesInCarts.has(code.code)
      const isInOrder = code.orders.length > 0
      const isExpired = code.expiryDate && new Date(code.expiryDate) < new Date()
      
      if (isInOrder) {
        codesToKeep.push({
          code: code.code,
          reason: `Used in ${code.orders.length} order(s)`,
        })
      } else if (isInCart) {
        codesToKeep.push({
          code: code.code,
          reason: 'Referenced in abandoned cart record',
        })
      } else if (isExpired) {
        codesToDelete.push({
          code: code.code,
          reason: 'Expired and not used',
          expiryDate: code.expiryDate,
        })
      } else {
        codesToDelete.push({
          code: code.code,
          reason: 'Not referenced in carts or orders',
        })
      }
    }
    
    console.log(`\n📊 Summary:`)
    console.log(`   Codes to keep: ${codesToKeep.length}`)
    console.log(`   Codes to delete: ${codesToDelete.length}\n`)
    
    if (codesToKeep.length > 0) {
      console.log(`\n✅ Codes to KEEP:`)
      codesToKeep.slice(0, 10).forEach(({ code, reason }) => {
        console.log(`   ${code} - ${reason}`)
      })
      if (codesToKeep.length > 10) {
        console.log(`   ... and ${codesToKeep.length - 10} more`)
      }
    }
    
    if (codesToDelete.length > 0) {
      console.log(`\n❌ Codes to DELETE:`)
      codesToDelete.slice(0, 20).forEach(({ code, reason, expiryDate }) => {
        const expiry = expiryDate ? ` (expired: ${new Date(expiryDate).toLocaleDateString()})` : ''
        console.log(`   ${code} - ${reason}${expiry}`)
      })
      if (codesToDelete.length > 20) {
        console.log(`   ... and ${codesToDelete.length - 20} more`)
      }
    }
    
    if (!isDryRun && codesToDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${codesToDelete.length} unused discount codes...`)
      
      let deleted = 0
      let errors = 0
      
      for (const { code } of codesToDelete) {
        try {
          await prisma.discountCode.delete({
            where: { code },
          })
          deleted++
          if (deleted % 100 === 0) {
            console.log(`   Deleted ${deleted}/${codesToDelete.length}...`)
          }
        } catch (error) {
          console.error(`   Error deleting ${code}:`, error.message)
          errors++
        }
      }
      
      console.log(`\n✅ Cleanup complete!`)
      console.log(`   Deleted: ${deleted}`)
      console.log(`   Errors: ${errors}`)
      console.log(`   Remaining CART codes: ${cartCodes.length - deleted}`)
    } else if (isDryRun) {
      console.log(`\n💡 Run without --dry-run to actually delete these codes`)
    } else {
      console.log(`\n✅ No codes to delete!`)
    }
    
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanupAbandonedCartCodes()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error)
    process.exit(1)
  })
