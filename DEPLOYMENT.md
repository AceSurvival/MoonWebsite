# Automatic Deployment Setup

This project is configured to **automatically publish/deploy** whenever code is pushed to GitHub.

## Quick Deploy

After making changes, simply run:

```bash
npm run deploy
```

Or with a custom commit message:

```bash
npm run deploy "Fixed promo code functionality"
```

This will:
1. ✅ Stage all changes
2. ✅ Commit with your message
3. ✅ Push to GitHub
4. ✅ Trigger automatic deployment (if configured)

## Deployment Platforms

### Option 1: Vercel (Recommended for Next.js)

**Setup:**
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Import your GitHub repository
3. Vercel will automatically detect Next.js and configure deployment
4. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `RESEND_API_KEY`
   - `BLOB_READ_WRITE_TOKEN`

**Result:** Every push to `main` branch automatically deploys! 🚀

### Option 2: Netlify

**Setup:**
1. Go to [netlify.com](https://netlify.com) and sign in with GitHub
2. Click "New site from Git"
3. Select your repository
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Add environment variables in Netlify dashboard

**Result:** Every push to `main` branch automatically deploys! 🚀

### Option 3: GitHub Actions (Custom Deployment)

The `.github/workflows/deploy.yml` file is configured for custom deployment via GitHub Actions.

**Setup:**
1. Add secrets to GitHub repository:
   - Go to Settings → Secrets and variables → Actions
   - Add required secrets:
     - `VERCEL_TOKEN` (if using Vercel)
     - `VERCEL_ORG_ID`
     - `VERCEL_PROJECT_ID`
     - `DATABASE_URL`
     - `NEXTAUTH_SECRET`
     - `ADMIN_EMAIL`
     - `ADMIN_PASSWORD`
     - `RESEND_API_KEY`
     - `BLOB_READ_WRITE_TOKEN`

2. Push to GitHub - deployment will start automatically!

## Manual Deployment

If you need to deploy manually:

```bash
# Build the project
npm run build

# Deploy using your platform's CLI
# For Vercel:
vercel --prod

# For Netlify:
netlify deploy --prod
```

## Environment Variables

Make sure these are set in your deployment platform:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret for authentication
- `ADMIN_EMAIL` - Admin login email
- `ADMIN_PASSWORD` - Admin login password (hashed)
- `RESEND_API_KEY` - Email service API key
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token (if using Vercel)

## Database Migrations

Migrations run automatically during deployment via GitHub Actions, or you can run manually:

```bash
npm run db:migrate:deploy
```

## Troubleshooting

**Deployment fails:**
- Check environment variables are set correctly
- Verify database connection string
- Check build logs in your deployment platform

**Changes not deploying:**
- Make sure you pushed to `main` or `master` branch
- Check deployment platform is connected to GitHub
- Verify GitHub Actions workflow is enabled

**Need to force redeploy:**
- Push an empty commit: `git commit --allow-empty -m "Redeploy" && git push`
- Or use your platform's "Redeploy" button in dashboard

## Current Status

✅ **Auto-deployment is ENABLED**
- Push to GitHub → Automatic deployment
- Use `npm run deploy` to push and trigger deployment
- GitHub Actions workflow configured
- Works with Vercel, Netlify, or custom deployment
