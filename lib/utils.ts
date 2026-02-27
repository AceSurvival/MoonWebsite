import { prisma } from './prisma'

export async function generateOrderNumber(): Promise<string> {
  const maxAttempts = 10
  let attempts = 0
  let baseNumber = 10000 // Start from 10000

  // Find the highest order number once
  const lastOrder = await prisma.order.findFirst({
    orderBy: {
      orderNumber: 'desc',
    },
    select: {
      orderNumber: true,
    },
  })

  if (lastOrder) {
    // Extract number from order number (handle both old format "1234" and new format "HR-12345" or just "12345")
    const match = lastOrder.orderNumber.match(/\d+/)
    if (match) {
      const lastNumber = parseInt(match[0], 10)
      // Ensure we start from at least 10000, and increment from the last number
      // Cap at 99999 to ensure we stay within 5 digits
      baseNumber = Math.min(Math.max(lastNumber + 1, 10000), 99999)
    }
  }

  // Try to find an available order number
  while (attempts < maxAttempts) {
    let nextNumber = baseNumber + attempts

    // Ensure we don't exceed 5 digits (99999)
    if (nextNumber > 99999) {
      // If we've exceeded 99999, wrap around to 10000
      nextNumber = 10000 + (nextNumber % 90000)
    }

    // Format as 5-digit number with leading zeros (e.g., "10000", "13429")
    const orderNumber = nextNumber.toString().padStart(5, '0')

    // Check if this order number already exists
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    })

    // If it doesn't exist, we can use it
    if (!existingOrder) {
      return orderNumber
    }

    // If it exists, try next number
    attempts++
  }

  // Fallback: use a random 5-digit number if all attempts fail
  const fallbackNumber = Math.floor(Math.random() * 90000) + 10000 // Random number between 10000-99999
  return fallbackNumber.toString().padStart(5, '0')
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}


