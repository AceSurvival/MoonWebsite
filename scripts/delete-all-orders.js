const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function deleteAllOrders() {
  try {
    console.log('Deleting all orders...')
    
    // Delete all order items first (due to foreign key constraints)
    const deletedItems = await prisma.orderItem.deleteMany({})
    console.log(`Deleted ${deletedItems.count} order items`)
    
    // Delete all creator code usages
    const deletedUsages = await prisma.creatorCodeUsage.deleteMany({})
    console.log(`Deleted ${deletedUsages.count} creator code usages`)
    
    // Delete all orders
    const deletedOrders = await prisma.order.deleteMany({})
    console.log(`Deleted ${deletedOrders.count} orders`)
    
    console.log('✅ All orders deleted successfully!')
  } catch (error) {
    console.error('❌ Error deleting orders:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

deleteAllOrders()








