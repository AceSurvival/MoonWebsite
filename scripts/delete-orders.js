const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const orderNumbers = ['10002', '10003']
  for (const n of orderNumbers) {
    const order = await prisma.order.findUnique({ where: { orderNumber: n } })
    if (order) {
      await prisma.order.delete({ where: { orderNumber: n } })
      console.log('Deleted order', n)
    } else {
      console.log('Order', n, 'not found')
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
