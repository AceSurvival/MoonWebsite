# Fix Suspended Database - Quick Migration Guide

If your Vercel Postgres database is suspended, you need to migrate to a new database. Here's how to do it quickly:

## Option 1: Try to Unsuspend (If Possible)

1. **Go to Vercel Dashboard** → Your Project → Storage
2. **Find your Postgres database**
3. **Check if there's an "Unsuspend" or "Resume" button**
4. **If suspended due to billing**: Update payment method or upgrade plan
5. **If suspended due to inactivity**: Some providers auto-unsuspend on connection

## Option 2: Migrate to a New Database (Recommended)

### Step 1: Create a New Database

Choose one of these free options:

#### A. Supabase (Recommended - Free Tier)
1. Go to https://supabase.com and sign up
2. Click "New Project"
3. Fill in:
   - Project name: `highroller-peps`
   - Database password: (save this!)
   - Region: Choose closest to you
4. Wait for project to be created (~2 minutes)
5. Go to **Settings** → **Database**
6. Copy the **Connection String** (URI format)
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

#### B. Neon (Free Tier - Auto-pauses after inactivity)
1. Go to https://neon.tech and sign up
2. Click "Create Project"
3. Fill in project details
4. Copy the connection string from the dashboard
   - Format: `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

#### C. Railway (Free Tier - $5 credit/month)
1. Go to https://railway.app and sign up
2. Click "New Project"
3. Click "Provision PostgreSQL"
4. Click on the PostgreSQL service → **Variables** tab
5. Copy the `DATABASE_URL` value

### Step 2: Update Environment Variables

1. **Go to Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. **Find `DATABASE_URL`** and click to edit
3. **Replace the old connection string** with your new one
4. **Make sure it's set for all environments** (Production, Preview, Development)
5. **Save**

### Step 3: Run Database Migrations

You need to set up the database schema on the new database. You can do this in two ways:

#### Method A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link your project**:
   ```bash
   vercel link
   ```

4. **Pull environment variables** (to get the new DATABASE_URL):
   ```bash
   vercel env pull .env.local
   ```

5. **Set DATABASE_URL locally** (create `.env` file):
   ```env
   DATABASE_URL="your-new-connection-string-here"
   ```

6. **Run migrations**:
   ```bash
   npm run db:migrate:deploy
   ```

   Or use the setup script:
   ```bash
   node scripts/setup-database.js
   ```

7. **Create admin user**:
   ```bash
   node scripts/init-admin.js
   ```

#### Method B: Using Vercel Dashboard (If you can't use CLI)

1. **Go to your Vercel project** → **Deployments**
2. **Click on the latest deployment** → **View Function Logs**
3. **Trigger a redeploy** by pushing a commit or using "Redeploy"
4. **The build will run migrations automatically** if you have `postinstall` script set up

### Step 4: Verify Everything Works

1. **Redeploy your application**:
   - Go to Vercel Dashboard → Deployments
   - Click the three dots (⋯) on latest deployment
   - Click **Redeploy**

2. **Check the build logs** to ensure:
   - ✅ Prisma generate succeeds
   - ✅ Database connection works
   - ✅ No errors

3. **Test your application**:
   - Visit your site
   - Try logging into admin panel
   - Check if products/orders are accessible

## Step 5: Export Data from Old Database (If Possible)

If your old database is still accessible (even if suspended), you might be able to export data:

### Using Prisma Studio (If old DB is accessible):

1. **Temporarily set old DATABASE_URL**:
   ```bash
   export DATABASE_URL="old-connection-string"
   ```

2. **Open Prisma Studio**:
   ```bash
   npx prisma studio
   ```

3. **Export data manually** from each table (copy to CSV or JSON)

4. **Switch back to new DATABASE_URL** and import data

### Using pg_dump (If you have access):

```bash
pg_dump "old-connection-string" > backup.sql
psql "new-connection-string" < backup.sql
```

## Important Notes

⚠️ **If you can't access the old database:**
- You'll need to start fresh
- Re-add all products, settings, etc. through the admin panel
- This is why regular backups are important!

✅ **Prevent future suspensions:**
- **Supabase**: Free tier doesn't suspend, but has usage limits
- **Neon**: Auto-pauses after 5 minutes of inactivity (auto-resumes on connection)
- **Railway**: $5 free credit/month, then pay-as-you-go
- **Vercel Postgres**: Can suspend on free tier if limits exceeded

## Quick Checklist

- [ ] Created new database (Supabase/Neon/Railway)
- [ ] Copied new connection string
- [ ] Updated `DATABASE_URL` in Vercel environment variables
- [ ] Ran database migrations (`npm run db:migrate:deploy`)
- [ ] Created admin user (`node scripts/init-admin.js`)
- [ ] Redeployed application
- [ ] Tested admin login
- [ ] Verified site is working

## Need Help?

If migrations fail:
1. Check the connection string format is correct
2. Verify the database is accessible (not paused)
3. Check Vercel build logs for specific errors
4. Make sure `DATABASE_URL` is set for all environments

If you need to start completely fresh:
1. The new database will be empty
2. You'll need to re-add products, settings, etc.
3. Use the admin panel to add everything back
