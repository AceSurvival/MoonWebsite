# Moon Beauty Alchemy – Full Setup & Handoff Guide

Use this document to fully set up, run, and maintain the Moon Beauty Alchemy website, including:

- **GitHub & code**
- **Local development**
- **Database**
- **Vercel deployment**
- **Admin panel**
- **Email (Resend)**

You can give this file to any developer and they should be able to get the site running again from scratch.

---

## 0. What this project is

- **Tech stack**: Next.js (React) + Node, PostgreSQL, Resend (email), deployed on Vercel.
- **Key pieces**:
  - Public website (`/`)
  - Admin dashboard (`/admin`)
  - Email for contact form / order notifications (via Resend)

---

## 1. GitHub repository & code

1. **Get access to the GitHub repo**
   - Ask the current owner to invite you as a **collaborator** on the repository that contains this code.
   - Once invited, accept the invite in GitHub.

2. **Clone the repository**
   - On your machine:
     ```bash
     git clone https://github.com/<owner>/<repo>.git
     cd <repo>
     ```
   - Replace `<owner>/<repo>` with the actual GitHub path.

3. **Branching**
   - Main branch is typically `main`.
   - For changes, create a branch:
     ```bash
     git checkout -b feature/your-change
     ```
   - When finished:
     ```bash
     git add .
     git commit -m "Describe your change"
     git push origin feature/your-change
     ```
   - Open a Pull Request into `main` in GitHub.

4. **Handoff expectation**
   - This file (`SETUP_ADMIN_AND_EMAIL.md`) should stay updated in the repo so future devs know how to re‑set everything.

---

## 2. Local development setup

1. **Prerequisites**
   - Node.js (LTS, e.g. 18+)
   - npm or yarn
   - Access to a PostgreSQL database (local or remote)  
     For **development**, you can use your own Postgres; for **admin reset**, you’ll point to the **production Postgres**.

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Create local env file**
   - In the project root, create `.env.local`:
     ```env
     DATABASE_URL="your-dev-or-prod-postgres-url"
     ADMIN_EMAIL="admin@moonbeautyalchemy.com"
     ADMIN_PASSWORD="SomeSecureAdminPassword"
     RESEND_API_KEY="your-resend-api-key"
     ENCRYPTION_KEY="64-character-hex-string"
     NEXT_PUBLIC_SITE_URL="http://localhost:3000"
     ```
   - For **local dev only**, you can use:
     - `NEXT_PUBLIC_SITE_URL="http://localhost:3000"`
     - `RESEND_API_KEY` from a test Resend key.

4. **Run the dev server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   Then open `http://localhost:3000`.

---

## 3. Database & required environment variables

The app requires a PostgreSQL database and several env vars.

### 3.1. PostgreSQL

- You can use:
  - A managed Postgres (e.g. Supabase, Neon, RDS, Vercel Postgres, etc.).
  - Or any other Postgres with a connection string.
- Connection string format:
  ```text
  postgresql://user:password@host:5432/database?sslmode=require
  ```

### 3.2. Environment variables (Vercel)

In **Vercel** → your project → **Settings** → **Environment Variables**, ensure these exist and are available to **Production** (and **Build** if you want them during build):

