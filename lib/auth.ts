import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function getSession(request: NextRequest): Promise<{ userId: string; email: string } | null> {
  const sessionId = request.cookies.get('session')?.value
  if (!sessionId) {
    if (process.env.NODE_ENV === 'development') {
      console.log('No session cookie found')
    }
    return null
  }

  // Get session from database
  const session = await prisma.session.findUnique({
    where: { sessionId },
    include: { user: true },
  })

  if (!session) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Session not found in database:', sessionId)
    }
    return null
  }

  // Check if session has expired
  if (session.expiresAt < new Date()) {
    // Delete expired session
    await prisma.session.delete({ where: { id: session.id } })
    if (process.env.NODE_ENV === 'development') {
      console.log('Session expired:', sessionId)
    }
    return null
  }

  return { userId: session.user.id, email: session.user.email }
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
  
  // Calculate expiration date (7 days from now)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  
  // Check if Session model is available
  if (!prisma.session) {
    throw new Error('Session model not available. The Prisma client needs to be regenerated. Please:\n1. Stop your dev server (Ctrl+C)\n2. Run: npx prisma generate\n3. Run: npx prisma db push\n4. Restart your dev server: npm run dev')
  }
  
  try {
    // Store session in database
    await prisma.session.create({
      data: {
        sessionId,
        userId,
        expiresAt,
      },
    })
    
    // Log for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Session created in database:', sessionId, 'for user:', userId)
    }
  } catch (error: any) {
    console.error('Error creating session:', error)
    // If it's a Prisma error about missing model
    if (error.code === 'P2001' || error.message?.includes('Unknown arg') || error.message?.includes('session')) {
      throw new Error('Session model not available. Please restart your dev server after running: npx prisma generate && npx prisma db push')
    }
    throw error
  }
  
  return sessionId
}

export function requireAuth(request: NextRequest): Promise<{ userId: string; email: string }> {
  return new Promise(async (resolve, reject) => {
    const session = await getSession(request)
    if (!session) {
      reject(new Error('Unauthorized'))
    } else {
      resolve(session)
    }
  })
}


