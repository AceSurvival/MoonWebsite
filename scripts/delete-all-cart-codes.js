#!/usr/bin/env node

/**
 * Delete all discount codes starting with "CART"
 * 
 * This script removes all abandoned cart discount codes from the database.
 * 
 * Usage:
 *   node scripts/delete-all-cart-codes.js
 *   node scripts/delete-all-cart-codes.js --dry-run  (preview only)
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function deleteAllCartCodes(dryRun = true) {
  try {
    console.log('🧹 Starting cleanup of all CART discount codes...\n')
    
    if (dryRun) {
      console.log('⚠️  DRY RUN MODE - No codes will be deleted\n')
    } else {
      console.log('⚠️  LIVE MODE - Codes will be permanently deleted!\n')
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
            status: true,
          },
        },
      },
    })
    
    console.log(`Found ${cartCodes.length} CART discount codes\n`)
    
    // Check which ones are used in orders
    const codesWithOrders = cartCodes.filter(code => code.orders.length > 0)
    const codesWithoutOrders = cartCodes.filter(code => code.orders.length === 0)
    
    console.log(`📊 Breakdown:`)
    console.log(`   - Codes used in orders: ${codesWithOrders.length}`)
    console.log(`   - Codes not used: ${codesWithoutOrders.length}\n`)
    
    if (codesWithOrders.length > 0) {
      console.log(`⚠️  Warning: ${codesWithOrders.length} codes are used in orders:`)
      codesWithOrders.slice(0, 10).forEach(code => {
        console.log(`   - ${code.code}: ${code.orders.length} order(s)`)
      })
      if (codesWithOrders.length > 10) {
        console.log(`   ... and ${codesWithOrders.length - 10} more`)
      }
      console.log('')
    }
    
    if (!dryRun) {
      // Delete all CART codes (including ones with orders)
      // Note: This will set discountCodeId to null in orders that reference these codes
      console.log('🗑️  Deleting all CART discount codes...\n')
      
      const deleteResult = await prisma.discountCode.deleteMany({
        where: {
          code: {
            startsWith: 'CART',
          },
        },
      })
      
      console.log(`✅ Deleted ${deleteResult.count} CART discount codes`)
      console.log(`\n📝 Note: Orders that used these codes will have their discountCodeId set to null`)
      console.log(`   The discount amount is still stored in the order's discountAmount field`)
    } else {
      console.log('✅ DRY RUN: Would delete all CART discount codes')
      console.log(`\n📝 To actually delete them, run:`)
      console.log(`   node scripts/delete-all-cart-codes.js --force`)
    }
  } catch (error) {
    console.error('\n❌ Error deleting CART codes:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

const args = process.argv.slice(2)
const dryRun = !args.includes('--force')

deleteAllCartCodes(dryRun)
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
