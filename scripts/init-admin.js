const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@moonbeautyalchemy.com'
  const password = process.env.ADMIN_PASSWORD || 'changeme'

  const passwordHash = await bcrypt.hash(password, 10)

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    console.log('Admin user already exists. Updating password...')
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    })
    console.log('Admin password updated!')
  } else {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    })
    console.log('Admin user created!')
  }

  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


