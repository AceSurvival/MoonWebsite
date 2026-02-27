import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encryptData } from '@/lib/encryption'
import { rateLimit, sanitizeInput, validateEmail } from '@/lib/security'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const DISCOUNT_PERCENT = 10
const CODE_EXPIRY_DAYS = 30
const CODE_PREFIX = 'WELCOME10'

function generateDiscountCode(): string {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `${CODE_PREFIX}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(request, 5, 60000)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const rawEmail = typeof body.email === 'string' ? body.email.trim() : ''
    if (!rawEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    if (!validateEmail(rawEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }
    const email = sanitizeInput(rawEmail, 254)

    const encryptedEmail = encryptData(email)

    await prisma.newsletterSubscription.upsert({
      where: { email: encryptedEmail },
      update: { subscribed: true },
      create: {
        email: encryptedEmail,
        subscribed: true,
      },
    })

    let code = generateDiscountCode()
    let exists = await prisma.discountCode.findUnique({ where: { code } })
    while (exists) {
      code = generateDiscountCode()
      exists = await prisma.discountCode.findUnique({ where: { code } })
    }

    const expiryDate = new Date(Date.now() + CODE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    await prisma.discountCode.create({
      data: {
        code,
        discountType: 'PERCENTAGE',
        discountPercent: DISCOUNT_PERCENT,
        discountAmount: null,
        active: true,
        expiryDate,
      },
    })

    return NextResponse.json({
      success: true,
      code,
      discountPercent: DISCOUNT_PERCENT,
      expiryDate: expiryDate.toISOString(),
    })
  } catch (error) {
    console.error('Newsletter subscribe error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
