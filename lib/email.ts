// Use dynamic import to avoid build-time errors if Resend is not available
let ResendClass: any = null
let resend: any = null

const getResendClient = async () => {
  // Lazy load Resend only when needed
  if (!ResendClass) {
    try {
      const resendModule = await import('resend')
      ResendClass = resendModule.Resend
    } catch (error) {
      console.warn('Resend package not available - email functionality will be disabled:', error)
      return null
    }
  }
  
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('RESEND_API_KEY not set - email functionality will be disabled')
      return null
    }
    try {
      resend = new ResendClass(apiKey)
    } catch (error) {
      console.error('Error initializing Resend client:', error)
      return null
    }
  }
  return resend
}

// Get email addresses from environment or settings
const getFromEmail = async () => {
  // Try to get from database settings first
  try {
    const { prisma } = await import('@/lib/prisma')
    const setting = await prisma.setting.findUnique({
      where: { key: 'from_email' },
    })
    if (setting?.value) {
      return setting.value
    }
  } catch (error) {
    console.error('Error fetching from email from settings:', error)
  }
  
  // Fallback to environment variable or default
  return process.env.FROM_EMAIL || 'onboarding@resend.dev'
}

const getAdminEmail = async (): Promise<string> => {
  let email: string | undefined
  try {
    const { prisma } = await import('@/lib/prisma')
    const setting = await prisma.setting.findUnique({
      where: { key: 'contact_email' },
    })
    if (setting?.value?.trim()) {
      email = setting.value.trim()
    }
  } catch (error) {
    console.error('Error fetching admin email from settings:', error)
  }
  if (!email) {
    email = process.env.ADMIN_EMAIL?.trim()
  }
  if (!email || !email.includes('@')) {
    console.warn(
      'Admin email not set or invalid. Set Settings > contact_email in admin, or ADMIN_EMAIL env var, so order notifications are delivered.'
    )
    return 'admin@moonbeautyalchemy.com'
  }
  return email
}

/**
 * Send contact form email to admin
 */
