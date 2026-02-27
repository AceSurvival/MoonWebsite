# Encryption Setup Guide

This guide explains how to set up encryption for customer data (emails, phone numbers, addresses) in your Moon Beauty Alchemy store.

## Why Encryption?

Customer data like emails, phone numbers, and addresses are encrypted before being stored in the database. This protects sensitive customer information even if your database is compromised.

## Setup Steps

### 1. Generate an Encryption Key

The encryption key must be a 32-byte (256-bit) hexadecimal string. Here's a pre-generated secure key you can use:

```
e5ab029dd32ff0dde8d6c2f40d6f6a9334e945a8f0caa46bec7aa54b816ca896
```

**Or generate your own:**

**On Windows (PowerShell):**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**On Mac/Linux:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Add to Local Development (.env file)

Create a `.env` file in your project root (if it doesn't exist) and add:

```env
ENCRYPTION_KEY=e5ab029dd32ff0dde8d6c2f40d6f6a9334e945a8f0caa46bec7aa54b816ca896
```

**Important:** Replace the key above with your own generated key, or use the one provided.

### 3. Add to Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Set:
   - **Key:** `ENCRYPTION_KEY`
   - **Value:** Your encryption key (the 64-character hex string)
   - **Environment:** Select all (Production, Preview, Development)
5. Click **Save**

### 4. Add to Production (Other Hosting)

For other hosting providers (HostGator, etc.), add the environment variable through their control panel or hosting settings.

## How It Works

- **Encryption:** When a customer places an order, their email, phone, and address are encrypted using AES-256-GCM encryption before being stored in the database.

- **Decryption:** When viewing orders in the admin panel or order confirmation pages, the data is automatically decrypted for display.

- **Security:** Each encryption uses a unique salt and initialization vector (IV), making it extremely secure.

## Important Notes

⚠️ **CRITICAL:** 
- **Never commit your `.env` file to Git** - it's already in `.gitignore`
- **Never share your encryption key publicly**
- **Keep your encryption key secure** - if you lose it, you cannot decrypt existing data
- **Use the same key** across all environments (dev, staging, production) if you need to migrate data

## Verification

After setting up the encryption key:

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Place a test order through the checkout process

3. Check the database - customer email and addresses should be encrypted (long base64 strings)

4. View the order in the admin panel - data should display correctly (automatically decrypted)

## Troubleshooting

**Issue: "Failed to decrypt data" error**
- Make sure `ENCRYPTION_KEY` is set correctly in your environment variables
- Ensure the key is exactly 64 characters (32 bytes in hex)
- Restart your server after adding the environment variable

**Issue: Data appears encrypted in admin panel**
- Check that `ENCRYPTION_KEY` is set in your environment
- Verify the key matches the one used to encrypt the data
- Check server logs for decryption errors

**Issue: Different keys in different environments**
- If you have different keys in dev vs production, data encrypted in one environment cannot be decrypted in another
- Use the same key across all environments, or migrate data when switching keys

## Current Implementation

The encryption is automatically used in:
- `/app/api/checkout/route.ts` - Encrypts customer data when orders are created
- `/app/api/orders/[orderNumber]/route.ts` - Decrypts data for order confirmation
- `/app/api/admin/orders/route.ts` - Decrypts data for admin order list
- `/app/api/admin/orders/[id]/route.ts` - Decrypts data for admin order details

No code changes needed - just set the environment variable!
