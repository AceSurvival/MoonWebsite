import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use a placeholder URL when DATABASE_URL is missing so PrismaClient can be
// constructed during Vercel build (env vars may not be available then). At
// runtime on Vercel, DATABASE_URL is set and the real DB is used.
const databaseUrl = process.env.DATABASE_URL || 'postgresql://build:build@localhost:5432/build'

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: { url: databaseUrl },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma


