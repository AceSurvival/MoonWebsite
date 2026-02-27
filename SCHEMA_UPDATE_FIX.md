# Fix Database Schema Error - Quick Fix

## Problem
The application is throwing a server-side error because new fields (`uses` and `revenueGenerated`) were added to the `DiscountCode` model, but the database hasn't been updated yet.

## Quick Fix Options

### Option 1: Run SQL Directly (Fastest)

1. **Connect to your database** (via Supabase dashboard, Neon dashboard, or psql)
2. **Run this SQL**:

```sql
ALTER TABLE "DiscountCode" 
ADD COLUMN IF NOT EXISTS "uses" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "DiscountCode" 
ADD COLUMN IF NOT EXISTS "revenueGenerated" DOUBLE PRECISION NOT NULL DEFAULT 0;
```

3. **Redeploy your application** on Vercel

### Option 2: Using Prisma DB Push

If you have local access with DATABASE_URL set:

```bash
npx prisma db push
```

This will update your database schema to match the Prisma schema.

### Option 3: Using Prisma Migrate Deploy

```bash
npx prisma migrate deploy
```

### After Updating Schema

1. **Regenerate Prisma Client** (if needed):
   ```bash
   npx prisma generate
   ```

2. **Backfill existing data** (optional but recommended):
   ```bash
   node scripts/backfill-discount-code-stats.js
   ```

3. **Redeploy** your application

## For Vercel Deployment

**Easiest method:**
1. Go to your database provider dashboard (Supabase/Neon/etc.)
2. Open the SQL editor
3. Run the SQL commands from Option 1 above
4. Redeploy on Vercel

The application should work immediately after adding these columns!
