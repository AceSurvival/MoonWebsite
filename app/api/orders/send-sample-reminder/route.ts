import { NextRequest, NextResponse } from 'next/server'
import { sendPaymentReminderEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Send a sample payment reminder email
// This endpoint sends a sample email to ace.mc.owner@gmail.com
export async function GET(request: NextRequest) {
  try {
    console.log('Sending sample payment reminder email to ace.mc.owner@gmail.com...')
    
    const result = await sendPaymentReminderEmail({
      orderNumber: 'ORD-12345',
      customerName: 'Sample Customer',
      email: 'ace.mc.owner@gmail.com',
      totalAmount: 149.99,
      paymentMethod: 'ZELLE',
      orderDate: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
      hoursRemaining: 54, // 72 - 18 = 54 hours remaining
    })
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Sample payment reminder email sent successfully to ace.mc.owner@gmail.com',
        emailId: result.data?.id,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send email',
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error sending sample email:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
