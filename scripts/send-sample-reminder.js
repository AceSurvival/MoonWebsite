/**
 * Script to send sample payment reminder email
 * This directly imports and calls the email function
 */

// Since we're in a Node.js script, we need to handle the ES module imports
// We'll use dynamic import for the email function

async function sendSample() {
  try {
    // Import the email function dynamically
    const { sendPaymentReminderEmail } = await import('../lib/email.ts')
    
    console.log('Sending sample payment reminder email to ace.mc.owner@gmail.com...')
    
    const result = await sendPaymentReminderEmail({
      orderNumber: 'ORD-12345',
      customerName: 'Sample Customer',
      email: 'ace.mc.owner@gmail.com',
      totalAmount: 149.99,
      paymentMethod: 'ZELLE',
      orderDate: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      hoursRemaining: 54,
    })
    
    if (result.success) {
      console.log('✅ Sample email sent successfully!')
      console.log('Email ID:', result.data?.id)
    } else {
      console.error('❌ Failed to send email:', result.error)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error sending sample email:', error)
    process.exit(1)
  }
}

sendSample()
