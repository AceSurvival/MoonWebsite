import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    
    const templates = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'email_template_initial_order',
            'email_template_payment_confirmed',
            'email_template_order_shipped',
            'email_template_order_cancelled',
            'email_template_abandoned_cart',
            'email_template_admin_notification',
          ],
        },
      },
    })

    const templatesMap: Record<string, { subject: string; body: string; html?: string }> = {}
    
    templates.forEach((template) => {
      try {
        const parsed = JSON.parse(template.value)
        templatesMap[template.key] = {
          subject: parsed.subject || '',
          body: parsed.body || '',
          html: parsed.html || '',
        }
      } catch {
        // If not JSON, treat as body only
        templatesMap[template.key] = {
          subject: '',
          body: template.value,
          html: '',
        }
      }
    })

    return NextResponse.json({
      initialOrder: templatesMap['email_template_initial_order'] || { subject: '', body: '', html: '' },
      paymentConfirmed: templatesMap['email_template_payment_confirmed'] || { subject: '', body: '', html: '' },
      orderShipped: templatesMap['email_template_order_shipped'] || { subject: '', body: '', html: '' },
      orderCancelled: templatesMap['email_template_order_cancelled'] || { subject: '', body: '', html: '' },
      abandonedCart: templatesMap['email_template_abandoned_cart'] || { subject: '', body: '', html: '' },
      adminNotification: templatesMap['email_template_admin_notification'] || { subject: '', body: '', html: '' },
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching email templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth(request)
    const body = await request.json()

    const templatesToUpdate = [
      {
        key: 'email_template_initial_order',
        value: JSON.stringify({
          subject: body.initialOrder?.subject || '',
          body: body.initialOrder?.body || '',
          html: body.initialOrder?.html || '',
        }),
      },
      {
        key: 'email_template_payment_confirmed',
        value: JSON.stringify({
          subject: body.paymentConfirmed?.subject || '',
          body: body.paymentConfirmed?.body || '',
          html: body.paymentConfirmed?.html || '',
        }),
      },
      {
        key: 'email_template_order_shipped',
        value: JSON.stringify({
          subject: body.orderShipped?.subject || '',
          body: body.orderShipped?.body || '',
          html: body.orderShipped?.html || '',
        }),
      },
      {
        key: 'email_template_order_cancelled',
        value: JSON.stringify({
          subject: body.orderCancelled?.subject || '',
          body: body.orderCancelled?.body || '',
          html: body.orderCancelled?.html || '',
        }),
      },
      {
        key: 'email_template_abandoned_cart',
        value: JSON.stringify({
          subject: body.abandonedCart?.subject || '',
          body: body.abandonedCart?.body || '',
          html: body.abandonedCart?.html || '',
        }),
      },
      {
        key: 'email_template_admin_notification',
        value: JSON.stringify({
          subject: body.adminNotification?.subject || '',
          body: body.adminNotification?.body || '',
          html: body.adminNotification?.html || '',
        }),
      },
    ]

    for (const template of templatesToUpdate) {
      await prisma.setting.upsert({
        where: { key: template.key },
        update: { value: template.value },
        create: { key: template.key, value: template.value },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error updating email templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
