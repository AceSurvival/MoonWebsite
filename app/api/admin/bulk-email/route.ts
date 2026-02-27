import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decryptData } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

// Email client helpers (duplicated to avoid circular dependency)
let ResendClass: any = null
let resend: any = null

const getResendClient = async () => {
  if (!ResendClass) {
    try {
      const resendModule = await import('resend')
      ResendClass = resendModule.Resend
    } catch (error) {
      return null
    }
  }
  
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return null
    }
    try {
      resend = new ResendClass(apiKey)
    } catch (error) {
      return null
    }
  }
  return resend
}

const getFromEmail = async () => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'from_email' },
    })
    if (setting?.value) {
      return setting.value
    }
  } catch (error) {
    console.error('Error fetching from email:', error)
  }
  return process.env.FROM_EMAIL || 'onboarding@resend.dev'
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)
    const body = await request.json()

    const { subject, body: emailBody, sendToAllCustomers } = body

    if (!subject || !emailBody) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
    }

    // Get all customer emails from orders
    const orders = await prisma.order.findMany({
      select: {
        email: true,
        customerName: true,
      },
      distinct: ['email'],
    })

    if (orders.length === 0) {
      return NextResponse.json({ error: 'No customers found' }, { status: 404 })
    }

    const client = await getResendClient()
    if (!client) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    const fromEmail = await getFromEmail()
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Send emails (limit to 100 per batch to avoid rate limits)
    const emailsToSend = sendToAllCustomers ? orders : orders.slice(0, 100)
    
    for (const order of emailsToSend) {
      try {
        // Decrypt email
        const decryptedEmail = order.email ? decryptData(order.email) : order.email
        
        if (!decryptedEmail || !decryptedEmail.includes('@')) {
          results.failed++
          results.errors.push(`Invalid email for customer: ${order.customerName}`)
          continue
        }

        // Replace variables
        let personalizedBody = emailBody.replace(/{{customerName}}/g, order.customerName || 'Customer')
        personalizedBody = personalizedBody.replace(/{{orderNumber}}/g, 'N/A')

        // Convert to HTML
        const htmlBody = personalizedBody.split('\n').map((line: string) => {
          if (line.trim() === '') return '<br>'
          if (line.startsWith('# ')) return `<h1 style="color: #9333ea; font-size: 24px; margin: 20px 0 10px 0;">${line.substring(2)}</h1>`
          if (line.startsWith('## ')) return `<h2 style="color: #9333ea; font-size: 20px; margin: 18px 0 8px 0;">${line.substring(3)}</h2>`
          if (line.startsWith('### ')) return `<h3 style="color: #9333ea; font-size: 18px; margin: 16px 0 6px 0;">${line.substring(4)}</h3>`
          if (line.startsWith('- ') || line.startsWith('* ')) return `<p style="margin: 8px 0; padding-left: 20px; position: relative;"><span style="position: absolute; left: 0;">•</span> ${line.substring(2)}</p>`
          if (line.includes('http')) {
            const urlRegex = /(https?:\/\/[^\s]+)/g
            return `<p style="margin: 10px 0;">${line.replace(urlRegex, '<a href="$1" style="color: #9333ea; text-decoration: underline;">$1</a>')}</p>`
          }
          return `<p style="margin: 10px 0; line-height: 1.6;">${line}</p>`
        }).join('')

        // Wrap in email template
        const logoUrl = await prisma.setting.findUnique({ where: { key: 'logo_image' } }).then(s => s?.value || null).catch(() => null)
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'
        
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f3e8ff 0%, #ffffff 50%, #fce7f3 100%); font-family: Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #f3e8ff 0%, #ffffff 50%, #fce7f3 100%);">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          ${logoUrl ? `
          <tr>
            <td align="center" style="padding: 30px 20px 20px 20px; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);">
              <img src="${logoUrl}" alt="Logo" style="max-width: 200px; height: auto; display: block;" />
            </td>
          </tr>
          ` : `
          <tr>
            <td style="padding: 20px; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); height: 20px;"></td>
          </tr>
          `}
          <tr>
            <td style="padding: 30px 40px;">
              <div style="color: #1f2937; font-size: 16px; line-height: 1.6;">
                ${htmlBody}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background: #020617; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Moon Beauty Alchemy. All rights reserved.
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                <a href="${siteUrl}" style="color: #eab308; text-decoration: none;">Visit our website</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `.trim()

        const { error } = await client.emails.send({
          from: fromEmail,
          to: decryptedEmail,
          subject: subject,
          html: emailHtml,
        })

        if (error) {
          results.failed++
          results.errors.push(`Failed to send to ${decryptedEmail}: ${error.message || 'Unknown error'}`)
        } else {
          results.sent++
        }

        // Rate limiting: wait 100ms between emails
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error: any) {
        results.failed++
        results.errors.push(`Error processing ${order.customerName}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      total: emailsToSend.length,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors.slice(0, 10), // Limit error messages
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error sending bulk email:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
