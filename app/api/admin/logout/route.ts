import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get('session')?.value
  
  // Delete session from database if it exists
  if (sessionId) {
    try {
      await prisma.session.deleteMany({
        where: { sessionId },
      })
    } catch (error) {
      // Session might not exist, that's okay
      console.error('Error deleting session:', error)
    }
  }
  
  const response = NextResponse.json({ success: true })
  response.cookies.delete('session')
  return response
}


