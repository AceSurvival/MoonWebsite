# Encryption Troubleshooting Guide

If you're seeing encrypted data (long base64 strings) instead of readable emails/addresses in the admin panel, follow these steps:

## Step 1: Verify Encryption Key is Set

### For Local Development:
1. Check your `.env` file contains:
   ```
   ENCRYPTION_KEY=e5ab029dd32ff0dde8d6c2f40d6f6a9334e945a8f0caa46bec7aa54b816ca896
   ```
2. **Restart your development server** after adding/changing the key:
   ```bash
   # Stop the server (Ctrl+C) and restart:
   npm run dev
   ```

### For Production (Vercel):
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `ENCRYPTION_KEY` exists and has the correct value
3. **Redeploy your site** after adding/changing environment variables:
   - Go to Deployments tab
   - Click "..." on latest deployment → "Redeploy"

## Step 2: Test Encryption Configuration

Visit this URL in your browser (while logged into admin):
```
https://your-site.com/api/admin/test-encryption
```

Or for local development:
```
http://localhost:3000/api/admin/test-encryption
```

This will show you:
- ✅ If encryption key is set
- ✅ If encryption/decryption is working
- ⚠️ Any configuration issues

## Step 3: Common Issues

### Issue: "Data still encrypted after adding key"

**Cause:** Data was encrypted with a different key (the random one generated before you set ENCRYPTION_KEY)

**Solution:** 
- **Option A:** If you have no important orders yet, you can delete encrypted orders and new ones will use the correct key
- **Option B:** If you need to keep existing orders, you'll need to decrypt them with the old key and re-encrypt with the new key (requires database access)

### Issue: "Server shows encryption key not set"

**Causes:**
1. Server wasn't restarted after adding `.env` file
2. `.env` file is in wrong location (should be in project root)
3. Environment variable name is wrong (should be exactly `ENCRYPTION_KEY`)

**Solutions:**
1. **Restart your development server** completely
2. Verify `.env` file is in the same directory as `package.json`
3. Check for typos: `ENCRYPTION_KEY` (not `ENCRYPTIONKEY` or `ENCRYPTION_KEY_`)

### Issue: "Vercel shows encrypted data"

**Causes:**
1. Environment variable not added to Vercel
2. Site not redeployed after adding variable
3. Wrong environment selected (only added to Production, not Preview/Development)

**Solutions:**
1. Go to Vercel → Settings → Environment Variables
2. Verify `ENCRYPTION_KEY` exists
3. Make sure it's added to **all environments** (Production, Preview, Development)
4. **Redeploy** your site (Deployments → Redeploy)

## Step 4: Check Server Logs

When you start your server, you should see one of these messages:

**✅ Good:**
```
✅ ENCRYPTION_KEY loaded successfully
```

**⚠️ Warning:**
```
⚠️  WARNING: ENCRYPTION_KEY not set in environment variables. Using random key...
```

**❌ Error:**
```
❌ ERROR: ENCRYPTION_KEY must be exactly 64 hex characters...
```

## Step 5: Verify Decryption is Working

After restarting your server:

1. Go to Admin Panel → Orders
2. Check if emails look like `customer@example.com` (✅ correct)
3. Or if they look like `aBc123XyZ...` long base64 strings (❌ still encrypted)

## Quick Fix Checklist

- [ ] Added `ENCRYPTION_KEY` to `.env` file (local)
- [ ] Added `ENCRYPTION_KEY` to Vercel Environment Variables (production)
- [ ] Restarted development server (local)
- [ ] Redeployed site on Vercel (production)
- [ ] Verified key is 64 characters long
- [ ] Checked server logs for encryption key status
- [ ] Tested with `/api/admin/test-encryption` endpoint

## Still Not Working?

If you're still seeing encrypted data:

1. **Check the test endpoint:** Visit `/api/admin/test-encryption` to see diagnostic info
2. **Check server console:** Look for encryption-related warnings/errors
3. **Verify environment:** Make sure you're checking the right environment (local vs production)
4. **Check order dates:** Orders created BEFORE you set the key will still be encrypted (they used a random key)

## Important Notes

- **New orders** placed AFTER setting the correct key will decrypt properly
- **Old orders** encrypted with a different key cannot be decrypted without that key
- The encryption key must be **exactly the same** across all environments if you need to migrate data
- Never commit your `.env` file to Git (it's already in `.gitignore`)
