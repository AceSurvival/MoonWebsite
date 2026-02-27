# Fix "Provisioning integrations failed" Error on Vercel

## Quick Fix Steps

### Step 1: Check Vercel Integrations

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project
3. Click on **Settings** → **Integrations**
4. Check if **Vercel Postgres** is connected:
   - If not connected, click "Add Integration" → "Vercel Postgres" → "Add"
   - If connected but showing errors, click "Disconnect" then reconnect it

### Step 2: Verify Environment Variables

1. In Vercel Dashboard, go to **Settings** → **Environment Variables**
2. Make sure these are set:
   - `DATABASE_URL` - Should be automatically set if Vercel Postgres is connected
   - `BLOB_READ_WRITE_TOKEN` - Only needed if using Blob storage (optional)
   - `RESEND_API_KEY` - For email functionality
   - `ENCRYPTION_KEY` - For data encryption
   - `ADMIN_EMAIL` - Admin login email
   - `ADMIN_PASSWORD` - Admin login password (hashed)

### Step 3: Reconnect Vercel Postgres (If Needed)

1. Go to **Settings** → **Integrations**
2. Find "Vercel Postgres"
3. Click "Disconnect" (if connected)
4. Click "Add Integration" → "Vercel Postgres"
5. Select your database or create a new one
6. Click "Add"

### Step 4: Check Blob Storage (Optional)

If you're using Blob storage for file uploads:

1. Go to **Settings** → **Integrations**
2. Check if "Vercel Blob" is connected
3. If not needed, you can skip this (the app will work without it, just file uploads won't work)

### Step 5: Redeploy

After fixing integrations:

1. Go to **Deployments** tab
2. Click the three dots (⋯) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

## Alternative: Use External Database

If Vercel Postgres continues to have issues, you can use an external PostgreSQL database:

1. **Supabase** (Free tier available)
   - Sign up at https://supabase.com
   - Create a project
   - Go to Settings → Database
   - Copy the connection string
   - Add it as `DATABASE_URL` in Vercel environment variables

2. **Neon** (Free tier available)
   - Sign up at https://neon.tech
   - Create a project
   - Copy the connection string
   - Add it as `DATABASE_URL` in Vercel environment variables

3. **Railway** (Free tier available)
   - Sign up at https://railway.app
   - Create a PostgreSQL database
   - Copy the connection string
   - Add it as `DATABASE_URL` in Vercel environment variables

## Common Issues

### Issue: "DATABASE_URL is empty"
**Solution**: Make sure Vercel Postgres integration is connected, or manually set `DATABASE_URL` environment variable

### Issue: "Integration provisioning failed"
**Solution**: 
- Disconnect and reconnect the integration
- Check your Vercel account limits
- Try creating a new integration

### Issue: "Build fails during prisma generate"
**Solution**: 
- Make sure `DATABASE_URL` is set in environment variables
- Check that the database connection string is valid
- Try running `prisma generate` locally to test

## Still Having Issues?

1. Check Vercel build logs for specific error messages
2. Verify all environment variables are set correctly
3. Make sure your Vercel account has the necessary permissions
4. Try disconnecting and reconnecting all integrations
5. Contact Vercel support if the issue persists