export async function sendContactEmail(data: {
  name: string
  email: string
  subject: string
  message: string
}) {
  try {
    const client = await getResendClient()
    if (!client) {
      console.warn('Resend client not available - skipping email send')
      return { success: false, error: 'Email service not configured' }
    }
    
    const adminEmail = await getAdminEmail()
    
    const { data: emailData, error } = await client.emails.send({
      from: await getFromEmail(),
      to: adminEmail,
      replyTo: data.email,
      subject: `Contact Form: ${data.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #9333ea;">New Contact Form Submission</h2>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Subject:</strong> ${data.subject}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${data.message}</p>
          </div>
          <p style="color: #6b7280; font-size: 12px;">
            You can reply directly to this email to respond to ${data.name}.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Error sending contact email:', error)
      return { success: false, error }
    }

    return { success: true, data: emailData }
  } catch (error) {
    console.error('Error sending contact email:', error)
    return { success: false, error }
  }
}

/**
 * Generate tracking link based on shipping provider
 */
function getTrackingLink(trackingNumber: string, provider: string | null | undefined): string {
  if (!trackingNumber) return ''
  
  const tracking = trackingNumber.trim()
  
  switch (provider?.toUpperCase()) {
    case 'UPS':
      return `https://www.ups.com/track?tracknum=${tracking}`
    case 'USPS':
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`
    case 'FEDEX':
      return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`
    case 'DHL':
      return `https://www.dhl.com/en/express/tracking.html?AWB=${tracking}`
    default:
      // Default to USPS if no provider specified
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`
  }
}

/**
 * Get payment settings from database
 */
async function getPaymentSettings() {
  try {
    const { prisma } = await import('@/lib/prisma')
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['zelle_instructions', 'bitcoin_address', 'bitcoin_qr', 'cashapp_tag'],
        },
      },
    })
    
    const settingsMap: Record<string, string> = {}
    settings.forEach((s) => {
      settingsMap[s.key] = s.value
    })
    
    return {
      zelle: settingsMap['zelle_instructions'] || '',
      bitcoin: settingsMap['bitcoin_address'] || '',
      bitcoinQr: settingsMap['bitcoin_qr'] || null,
      cashapp: settingsMap['cashapp_tag'] || '',
    }
  } catch (error) {
    console.error('Error fetching payment settings:', error)
    return {
      zelle: '',
      bitcoin: '',
      bitcoinQr: null,
      cashapp: '',
    }
  }
}

/**
 * Send order confirmation email to customer (initial order - unpaid)
 */
export async function sendOrderConfirmationEmail(data: {
  orderNumber: string
  customerName: string
  email: string
  totalAmount: number
  subtotalAmount: number
  discountAmount: number
  shippingAmount: number
  taxAmount: number
  items: Array<{ name: string; quantity: number; unitPrice: number }>
  paymentMethod: string
  shippingAddress: {
    address: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  billingAddress?: {
    address: string
    city: string
    state: string
    postalCode: string
    country: string
  } | null
  orderDate: string
}) {
  try {
    const client = await getResendClient()
    if (!client) {
      console.warn('Resend client not available - skipping email send')
      return { success: false, error: 'Email service not configured' }
    }
    
    const paymentSettings = await getPaymentSettings()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonbeautyalchemy.com'
    const adminEmail = await getAdminEmail()
    
    // Format order date
    const orderDateFormatted = new Date(data.orderDate).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
    
    // Build payment instructions based on payment method
    let paymentInstructionsHtml = ''
    let paymentMethodDisplay = data.paymentMethod
    
    if (data.paymentMethod === 'ZELLE') {
      paymentMethodDisplay = 'Zelle'
      paymentInstructionsHtml = `
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">⚠️ IMPORTANT</p>
          <p style="margin: 0 0 15px 0; font-weight: bold; color: #78350f;">How to Pay</p>
          <p style="margin: 0 0 5px 0; color: #78350f;"><strong>Zelle:</strong> ${paymentSettings.zelle || 'Contact us for Zelle information'}</p>
          <p style="margin: 10px 0 5px 0; color: #78350f;"><strong>Memo Requirements:</strong> Please include your FIRST & LAST NAME and your ORDER NUMBER only in the Zelle memo.</p>
          <p style="margin: 10px 0 0 0; color: #dc2626; font-weight: bold;">⚠️ Do not include any product names in your payment memo.</p>
        </div>
      `
    } else if (data.paymentMethod === 'BITCOIN') {
      paymentMethodDisplay = 'Bitcoin'
      const adminEmail = await getAdminEmail()
      paymentInstructionsHtml = `
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">⚠️ IMPORTANT</p>
          <p style="margin: 0 0 15px 0; font-weight: bold; color: #78350f;">How to Pay</p>
          <p style="margin: 0 0 5px 0; color: #78350f;"><strong>Bitcoin Address:</strong></p>
          <p style="margin: 0 0 15px 0; color: #78350f; font-family: monospace; word-break: break-all; background: #fff; padding: 10px; border-radius: 4px;">${paymentSettings.bitcoin || 'Contact us for Bitcoin address'}</p>
          ${paymentSettings.bitcoinQr ? `<img src="${paymentSettings.bitcoinQr}" alt="Bitcoin QR Code" style="max-width: 200px; margin: 10px 0;" />` : ''}
          <p style="margin: 10px 0 5px 0; color: #78350f;"><strong>Amount:</strong> Send exactly $${data.totalAmount.toFixed(2)} worth of Bitcoin</p>
          <p style="margin: 10px 0 0 0; color: #dc2626; font-weight: bold;">⚠️ Do not include any product names in transaction notes.</p>
        </div>
        <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e40af;">📧 Payment Confirmation Required</p>
          <p style="margin: 0 0 10px 0; color: #1e3a8a;">After sending your Bitcoin payment, please email your payment confirmation (transaction ID/hash) to:</p>
          <p style="margin: 10px 0; color: #1e3a8a; font-weight: bold; font-size: 16px;">${adminEmail}</p>
          <p style="margin: 10px 0 0 0; color: #1e3a8a;">Include your order number <strong>#${data.orderNumber}</strong> in the email subject line.</p>
        </div>
      `
    } else if (data.paymentMethod === 'CASHAPP') {
      paymentMethodDisplay = 'Cash App'
      paymentInstructionsHtml = `
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">⚠️ IMPORTANT</p>
          <p style="margin: 0 0 15px 0; font-weight: bold; color: #78350f;">How to Pay</p>
          <p style="margin: 0 0 5px 0; color: #78350f;"><strong>Cash App:</strong> ${paymentSettings.cashapp || 'Contact us for Cash App tag'}</p>
          <p style="margin: 10px 0 5px 0; color: #78350f;"><strong>Memo Requirements:</strong> Please include your FIRST & LAST NAME and your ORDER NUMBER only in the Cash App memo.</p>
          <p style="margin: 10px 0 0 0; color: #dc2626; font-weight: bold;">⚠️ Do not include any product names in your payment memo.</p>
        </div>
      `
    }
    
    // Product table
    const orderItemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">$${item.unitPrice.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151; font-weight: bold;">$${(item.unitPrice * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('')
    
    // Cost summary
    const shippingDisplay = data.shippingAmount === 0 ? 'Free shipping' : `$${data.shippingAmount.toFixed(2)}`
    
    const emailContent = `
      <div style="background: #9333ea; padding: 30px; text-align: center; margin: -20px -20px 30px -20px;">
        <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: bold;">IMPORTANT</h1>
      </div>
      
      ${paymentInstructionsHtml}
      
      <h2 style="color: #374151; font-size: 24px; margin: 30px 0 10px 0;">Order #${data.orderNumber} (${orderDateFormatted})</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #ffffff; border: 1px solid #e5e7eb;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #374151; font-weight: bold;">Product</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #374151; font-weight: bold;">Quantity</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #374151; font-weight: bold;">Cost</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #374151; font-weight: bold;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${orderItemsHtml}
        </tbody>
      </table>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; color: #374151;">Subtotal:</td>
          <td style="padding: 8px 0; text-align: right; color: #374151; font-weight: bold;">$${data.subtotalAmount.toFixed(2)}</td>
        </tr>
        ${data.discountAmount > 0 ? `
        <tr>
          <td style="padding: 8px 0; color: #374151;">Discount:</td>
          <td style="padding: 8px 0; text-align: right; color: #10b981; font-weight: bold;">-$${data.discountAmount.toFixed(2)}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; color: #374151;">Shipping:</td>
          <td style="padding: 8px 0; text-align: right; color: #374151; font-weight: bold;">${shippingDisplay}</td>
        </tr>
        ${data.taxAmount > 0 ? `
        <tr>
          <td style="padding: 8px 0; color: #374151;">Tax:</td>
          <td style="padding: 8px 0; text-align: right; color: #374151; font-weight: bold;">$${data.taxAmount.toFixed(2)}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; color: #374151; font-weight: bold;">Payment method:</td>
          <td style="padding: 8px 0; text-align: right; color: #374151; font-weight: bold;">${paymentMethodDisplay}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-top: 2px solid #9333ea; color: #374151; font-size: 18px; font-weight: bold;">Total:</td>
          <td style="padding: 12px 0; border-top: 2px solid #9333ea; text-align: right; color: #374151; font-size: 18px; font-weight: bold;">$${data.totalAmount.toFixed(2)}</td>
        </tr>
      </table>
      
      <div style="display: flex; gap: 20px; margin: 30px 0;">
        <div style="flex: 1; background: #f9fafb; padding: 20px; border-radius: 8px;">
          <h3 style="color: #9333ea; margin: 0 0 10px 0; font-size: 18px;">Billing Address</h3>
          <p style="margin: 5px 0; color: #374151;">${data.billingAddress ? data.billingAddress.address : data.shippingAddress.address}</p>
          <p style="margin: 5px 0; color: #374151;">${data.billingAddress ? `${data.billingAddress.city}, ${data.billingAddress.state} ${data.billingAddress.postalCode}` : `${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}`}</p>
          <p style="margin: 5px 0; color: #374151;">${data.billingAddress ? data.billingAddress.country : data.shippingAddress.country}</p>
        </div>
        <div style="flex: 1; background: #f9fafb; padding: 20px; border-radius: 8px;">
          <h3 style="color: #9333ea; margin: 0 0 10px 0; font-size: 18px;">Shipping Address</h3>
          <p style="margin: 5px 0; color: #374151;">${data.shippingAddress.address}</p>
          <p style="margin: 5px 0; color: #374151;">${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}</p>
          <p style="margin: 5px 0; color: #374151;">${data.shippingAddress.country}</p>
        </div>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
        We look forward to fulfilling your order soon.
      </p>
    `
    
    const finalHtml = await wrapEmailTemplate(emailContent, { showLogo: true })

    const { data: emailData, error } = await client.emails.send({
      from: await getFromEmail(),
      to: data.email,
      subject: `Order #${data.orderNumber} - Payment Instructions`,
      html: finalHtml,
    })

    if (error) {
      console.error('Error sending order confirmation email:', error)
      return { success: false, error }
    }

    return { success: true, data: emailData }
  } catch (error) {
    console.error('Error sending order confirmation email:', error)
    return { success: false, error }
  }
}

/**
 * Get email template from database or return default
 */
async function getEmailTemplate(templateKey: string, defaultSubject: string, defaultBody: string, defaultHtml?: string): Promise<{ subject: string; body: string; html?: string }> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const template = await prisma.setting.findUnique({
      where: { key: templateKey },
    })
    
    if (template?.value) {
      try {
        const parsed = JSON.parse(template.value)
        return {
          subject: parsed.subject || defaultSubject,
          body: parsed.body || defaultBody,
          html: parsed.html || defaultHtml,
        }
      } catch {
        // If not JSON, treat as body only
        return {
          subject: defaultSubject,
          body: template.value,
          html: defaultHtml,
        }
      }
    }
  } catch (error) {
    console.error('Error fetching email template:', error)
  }
  
  return { subject: defaultSubject, body: defaultBody, html: defaultHtml }
}

