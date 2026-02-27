import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendContactEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Save to database
    await prisma.message.create({
      data: {
        name,
        email,
        subject,
        message,
      },
    })

    // Send email to admin (don't fail if email fails, just log it)
    try {
      await sendContactEmail({ name, email, subject, message })
    } catch (emailError) {
      console.error('Failed to send contact email (message still saved):', emailError)
      // Continue even if email fails - message is saved in database
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


