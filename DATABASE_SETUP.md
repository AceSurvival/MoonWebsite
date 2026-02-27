# Database Connection Setup Guide

## Error: Can't reach database server at `db.prisma.io:5432`

This error means your `DATABASE_URL` environment variable is either:
1. Not set correctly
2. Pointing to an invalid database server
3. The database server is not accessible

## Quick Fix

### For Local Development:

1. **Create a `.env` file** in the project root (if it doesn't exist)

2. **Add your PostgreSQL connection string:**
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
   ```

3. **Get a free PostgreSQL database:**
   - **Vercel Postgres**: Go to Vercel → Storage → Create Database → Postgres
   - **Supabase**: Sign up at [supabase.com](https://supabase.com) → Create project → Copy connection string
   - **Neon**: Sign up at [neon.tech](https://neon.tech) → Create project → Copy connection string

### For Production (Vercel):

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add `DATABASE_URL`** with your PostgreSQL connection string:
   ```
   postgresql://user:password@host:5432/database?sslmode=require
   ```

3. **Select all environments** (Production, Preview, Development)

4. **Redeploy** your application

## Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
```

Example (Vercel Postgres):
```
postgresql://default:password@ep-xxx.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require
```

Example (Supabase):
```
postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

## After Setting DATABASE_URL

1. **Run database migrations:**
   ```bash
   npm run db:migrate:deploy
   ```

2. **Or use the setup script:**
   ```bash
   node scripts/setup-database.js
   ```

3. **Create admin user:**
   ```bash
   node scripts/init-admin.js
   ```

## Troubleshooting

### Error persists after setting DATABASE_URL:
- Make sure the connection string is correct (no extra spaces or quotes)
- Verify the database server is running and accessible
- Check if your IP needs to be whitelisted (some providers require this)
- Ensure SSL mode is set correctly (`?sslmode=require`)

### For Vercel deployments:
- Environment variables must be set in Vercel dashboard
- Redeploy after adding environment variables
- Check Vercel logs for connection errors

### Testing connection locally:
```bash
# Test if DATABASE_URL is set
echo $DATABASE_URL

# Or on Windows PowerShell
$env:DATABASE_URL
```

## Need Help?

If you're still having issues:
1. Check your database provider's documentation
2. Verify your connection string format
3. Check Vercel logs for detailed error messages
4. Ensure your database is not paused (some free tiers pause inactive databases)
