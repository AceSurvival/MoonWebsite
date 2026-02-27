# GitHub Secrets Setup Guide

## Issue: DATABASE_URL is Empty During Deployment

Your GitHub Actions workflow is failing because `DATABASE_URL` is not set as a GitHub secret.

## Quick Fix: Add GitHub Secrets

### Step 1: Go to GitHub Repository Settings

1. Navigate to your GitHub repository
2. Click **Settings** (top right)
3. In the left sidebar, click **Secrets and variables** → **Actions**

### Step 2: Add Required Secrets

Click **New repository secret** and add each of these:

#### 1. DATABASE_URL (Required)
- **Name**: `DATABASE_URL`
- **Value**: Your PostgreSQL connection string
  ```
  postgresql://user:password@host:5432/database?sslmode=require
  ```
- **Example** (Vercel Postgres):
  ```
  postgresql://default:password@ep-xxx.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require
  ```

#### 2. VERCEL_TOKEN (Required if using GitHub Actions to deploy)
- **Name**: `VERCEL_TOKEN`
- **Value**: Get from Vercel → Settings → Tokens → Create Token

#### 3. VERCEL_ORG_ID (Required if using GitHub Actions to deploy)
- **Name**: `VERCEL_ORG_ID`
- **Value**: Get from Vercel → Settings → General → Team ID

#### 4. VERCEL_PROJECT_ID (Required if using GitHub Actions to deploy)
- **Name**: `VERCEL_PROJECT_ID`
- **Value**: Get from Vercel → Your Project → Settings → General → Project ID

#### 5. Other Secrets (Optional but recommended)
- `RESEND_API_KEY` - For email functionality
- `ENCRYPTION_KEY` - For data encryption
- `ADMIN_EMAIL` - Admin login email
- `ADMIN_PASSWORD` - Admin login password
- `BLOB_READ_WRITE_TOKEN` - For file uploads (if using Vercel Blob)

## Alternative: Deploy Directly from Vercel

If you prefer not to use GitHub Actions, you can:

1. **Connect your GitHub repo to Vercel** (if not already connected)
2. **Add environment variables in Vercel**:
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Add `DATABASE_URL` and all other required variables
   - Select all environments (Production, Preview, Development)
3. **Vercel will automatically deploy** on every push to `main`

This way, you don't need GitHub Secrets - everything is managed in Vercel.

## After Adding Secrets

1. **Redeploy** by pushing a new commit or manually triggering the workflow
2. The deployment should now succeed!

## Getting Your Database Connection String

### Option 1: Vercel Postgres (Easiest)
1. Go to Vercel → Your Project → Storage
2. Click **Create Database** → **Postgres**
3. Copy the connection string from the database settings

### Option 2: Supabase
1. Sign up at [supabase.com](https://supabase.com)
2. Create a project
3. Go to Settings → Database
4. Copy the connection string (URI format)

### Option 3: Neon
1. Sign up at [neon.tech](https://neon.tech)
2. Create a project
3. Copy the connection string from the dashboard

## Troubleshooting

- **Secret not found**: Make sure the secret name matches exactly (case-sensitive)
- **Empty value**: Ensure there are no extra spaces or quotes in the secret value
- **Connection failed**: Verify your database is running and accessible
- **Still failing**: Check GitHub Actions logs for detailed error messages
