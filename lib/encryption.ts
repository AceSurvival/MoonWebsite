import crypto from 'crypto'

// Encryption key should be stored in environment variable
// For production, use a strong 32-byte key (256 bits)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')

// Warn if using a random key (not set in environment)
if (!process.env.ENCRYPTION_KEY) {
  console.warn('⚠️  WARNING: ENCRYPTION_KEY not set in environment variables. Using random key (data encrypted with this key cannot be decrypted after restart).')
} else {
  // Validate key length (should be 64 hex characters = 32 bytes)
  if (ENCRYPTION_KEY.length !== 64) {
    console.error('❌ ERROR: ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). Current length:', ENCRYPTION_KEY.length)
  } else {
    console.log('✅ ENCRYPTION_KEY loaded successfully')
  }
}

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 16 bytes for AES
const SALT_LENGTH = 64 // 64 bytes for salt
const TAG_LENGTH = 16 // 16 bytes for GCM tag

/**
 * Derive a key from the master key using PBKDF2
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha512')
}

/**
 * Encrypt sensitive customer data
 */
export function encryptData(data: string): string {
  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)
    
    // Derive key from master key and salt
    const key = deriveKey(salt)
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    // Encrypt data
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Get authentication tag
    const tag = cipher.getAuthTag()
    
    // Combine salt + iv + tag + encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex')
    ])
    
    // Return as base64 for easy storage
    return combined.toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt sensitive customer data
 */
export function decryptData(encryptedData: string): string {
  try {
    // Check if data looks encrypted (base64 string longer than typical unencrypted data)
    // If it's not base64 or too short, might not be encrypted (backward compatibility)
    if (!encryptedData || encryptedData.length < 100) {
      // Might be unencrypted data, return as-is
      return encryptedData
    }

    // Decode from base64
    const combined = Buffer.from(encryptedData, 'base64')
    
    // Check if buffer is large enough to contain salt + iv + tag
    if (combined.length < SALT_LENGTH + IV_LENGTH + TAG_LENGTH) {
      // Data might not be encrypted, return as-is
      return encryptedData
    }
    
    // Extract components
    const salt = combined.slice(0, SALT_LENGTH)
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    
    // Derive key from master key and salt
    const key = deriveKey(salt)
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    // Decrypt data
    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error: any) {
    // Log detailed error for debugging
    console.error('Decryption error:', {
      message: error.message,
      encryptedDataLength: encryptedData?.length,
      encryptionKeySet: !!process.env.ENCRYPTION_KEY,
      encryptionKeyLength: ENCRYPTION_KEY.length,
    })
    
    // If decryption fails, the data might not be encrypted (backward compatibility)
    // Return original data instead of throwing
    console.warn('⚠️  Decryption failed - data may not be encrypted or wrong key used. Returning original data.')
    return encryptedData
  }
}

/**
 * Encrypt an object's sensitive fields
 */
export function encryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const encrypted = { ...obj }
  
  for (const field of fieldsToEncrypt) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encryptData(encrypted[field]) as T[keyof T]
    }
  }
  
  return encrypted
}

/**
 * Decrypt an object's sensitive fields
 */
export function decryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToDecrypt: (keyof T)[]
): T {
  const decrypted = { ...obj }
  
  for (const field of fieldsToDecrypt) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        decrypted[field] = decryptData(decrypted[field] as string) as T[keyof T]
      } catch (error) {
        // If decryption fails, the field might not be encrypted (backward compatibility)
        console.warn(`Failed to decrypt field ${String(field)}:`, error)
      }
    }
  }
  
  return decrypted
}

// Export aliases for convenience
export const encrypt = encryptData
export const decrypt = decryptData

/**
 * Hash sensitive data (one-way, for searching/indexing)
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex')
}
