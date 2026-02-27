import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { encryptData, decryptData } from '@/lib/encryption'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    
    // Test encryption/decryption
    const testData = 'test@example.com'
    const encrypted = encryptData(testData)
    const decrypted = decryptData(encrypted)
    
    const encryptionKeySet = !!process.env.ENCRYPTION_KEY
    const encryptionKeyLength = process.env.ENCRYPTION_KEY?.length || 0
    
    return NextResponse.json({
      encryptionKeySet,
      encryptionKeyLength,
      testEncryption: {
        original: testData,
        encrypted: encrypted.substring(0, 50) + '...',
        decrypted,
        success: decrypted === testData,
      },
      message: encryptionKeySet 
        ? (encryptionKeyLength === 64 
          ? '✅ Encryption key is properly configured' 
          : `⚠️ Encryption key length is ${encryptionKeyLength}, should be 64`)
        : '❌ ENCRYPTION_KEY not set in environment variables',
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
