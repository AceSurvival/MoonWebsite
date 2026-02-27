-- Migration: Add uses and revenueGenerated fields to DiscountCode table
-- Run this SQL directly on your database to fix the schema error
-- 
-- How to run:
-- 1. Connect to your database (Supabase/Neon/etc. dashboard)
-- 2. Open SQL editor
-- 3. Copy and paste these commands
-- 4. Execute

ALTER TABLE "DiscountCode" 
ADD COLUMN IF NOT EXISTS "uses" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "DiscountCode" 
ADD COLUMN IF NOT EXISTS "revenueGenerated" DOUBLE PRECISION NOT NULL DEFAULT 0;
