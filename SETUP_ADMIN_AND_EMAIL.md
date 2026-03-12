# Moon Beauty Alchemy – Simple Setup Guide

This is the short version of how to get the site, admin, and email working. Hand this to any developer.

---

## 1. Get the code

1. Make sure you have access to the GitHub repo.
2. On your machine:
   ```bash
   git clone https://github.com/<owner>/<repo>.git
   cd <repo>
   ```

---

## 2. Local dev (optional, but recommended)

1. Install **Node.js** (LTS) and **npm** or **yarn**.
2. In the project folder, install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```
3. Create `.env.local` in the project root:
   ```env
   DATABASE_URL="your-dev-or-prod-postgres-url"
   ADMIN_EMAIL="admin@moonbeautyalchemy.com"
   ADMIN_PASSWORD="SomeSecureAdminPassword"
   RESEND_API_KEY="your-resend-api-key"
   ENCRYPTION_KEY="64-character-hex-string"
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   ```
4. Start dev server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   Visit `http://localhost:3000`.

---

## 3. Vercel + database

1. In **Vercel**, create/import a project from this GitHub repo.
2. Make sure you have a **PostgreSQL** database (Supabase/Neon/etc.) and get the connection string:
   ```text
   postgresql://user:password@host:5432/database?sslmode=require
   ```
3. In **Vercel → Project → Settings → Environment Variables** add:

   | Variable | Example |
   |----------|---------|
   | `DATABASE_URL` | `postgresql://user:pass@host:5432/db?sslmode=require` |
   | `ADMIN_EMAIL` | `admin@moonbeautyalchemy.com` |
   | `ADMIN_PASSWORD` | `SomeSecureAdminPassword` |
   | `RESEND_API_KEY` | from Resend dashboard |
   | `ENCRYPTION_KEY` | 64‑character hex string |
   | `NEXT_PUBLIC_SITE_URL` | `https://moonbeautyalchemy.com` |

4. Push to `main`:
   ```bash
   git add .
   git commit -m "Deploy"
   git push origin main
   ```
   Vercel will build and deploy.

5. (Optional) Add your custom domain in Vercel and update DNS. Then set `NEXT_PUBLIC_SITE_URL` to that domain.

---

## 4. Create / reset the admin user

The admin user lives in the same Postgres database used by Vercel (`DATABASE_URL`).

1. Create a `.env` (or reuse `.env.local`) with at least:
   ```env
   DATABASE_URL="your-production-postgres-url-from-vercel"
   ADMIN_EMAIL="admin@moonbeautyalchemy.com"
   ADMIN_PASSWORD="YourSecurePassword"
   ```
2. From the project folder, run:
   ```bash
   node scripts/init-admin.js
   ```
3. It will say either:
   - `Admin user created!` or
   - `Admin password updated!`
4. Log in to the live site at:
   - `https://your-vercel-domain.com/admin/login`  
   - or `https://moonbeautyalchemy.com/admin/login`

Use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you set.

---

## 5. Email (Resend) + admin settings

1. Go to `https://resend.com`, create an account, and make an **API Key**.
2. Put that key in Vercel as `RESEND_API_KEY`.
3. (Recommended) In Resend → **Domains**, add `moonbeautyalchemy.com` and follow the DNS steps until it shows as verified.
4. On the live site:
   - Go to `/admin/login` and sign in.
   - Go to `/admin/settings`.
   - Set:
     - **From Email**
       - For production: something like `support@moonbeautyalchemy.com` (after domain is verified in Resend).
       - For testing: you can use `onboarding@resend.dev`.
     - **Contact Email**
       - Where contact form + order notifications go (e.g. `ace.mc.owner@gmail.com`).
   - Click **Save Settings**.

---

## 6. Final sanity checklist

- [ ] Site is deployed on Vercel and loads on your domain.
- [ ] `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `RESEND_API_KEY`, `ENCRYPTION_KEY`, `NEXT_PUBLIC_SITE_URL` are set in Vercel.
- [ ] `node scripts/init-admin.js` has been run against the production database.
- [ ] You can log in at `/admin/login` with the admin email and password.
- [ ] In **Admin → Settings**, `From Email` and `Contact Email` are set and saved.
- [ ] A test **contact form** submission sends an email.
- [ ] A test **order** sends emails as expected.

If those are all true, the website, admin, and email are fully set up.