/**
 * Replace template variables in email content
 */
function replaceTemplateVariables(content: string, variables: Record<string, string>): string {
  let result = content
  // Add current year
  result = result.replace(/{{currentYear}}/g, new Date().getFullYear().toString())
  // Replace all other variables
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  return result
}

/**
 * Get logo image URL from settings
 */
async function getLogoImage(): Promise<string | null> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const setting = await prisma.setting.findUnique({
      where: { key: 'logo_image' },
    })
    return setting?.value || null
  } catch (error) {
    console.error('Error fetching logo:', error)
    return null
  }
}

/**
 * Convert inline markdown **bold** and *italic* to HTML
 */
function inlineMarkdown(html: string): string {
  return html
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

/**
 * Convert plain text to HTML with formatting (headings, lists, links, bold, italic)
 */
function textToHtml(text: string): string {
  return text.split('\n').map((line: string) => {
    if (line.trim() === '') return '<br>'
    if (line.startsWith('# ')) return `<h1 style="color: #9333ea; font-size: 24px; margin: 20px 0 10px 0;">${inlineMarkdown(line.substring(2))}</h1>`
    if (line.startsWith('## ')) return `<h2 style="color: #9333ea; font-size: 20px; margin: 18px 0 8px 0;">${inlineMarkdown(line.substring(3))}</h2>`
    if (line.startsWith('### ')) return `<h3 style="color: #9333ea; font-size: 18px; margin: 16px 0 6px 0;">${inlineMarkdown(line.substring(4))}</h3>`
    if (line.startsWith('- ') || line.startsWith('* ')) return `<p style="margin: 8px 0; padding-left: 20px; position: relative;"><span style="position: absolute; left: 0;">•</span> ${inlineMarkdown(line.substring(2))}</p>`
    if (line.includes('http')) {
      const urlRegex = /(https?:\/\/[^\s]+)/g
      const withInline = inlineMarkdown(line)
      return `<p style="margin: 10px 0;">${withInline.replace(urlRegex, '<a href="$1" style="color: #9333ea; text-decoration: underline;">$1</a>')}</p>`
    }
    return `<p style="margin: 10px 0; line-height: 1.6;">${inlineMarkdown(line)}</p>`
  }).join('')
}

/**
 * Wrap email content in styled template with gradient background and logo
 */
async function wrapEmailTemplate(content: string, options?: { showLogo?: boolean }): Promise<string> {
  const logoUrl = options?.showLogo !== false ? await getLogoImage() : null
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonbeautyalchemy.com'
  
  return `
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
          <!-- Header with Logo -->
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
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <div style="color: #1f2937; font-size: 16px; line-height: 1.6;">
                ${content}
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © ${new Date().getFullYear()} Moon Beauty Alchemy. All rights reserved.
              </p>
              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">
                <a href="${siteUrl}" style="color: #9333ea; text-decoration: none;">Visit our website</a>
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
}

/**
 * Send order status update email to customer
 */
export async function sendOrderStatusUpdateEmail(data: {
  orderNumber: string
  customerName: string
  email: string
  status: string
  trackingNumber?: string
  shippingProvider?: string | null
  shippingMethod?: string
  items: Array<{ name: string; quantity: number; unitPrice?: number }>
  subtotalAmount?: number
  discountAmount?: number
  shippingAmount?: number
  taxAmount?: number
  totalAmount?: number
  paymentMethod?: string
  shippingAddress?: {
    address: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  billingAddress?: {
    address: string
    city: string
    state: string
    postalCode: string
    country: string
  } | null
  orderDate?: string
}) {
  try {
    const client = await getResendClient()
    if (!client) {
      console.warn('Resend client not available - skipping email send')
      return { success: false, error: 'Email service not configured' }
    }
    
    // Only send emails for PAID, SHIPPED, and CANCELED statuses
    if (data.status !== 'PAID' && data.status !== 'SHIPPED' && data.status !== 'CANCELED') {
      return { success: true, skipped: true }
    }
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://highrollerpeps.com'
    const adminEmail = await getAdminEmail()
    
    let emailContent = ''
    let subject = ''
    
    if (data.status === 'PAID') {
      // PAID email - styled like image 1
      const orderDateFormatted = data.orderDate 
        ? new Date(data.orderDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      
      const orderItemsHtml = data.items.map(item => {
        // Calculate item total price
        const itemTotal = item.quantity * (item.unitPrice || 0)
        return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">${item.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">$${itemTotal.toFixed(2)}</td>
        </tr>
      `
      }).join('')
      
      const shippingDisplay = (data.shippingAmount || 0) === 0 ? 'Free shipping' : `$${(data.shippingAmount || 0).toFixed(2)}`
      
      emailContent = `
        <div style="background: #9333ea; padding: 40px; text-align: center; margin: -20px -20px 30px -20px;">
          <h1 style="color: #ffffff; font-size: 36px; margin: 0; font-weight: bold;">Thanks for shopping with us</h1>
        </div>
        
        <p style="color: #374151; font-size: 16px; margin: 20px 0;">Hi ${data.customerName},</p>
        <p style="color: #374151; font-size: 16px; margin: 20px 0;">We have finished processing your order.</p>
        
        <p style="color: #9333ea; font-size: 18px; font-weight: bold; margin: 30px 0 20px 0;">[Order #${data.orderNumber}] (${orderDateFormatted})</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #ffffff; border: 1px solid #e5e7eb;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: bold;">Product</th>
              <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: bold;">Quantity</th>
              <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: bold;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${orderItemsHtml}
          </tbody>
        </table>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 0; color: #374151;">Subtotal:</td>
            <td style="padding: 8px 0; text-align: right; color: #374151; font-weight: bold;">$${(data.subtotalAmount || 0).toFixed(2)}</td>
          </tr>
          ${(data.discountAmount || 0) > 0 ? `
          <tr>
            <td style="padding: 8px 0; color: #374151;">Discount:</td>
            <td style="padding: 8px 0; text-align: right; color: #10b981; font-weight: bold;">-$${(data.discountAmount || 0).toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: #374151;">Shipping:</td>
            <td style="padding: 8px 0; text-align: right; color: #374151; font-weight: bold;">${shippingDisplay}</td>
          </tr>
          ${(data.taxAmount || 0) > 0 ? `
          <tr>
            <td style="padding: 8px 0; color: #374151;">Tax:</td>
            <td style="padding: 8px 0; text-align: right; color: #374151; font-weight: bold;">$${(data.taxAmount || 0).toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: #374151;">Payment method:</td>
            <td style="padding: 8px 0; text-align: right; color: #374151; font-weight: bold;">${data.paymentMethod || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-top: 2px solid #9333ea; color: #374151; font-size: 18px; font-weight: bold;">Total:</td>
            <td style="padding: 12px 0; border-top: 2px solid #9333ea; text-align: right; color: #374151; font-size: 18px; font-weight: bold;">$${(data.totalAmount || 0).toFixed(2)}</td>
          </tr>
        </table>
        
        ${data.shippingAddress && data.billingAddress ? `
        <div style="display: flex; gap: 20px; margin: 30px 0;">
          <div style="flex: 1;">
            <h3 style="color: #9333ea; margin: 0 0 10px 0; font-size: 18px;">Billing address</h3>
            <p style="margin: 5px 0; color: #374151;">${data.billingAddress.address}</p>
            <p style="margin: 5px 0; color: #374151;">${data.billingAddress.city}, ${data.billingAddress.state} ${data.billingAddress.postalCode}</p>
            <p style="margin: 5px 0; color: #374151;">${data.billingAddress.country}</p>
          </div>
          <div style="flex: 1;">
            <h3 style="color: #9333ea; margin: 0 0 10px 0; font-size: 18px;">Shipping address</h3>
            <p style="margin: 5px 0; color: #374151;">${data.shippingAddress.address}</p>
            <p style="margin: 5px 0; color: #374151;">${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}</p>
            <p style="margin: 5px 0; color: #374151;">${data.shippingAddress.country}</p>
          </div>
        </div>
        ` : ''}
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">Thanks for shopping with us.</p>
      `
      subject = `Order #${data.orderNumber} - Payment Confirmed`
      
    } else if (data.status === 'SHIPPED') {
      // SHIPPED email - styled like image 3
      const shippingDate = new Date().toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: '2-digit' 
      })
      
      emailContent = `
        <div style="background: #374151; padding: 30px; margin: -20px -20px 30px -20px;">
          <p style="color: #ffffff; font-size: 16px; margin: 0 0 10px 0;">Dear ${data.customerName},</p>
          <p style="color: #ffffff; font-size: 16px; margin: 0 0 20px 0;">We wanted to let you know that your package will ship on ${shippingDate} via ${data.shippingMethod || 'standard shipping'}.</p>
          <p style="color: #ffffff; font-size: 14px; margin: 0;">You can track your package at any time using the link below.</p>
          <p style="color: #ffffff; font-size: 14px; margin: 10px 0 0 0;">Please allow up to 24 hours for the tracking link to update.</p>
        </div>
        
        ${data.shippingAddress ? `
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px; font-weight: bold;">Shipped To:</p>
          <p style="margin: 5px 0; color: #374151;">${data.shippingAddress.address}</p>
          <p style="margin: 5px 0; color: #374151;">${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}</p>
        </div>
        ` : ''}
        
        ${data.trackingNumber ? `
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; font-weight: bold;">Track Your Shipment:</p>
          <p style="margin: 0;">
            <a href="${getTrackingLink(data.trackingNumber, data.shippingProvider)}" 
               style="color: #9333ea; font-size: 16px; font-weight: bold; text-decoration: none;">
              ${data.trackingNumber}
            </a>
          </p>
          ${data.shippingProvider ? `<p style="margin: 5px 0 0 0; color: #6b7280; font-size: 12px;">Shipping via ${data.shippingProvider}</p>` : ''}
        </div>
        ` : ''}
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">If you have any questions or concerns, don't hesitate to reply to this email.</p>
      `
      subject = `Order #${data.orderNumber} - Shipped!`
      
    } else if (data.status === 'CANCELED') {
      // CANCELED email - styled like other order emails
      const orderDateFormatted = data.orderDate 
        ? new Date(data.orderDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      
      const orderItemsHtml = data.items.map(item => {
        // Calculate item total price
        const itemTotal = item.quantity * (item.unitPrice || 0)
        return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">${item.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">$${itemTotal.toFixed(2)}</td>
        </tr>
      `
      }).join('')
      
      const shippingDisplay = (data.shippingAmount || 0) === 0 ? 'Free shipping' : `$${(data.shippingAmount || 0).toFixed(2)}`
      
      emailContent = `
        <div style="background: #dc2626; padding: 40px; text-align: center; margin: -20px -20px 30px -20px;">
          <h1 style="color: #ffffff; font-size: 36px; margin: 0; font-weight: bold;">Order Cancelled</h1>
        </div>
        
        <p style="color: #374151; font-size: 16px; margin: 20px 0;">Hi ${data.customerName},</p>
        <p style="color: #374151; font-size: 16px; margin: 20px 0;">We wanted to inform you that your order has been cancelled.</p>
        
        <p style="color: #9333ea; font-size: 18px; font-weight: bold; margin: 30px 0 20px 0;">[Order #${data.orderNumber}] (${orderDateFormatted})</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #ffffff; border: 1px solid #e5e7eb;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: bold;">Product</th>
              <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: bold;">Quantity</th>
              <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: bold;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${orderItemsHtml}
          </tbody>
        </table>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 0; color: #374151;">Subtotal:</td>
            <td style="padding: 8px 0; text-align: right; color: #374151; font-weight: bold;">$${(data.subtotalAmount || 0).toFixed(2)}</td>
          </tr>
          ${(data.discountAmount || 0) > 0 ? `
          <tr>
            <td style="padding: 8px 0; color: #374151;">Discount:</td>
            <td style="padding: 8px 0; text-align: right; color: #10b981; font-weight: bold;">-$${(data.discountAmount || 0).toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: #374151;">Shipping:</td>
            <td style="padding: 8px 0; text-align: right; color: #374151; font-weight: bold;">${shippingDisplay}</td>
          </tr>
          ${(data.taxAmount || 0) > 0 ? `
          <tr>
            <td style="padding: 8px 0; color: #374151;">Tax:</td>
            <td style="padding: 8px 0; text-align: right; color: #374151; font-weight: bold;">$${(data.taxAmount || 0).toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: #374151;">Payment method:</td>
            <td style="padding: 8px 0; text-align: right; color: #374151; font-weight: bold;">${data.paymentMethod || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-top: 2px solid #dc2626; color: #374151; font-size: 18px; font-weight: bold;">Total:</td>
            <td style="padding: 12px 0; border-top: 2px solid #dc2626; text-align: right; color: #374151; font-size: 18px; font-weight: bold;">$${(data.totalAmount || 0).toFixed(2)}</td>
          </tr>
        </table>
        
        ${data.shippingAddress && data.billingAddress ? `
        <div style="display: flex; gap: 20px; margin: 30px 0;">
          <div style="flex: 1;">
            <h3 style="color: #9333ea; margin: 0 0 10px 0; font-size: 18px;">Billing address</h3>
            <p style="margin: 5px 0; color: #374151;">${data.billingAddress.address}</p>
            <p style="margin: 5px 0; color: #374151;">${data.billingAddress.city}, ${data.billingAddress.state} ${data.billingAddress.postalCode}</p>
            <p style="margin: 5px 0; color: #374151;">${data.billingAddress.country}</p>
          </div>
          <div style="flex: 1;">
            <h3 style="color: #9333ea; margin: 0 0 10px 0; font-size: 18px;">Shipping address</h3>
            <p style="margin: 5px 0; color: #374151;">${data.shippingAddress.address}</p>
            <p style="margin: 5px 0; color: #374151;">${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}</p>
            <p style="margin: 5px 0; color: #374151;">${data.shippingAddress.country}</p>
          </div>
        </div>
        ` : ''}
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">If you have any questions about this cancellation, please don't hesitate to contact us at ${adminEmail}.</p>
      `
      subject = `Order #${data.orderNumber} - Cancelled`
    }
    
    const finalHtml = await wrapEmailTemplate(emailContent, { showLogo: true })

    const { data: emailData, error } = await client.emails.send({
      from: await getFromEmail(),
      to: data.email,
      subject: subject,
      html: finalHtml,
    })

    if (error) {
      console.error('Error sending order status update email:', error)
      return { success: false, error }
    }

    return { success: true, data: emailData }
  } catch (error) {
    console.error('Error sending order status update email:', error)
    return { success: false, error }
  }
}

/**
 * Send order notification email to admin
 */
export async function sendAdminOrderNotification(data: {
  orderNumber: string
  customerName: string
  email: string
  phone: string
  totalAmount: number
  subtotalAmount: number
  discountAmount?: number
  taxAmount: number
  shippingAmount: number
  shippingMethod: string
  paymentMethod: string
  orderNotes: string
  items: Array<{ name: string; quantity: number; unitPrice: number }>
  shippingAddress: {
    address: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  billingAddress: {
    address: string
    city: string
    state: string
    postalCode: string
    country: string
  } | null
}) {
  try {
    const client = await getResendClient()
    if (!client) {
      console.warn('Resend client not available - skipping email send')
      return { success: false, error: 'Email service not configured' }
    }
    
    const adminEmail = await getAdminEmail()
    
    const billingAddressHtml = data.billingAddress
      ? `
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 10px 0;">
          <h4 style="margin-top: 0;">Billing Address:</h4>
          <p style="margin: 5px 0;">${data.billingAddress.address}</p>
          <p style="margin: 5px 0;">${data.billingAddress.city}, ${data.billingAddress.state} ${data.billingAddress.postalCode}</p>
          <p style="margin: 5px 0;">${data.billingAddress.country}</p>
        </div>
      `
      : '<p><em>Same as shipping address</em></p>'
    
    const { data: emailData, error } = await client.emails.send({
      from: await getFromEmail(),
      to: adminEmail,
      subject: `New Order #${data.orderNumber} - ${data.customerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #9333ea;">New Order Received</h2>
          <p>A new order has been placed and requires your attention.</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order #${data.orderNumber}</h3>
            
            <div style="margin-bottom: 15px;">
              <h4 style="margin-bottom: 5px;">Customer Information:</h4>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${data.customerName}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${data.phone}</p>
            </div>

            <div style="margin-bottom: 15px;">
              <h4 style="margin-bottom: 5px;">Shipping Address:</h4>
              <p style="margin: 5px 0;">${data.shippingAddress.address}</p>
              <p style="margin: 5px 0;">${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}</p>
              <p style="margin: 5px 0;">${data.shippingAddress.country}</p>
            </div>

            <div style="margin-bottom: 15px;">
              <h4 style="margin-bottom: 5px;">Billing Address:</h4>
              ${billingAddressHtml}
            </div>

            <div style="margin-bottom: 15px;">
              <h4 style="margin-bottom: 5px;">Order Items:</h4>
              <table style="width: 100%; border-collapse: collapse;">
                ${data.items.map(item => `
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      ${item.name} x ${item.quantity}
                    </td>
                    <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      $${(item.unitPrice * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                `).join('')}
              </table>
            </div>

            <div style="margin-bottom: 15px;">
              <h4 style="margin-bottom: 5px;">Order Summary:</h4>
              <p style="margin: 5px 0;"><strong>Subtotal:</strong> $${data.subtotalAmount.toFixed(2)}</p>
              ${(data.discountAmount ?? 0) > 0 ? `<p style="margin: 5px 0;"><strong>Discount:</strong> -$${(data.discountAmount ?? 0).toFixed(2)}</p>` : ''}
              <p style="margin: 5px 0;"><strong>Tax:</strong> $${data.taxAmount.toFixed(2)}</p>
              <p style="margin: 5px 0;"><strong>Shipping (${data.shippingMethod}):</strong> $${data.shippingAmount.toFixed(2)}</p>
              <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #9333ea; border-top: 2px solid #9333ea; padding-top: 10px;">
                <strong>Total:</strong> $${data.totalAmount.toFixed(2)}
              </p>
            </div>

            <div style="margin-bottom: 15px;">
              <h4 style="margin-bottom: 5px;">Payment Method:</h4>
              <p style="margin: 5px 0; font-weight: bold; color: #9333ea;">${data.paymentMethod}</p>
            </div>

            ${data.orderNotes && data.orderNotes !== 'None' ? `
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4 style="margin-top: 0;">Order Notes:</h4>
                <p style="margin: 0; white-space: pre-wrap;">${data.orderNotes}</p>
              </div>
            ` : ''}
          </div>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            View and manage this order in the admin panel.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Error sending admin order notification email:', error)
      return { success: false, error }
    }

    return { success: true, data: emailData }
  } catch (error) {
    console.error('Error sending admin order notification email:', error)
    return { success: false, error }
  }
}

/**
 * Send abandoned cart follow-up email with discount code
 */
export async function sendAbandonedCartEmail(data: {
  email: string
  customerName: string
  cartItems: Array<{ name: string; quantity: number; price: number }>
  discountCode: string
  discountPercent: number
}) {
  try {
    const client = await getResendClient()
    if (!client) {
      console.warn('Resend client not available - skipping email send')
      return { success: false, error: 'Email service not configured' }
    }
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://highrollerpeps.com'
    const adminEmail = await getAdminEmail()
    
    // Get template
    const template = await getEmailTemplate(
      'email_template_abandoned_cart',
      'Complete Your Purchase - Special Discount Inside!',
      `Hi {{customerName}},

We noticed you left some items in your cart. Don't miss out!

Your Cart:
{{cartItems}}

Use code {{discountCode}} for {{discountPercent}}% off your order!

Shop now: ${siteUrl}/store

This discount code expires in 7 days.

If you have any questions, please contact us at ${adminEmail}`
    )
    
    // Prepare variables
    const cartItemsList = data.cartItems.map(item => 
      `- ${item.name} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n')
    
    const subtotal = data.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    
    const variables = {
      customerName: data.customerName,
      email: data.email,
      cartItems: cartItemsList,
      discountCode: data.discountCode,
      discountPercent: data.discountPercent.toString(),
      subtotal: subtotal.toFixed(2),
      siteUrl: siteUrl,
      adminEmail: adminEmail,
    }
    
    // Replace variables
    const subject = replaceTemplateVariables(template.subject, variables)
    const bodyText = replaceTemplateVariables(template.body, variables)
    
    // Convert to HTML
    let bodyHtml = textToHtml(bodyText)
    
    // Add discount code highlight box
    bodyHtml = bodyHtml.replace(
      new RegExp(`Use code ${data.discountCode}`, 'g'),
      `<div style="background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; color: white;">
        <p style="margin: 0; font-size: 14px; font-weight: bold;">Use code</p>
        <p style="margin: 10px 0; font-size: 32px; font-weight: bold; letter-spacing: 4px;">${data.discountCode}</p>
        <p style="margin: 0; font-size: 18px;">for ${data.discountPercent}% off your order!</p>
      </div>`
    )
    
    // Wrap in email template
    const finalHtml = await wrapEmailTemplate(bodyHtml, { showLogo: true })

    const { data: emailData, error } = await client.emails.send({
      from: await getFromEmail(),
      to: data.email,
      subject: subject,
      html: finalHtml,
    })

    if (error) {
      console.error('Error sending abandoned cart email:', error)
      return { success: false, error }
    }

    return { success: true, data: emailData }
  } catch (error) {
    console.error('Error sending abandoned cart email:', error)
    return { success: false, error }
  }
}

/**
 * Send payment reminder email for unpaid orders
 */
export async function sendPaymentReminderEmail(data: {
  orderNumber: string
  customerName: string
  email: string
  totalAmount: number
  paymentMethod: string
  orderDate: string
  hoursRemaining: number
}) {
  try {
    const client = await getResendClient()
    if (!client) {
      console.warn('Resend client not available - skipping email send')
      return { success: false, error: 'Email service not configured' }
    }
    
    const paymentSettings = await getPaymentSettings()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://highrollerpeps.com'
    const adminEmail = await getAdminEmail()
    
    // Format order date
    const orderDateFormatted = new Date(data.orderDate).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
    
    // Build payment instructions based on payment method
    let paymentInstructionsHtml = ''
    let paymentMethodDisplay = data.paymentMethod
    
    if (data.paymentMethod === 'ZELLE') {
      paymentMethodDisplay = 'Zelle'
      paymentInstructionsHtml = `
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">⚠️ IMPORTANT</p>
          <p style="margin: 0 0 15px 0; font-weight: bold; color: #78350f;">How to Pay</p>
          <p style="margin: 0 0 5px 0; color: #78350f;"><strong>Zelle:</strong> ${paymentSettings.zelle || 'Contact us for Zelle information'}</p>
          <p style="margin: 10px 0 5px 0; color: #78350f;"><strong>Memo Requirements:</strong> Please include your FIRST & LAST NAME and your ORDER NUMBER only in the Zelle memo.</p>
          <p style="margin: 10px 0 0 0; color: #dc2626; font-weight: bold;">⚠️ Do not include any product names in your payment memo.</p>
        </div>
      `
    } else if (data.paymentMethod === 'BITCOIN') {
      paymentMethodDisplay = 'Bitcoin'
      paymentInstructionsHtml = `
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">⚠️ IMPORTANT</p>
          <p style="margin: 0 0 15px 0; font-weight: bold; color: #78350f;">How to Pay</p>
          <p style="margin: 0 0 5px 0; color: #78350f;"><strong>Bitcoin Address:</strong></p>
          <p style="margin: 0 0 15px 0; color: #78350f; font-family: monospace; word-break: break-all; background: #fff; padding: 10px; border-radius: 4px;">${paymentSettings.bitcoin || 'Contact us for Bitcoin address'}</p>
          ${paymentSettings.bitcoinQr ? `<img src="${paymentSettings.bitcoinQr}" alt="Bitcoin QR Code" style="max-width: 200px; margin: 10px 0;" />` : ''}
          <p style="margin: 10px 0 5px 0; color: #78350f;"><strong>Amount:</strong> Send exactly $${data.totalAmount.toFixed(2)} worth of Bitcoin</p>
          <p style="margin: 10px 0 0 0; color: #dc2626; font-weight: bold;">⚠️ Do not include any product names in transaction notes.</p>
        </div>
        <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e40af;">📧 Payment Confirmation Required</p>
          <p style="margin: 0 0 10px 0; color: #1e3a8a;">After sending your Bitcoin payment, please email your payment confirmation (transaction ID/hash) to:</p>
          <p style="margin: 10px 0; color: #1e3a8a; font-weight: bold; font-size: 16px;">${adminEmail}</p>
          <p style="margin: 10px 0 0 0; color: #1e3a8a;">Include your order number <strong>#${data.orderNumber}</strong> in the email subject line.</p>
        </div>
      `
    } else if (data.paymentMethod === 'CASHAPP') {
      paymentMethodDisplay = 'Cash App'
      paymentInstructionsHtml = `
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">⚠️ IMPORTANT</p>
          <p style="margin: 0 0 15px 0; font-weight: bold; color: #78350f;">How to Pay</p>
          <p style="margin: 0 0 5px 0; color: #78350f;"><strong>Cash App:</strong> ${paymentSettings.cashapp || 'Contact us for Cash App tag'}</p>
          <p style="margin: 10px 0 5px 0; color: #78350f;"><strong>Memo Requirements:</strong> Please include your FIRST & LAST NAME and your ORDER NUMBER only in the Cash App memo.</p>
          <p style="margin: 10px 0 0 0; color: #dc2626; font-weight: bold;">⚠️ Do not include any product names in your payment memo.</p>
        </div>
      `
    }
    
    const emailContent = `
      <div style="background: #dc2626; padding: 30px; text-align: center; margin: -20px -20px 30px -20px;">
        <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: bold;">Payment Reminder</h1>
      </div>
      
      <p style="color: #374151; font-size: 16px; margin: 20px 0;">Hi ${data.customerName},</p>
      <p style="color: #374151; font-size: 16px; margin: 20px 0;">We have not yet received payment for your order <strong>#${data.orderNumber}</strong> placed on ${orderDateFormatted}.</p>
      
      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #991b1b; font-size: 18px;">⏰ Important Notice</p>
        <p style="margin: 0 0 10px 0; color: #7f1d1d; font-size: 16px;">Orders not paid within <strong>72 hours</strong> of placement will be automatically cancelled.</p>
        <p style="margin: 0; color: #7f1d1d; font-size: 16px;">You have approximately <strong>${Math.round(data.hoursRemaining)} hours</strong> remaining to complete your payment.</p>
      </div>
      
      <h2 style="color: #374151; font-size: 24px; margin: 30px 0 10px 0;">Order #${data.orderNumber}</h2>
      <p style="color: #374151; font-size: 16px; margin: 10px 0;"><strong>Total Amount:</strong> <span style="color: #9333ea; font-size: 20px; font-weight: bold;">$${data.totalAmount.toFixed(2)}</span></p>
      <p style="color: #374151; font-size: 16px; margin: 10px 0;"><strong>Payment Method:</strong> ${paymentMethodDisplay}</p>
      
      ${paymentInstructionsHtml}
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
        If you have already sent payment, please disregard this email. If you have any questions, please contact us at ${adminEmail}.
      </p>
    `
    
    const finalHtml = await wrapEmailTemplate(emailContent, { showLogo: true })

    const { data: emailData, error } = await client.emails.send({
      from: await getFromEmail(),
      to: data.email,
      subject: `Payment Reminder - Order #${data.orderNumber}`,
      html: finalHtml,
    })

    if (error) {
      console.error('Error sending payment reminder email:', error)
      return { success: false, error }
    }

    return { success: true, data: emailData }
  } catch (error) {
    console.error('Error sending payment reminder email:', error)
    return { success: false, error }
  }
}