| Variable | Purpose | Example |
|----------|---------|--------|
| `DATABASE_URL` | PostgreSQL connection string (required for app + admin) | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `ADMIN_EMAIL` | Admin login email (used when creating admin user) | `admin@moonbeautyalchemy.com` or your email |
| `ADMIN_PASSWORD` | Admin login password (use a strong password) | Your chosen password |
| `RESEND_API_KEY` | Sends order/contact emails | From [Resend](https://resend.com) → API Keys |
| `ENCRYPTION_KEY` | Encrypts customer data (32-byte hex) | 64-character hex string |
| `NEXT_PUBLIC_SITE_URL` | Site URL for links in emails | `https://moonbeautyalchemy.com` |

Optional: `FROM_EMAIL` can override the “from” address; otherwise set it inside the Admin → Settings page (see below).

---

## 4. Vercel project & deployment

1. **Create or connect a Vercel project**
   - Go to `https://vercel.com`.
   - Create an account or log in.
   - Click **Add New… → Project**.
   - Import the GitHub repo that contains this project.

2. **Configure project settings**
   - **Framework**: Vercel should auto‑detect Next.js.
   - **Build command**: usually `next build` (Vercel default for Next.js).
   - **Output directory**: `.next` (default).

3. **Set environment variables**
   - As in section **3.2**, add `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `RESEND_API_KEY`, `ENCRYPTION_KEY`, `NEXT_PUBLIC_SITE_URL`, and optional `FROM_EMAIL`.
   - Make sure they are set for **Production** (and **Preview** if you want).

4. **Trigger a deployment**
   - After env vars are set, push to `main`:
     ```bash
     git add .
     git commit -m "Configure Moon Beauty deployment"
     git push origin main
     ```
   - Vercel will automatically build and deploy.

5. **Custom domain**
   - In Vercel project → **Domains**, add your custom domain (e.g. `moonbeautyalchemy.com`).
   - Follow Vercel instructions to update DNS at your domain registrar.
   - Update `NEXT_PUBLIC_SITE_URL` in Vercel to match your final domain.

---

## 5. Admin user – create or reset

The admin user is stored in your **database**. You must run an init script once against the **same database** your Vercel app uses (the one in `DATABASE_URL`).

### 5.1. Run script locally against production DB

1. Create a `.env` (or `.env.local`) in the project root with at least:
   ```env
   DATABASE_URL="your-production-postgres-url-from-vercel"
   ADMIN_EMAIL="admin@moonbeautyalchemy.com"
   ADMIN_PASSWORD="YourSecurePassword"
   ```
2. In the project folder, run:
   ```bash
   node scripts/init-admin.js
   ```
3. You should see either:
   - `Admin user created!` **or**
   - `Admin password updated!`

### 5.2. Alternative – Use Vercel’s env as source of truth

1. In Vercel, ensure `DATABASE_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` are set.
2. Locally, set `DATABASE_URL` to the **same** value as in Vercel (copy from Vercel env).
3. Run:
   ```bash
   node scripts/init-admin.js
   ```

### 5.3. Logging into the admin

- After the script runs successfully, log in at:
  - `https://your-vercel-domain.com/admin/login`  
  - or your custom domain: `https://moonbeautyalchemy.com/admin/login`
- Use the email/password from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

---

## 6. Email setup (Resend + admin UI)

### 6.1. Resend account & API key

1. Sign up at [resend.com](https://resend.com).
2. In Resend, go to **API Keys** and create a new key.
3. Add that key in Vercel as `RESEND_API_KEY` (see section 3.2).

### 6.2. Domain verification (recommended for production)

1. In Resend:
   - Go to **Domains** → **Add Domain** → e.g. `moonbeautyalchemy.com`.
   - Resend will show DNS records (TXT, CNAME, etc.).
2. In your DNS provider (where your domain is registered), add those records.
3. Once Resend marks the domain as **verified**, you can send email from addresses like:
   - `support@moonbeautyalchemy.com`
   - `hello@moonbeautyalchemy.com`

Until your domain is verified, you can keep using `onboarding@resend.dev` as **From Email** for testing (Resend’s test sender, limited to 100 emails/day).

### 6.3. Configure email in the admin panel

1. Log in at `/admin/login`.
2. Go to **Settings** (`/admin/settings`).
3. **Email settings:**
   - **From Email**
     - For production: use an address on your verified domain (e.g. `support@moonbeautyalchemy.com`).
     - For testing: `onboarding@resend.dev` works until domain is verified.
   - **Contact Email**
     - The inbox where contact form submissions and important notifications go (e.g. `ace.mc.owner@gmail.com` or your chosen inbox).
4. Click **Save Settings**.

---

## 7. Ongoing maintenance & workflow

- **Making changes**
  - Create a feature branch off `main`.
  - Make edits, test locally.
  - Commit and push the branch, open a Pull Request.
  - After review, merge into `main`.
  - Merging to `main` triggers Vercel to redeploy with the latest code.

- **Environment changes**
  - Any time you change env vars in Vercel, trigger a new deployment (e.g. push a small commit).

- **Secrets**
  - Never commit `.env` files to Git.
  - Store secrets only in Vercel env settings and your local `.env.local` (git‑ignored).

---

## 8. Quick end‑to‑end checklist (for a new developer)

- **GitHub**
  - [ ] Have access to the GitHub repo and can clone it.
- **Local**
  - [ ] Node + npm/yarn installed.
  - [ ] `npm install` / `yarn` runs successfully.
  - [ ] `.env.local` created with valid values for local dev.
  - [ ] `npm run dev` works and site loads at `http://localhost:3000`.
- **Database & env**
  - [ ] Production `DATABASE_URL` set in Vercel.
  - [ ] `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `RESEND_API_KEY`, `ENCRYPTION_KEY`, `NEXT_PUBLIC_SITE_URL` set in Vercel.
- **Admin & email**
  - [ ] `node scripts/init-admin.js` run once against the production DB.
  - [ ] Can log in to `/admin/login` with that email + password.
  - [ ] In **Settings**, `From Email` and `Contact Email` are set and saved.
  - [ ] (Optional) Resend domain verified, and `From Email` uses that domain.
- **Testing**
  - [ ] Contact form sends an email to the contact inbox.
  - [ ] A test order sends email(s) as expected.

If all of the above are checked, the Moon Beauty Alchemy website and admin should be fully set up and ready for use.
