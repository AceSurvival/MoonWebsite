import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with connection pooling and better error handling
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Handle connection errors gracefully
prisma.$connect().catch((error) => {
  console.error('Failed to connect to database:', error)
  if (error.message?.includes('db.prisma.io')) {
    console.error('⚠️  Database connection error: Please check your DATABASE_URL environment variable.')
    console.error('   The URL should point to a valid PostgreSQL database (e.g., Vercel Postgres, Supabase, Neon)')
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma


