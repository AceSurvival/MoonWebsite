import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this route requires authentication and database access
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'contact_email',
            'from_email',
            'zelle_instructions',
            'bitcoin_address',
            'bitcoin_qr',
            'cashapp_tag',
            'tax_rate',
            'shipping_amount',
            'free_shipping_threshold',
            'shipping_type',
            'shipping_origin_zip',
            'shipping_usps_ups_standard',
            'shipping_ups_2day',
            'shipping_fedex_2day',
            'motd',
            'promo_banner',
            'logo_image',
            'hero_background_image',
            'global_sale_percent',
            'global_sale_active',
          ],
        },
      },
    })

    const settingsMap: Record<string, string> = {}
    settings.forEach((s) => {
      settingsMap[s.key] = s.value
    })

    return NextResponse.json({
      contactEmail: settingsMap['contact_email'] || '',
      fromEmail: settingsMap['from_email'] || '',
      zelleInstructions: settingsMap['zelle_instructions'] || '',
      bitcoinAddress: settingsMap['bitcoin_address'] || '',
      bitcoinQr: settingsMap['bitcoin_qr'] || '',
      cashappTag: settingsMap['cashapp_tag'] || '',
      taxRate: settingsMap['tax_rate'] || '0',
      shippingAmount: settingsMap['shipping_amount'] || '0',
      freeShippingThreshold: settingsMap['free_shipping_threshold'] || '0',
      shippingType: settingsMap['shipping_type'] || 'flat',
      shippingOriginZip: settingsMap['shipping_origin_zip'] || '94544',
      shippingUspsUpsStandard: settingsMap['shipping_usps_ups_standard'] || '15',
      shippingUps2Day: settingsMap['shipping_ups_2day'] || '25',
      shippingFedex2Day: settingsMap['shipping_fedex_2day'] || '30',
      motd: settingsMap['motd'] || '',
      promoBanner: settingsMap['promo_banner'] || '',
      logoImage: settingsMap['logo_image'] || '',
      heroBackgroundImage: settingsMap['hero_background_image'] || '',
      globalSalePercent: settingsMap['global_sale_percent'] || '0',
      globalSaleActive: settingsMap['global_sale_active'] === 'true',
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth(request)
    const body = await request.json()

    // Update or create each setting
    const settingsToUpdate = [
      { key: 'contact_email', value: body.contactEmail || '' },
      { key: 'from_email', value: body.fromEmail || '' },
      { key: 'zelle_instructions', value: body.zelleInstructions || '' },
      { key: 'bitcoin_address', value: body.bitcoinAddress || '' },
      { key: 'bitcoin_qr', value: body.bitcoinQr || '' },
      { key: 'cashapp_tag', value: body.cashappTag || '' },
      { key: 'tax_rate', value: body.taxRate || '0' },
      { key: 'shipping_amount', value: body.shippingAmount || '0' },
      { key: 'free_shipping_threshold', value: body.freeShippingThreshold || '0' },
      { key: 'shipping_type', value: body.shippingType || 'flat' },
      { key: 'shipping_origin_zip', value: body.shippingOriginZip || '94544' },
      { key: 'shipping_usps_ups_standard', value: body.shippingUspsUpsStandard || '15' },
      { key: 'shipping_ups_2day', value: body.shippingUps2Day || '25' },
      { key: 'shipping_fedex_2day', value: body.shippingFedex2Day || '30' },
      { key: 'motd', value: body.motd || '' },
      { key: 'promo_banner', value: body.promoBanner || '' },
      { key: 'logo_image', value: body.logoImage || '' },
      { key: 'hero_background_image', value: body.heroBackgroundImage || '' },
      { key: 'global_sale_percent', value: body.globalSalePercent || '0' },
      { key: 'global_sale_active', value: body.globalSaleActive ? 'true' : 'false' },
    ]

    for (const setting of settingsToUpdate) {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


