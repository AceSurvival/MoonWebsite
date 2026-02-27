import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { put } from '@vercel/blob'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Trigger redeploy

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)
    
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) || 'general' // 'logo', 'product', 'variant', 'general'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size too large. Maximum size is 10MB.' }, { status: 400 })
    }

    try {
      // Check if BLOB_READ_WRITE_TOKEN is set
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error('BLOB_READ_WRITE_TOKEN is not set in environment variables')
        return NextResponse.json({ 
          error: 'Blob storage is not configured. Please set BLOB_READ_WRITE_TOKEN in your Vercel environment variables.',
          details: 'Go to Vercel Dashboard → Your Project → Settings → Environment Variables → Add BLOB_READ_WRITE_TOKEN'
        }, { status: 500 })
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop() || 'jpg'
      const filename = `${type}-${timestamp}-${randomString}.${fileExtension}`
      const blobPath = `uploads/${type}/${filename}`

      // Upload to Vercel Blob Storage
      const blob = await put(blobPath, file, {
        access: 'public',
        contentType: file.type,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })

      return NextResponse.json({ 
        success: true,
        url: blob.url,
        filename: filename
      })
    } catch (blobError: any) {
      console.error('Blob storage error:', blobError)
      console.error('Error details:', {
        message: blobError.message,
        name: blobError.name,
        code: blobError.code,
        status: blobError.status,
      })
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to upload file to storage.'
      let errorDetails = blobError.message || 'Unknown error'
      
      if (blobError.message?.includes('token') || blobError.message?.includes('unauthorized')) {
        errorMessage = 'Blob storage authentication failed.'
        errorDetails = 'Please check that BLOB_READ_WRITE_TOKEN is correctly set in Vercel environment variables.'
      } else if (blobError.message?.includes('size') || blobError.message?.includes('limit')) {
        errorMessage = 'File size exceeds limits.'
        errorDetails = blobError.message
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: errorDetails,
        fullError: process.env.NODE_ENV === 'development' ? blobError.message : undefined
      }, { status: 500 })
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error uploading file:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
