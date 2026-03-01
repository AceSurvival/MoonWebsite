# Re-set up Admin Panel & Email – Moon Beauty Alchemy

Use this guide to create your admin user and configure email (Resend) for the live site.

---

## 1. Environment variables (Vercel)

In **Vercel** → your project → **Settings** → **Environment Variables**, ensure these exist and are available to **Production** (and **Build** if you want them during build):

| Variable | Purpose | Example |
|----------|---------|--------|
| `DATABASE_URL` | PostgreSQL connection string (required for app + admin) | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `ADMIN_EMAIL` | Admin login email (used when creating admin user) | `admin@moonbeautyalchemy.com` or your email |
| `ADMIN_PASSWORD` | Admin login password (use a strong password) | Your chosen password |
| `RESEND_API_KEY` | Sends order/contact emails | From [Resend](https://resend.com) → API Keys |
| `ENCRYPTION_KEY` | Encrypts customer data (32-byte hex) | 64-character hex string |
| `NEXT_PUBLIC_SITE_URL` | Site URL for links in emails | `https://moonbeautyalchemy.com` |

Optional: `FROM_EMAIL` can override the “from” address; otherwise set it in Admin → Settings below.

---

## 2. Create or reset the admin user

The admin user is stored in your **database**. You must run the init script once against the **same database** your Vercel app uses (the one in `DATABASE_URL`).

### Option A – Run locally against production DB

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
3. You should see either “Admin user created!” or “Admin password updated!”.

### Option B – Use Vercel’s env and run in a one-off environment

1. In Vercel, ensure `DATABASE_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` are set.
2. Locally, set only `DATABASE_URL` to the **same** value as in Vercel (copy from Vercel env).
3. Run:
   ```bash
   node scripts/init-admin.js
   ```

After this, log in at **https://your-vercel-domain.com/admin/login** (or your custom domain) with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

---

## 3. Configure email in the admin panel

1. Log in at **/admin/login**.
2. Go to **Settings** (**/admin/settings**).
3. **Email settings:**
   - **From Email**  
     - For production: use an address on your domain (e.g. `support@moonbeautyalchemy.com`) **after** the domain is verified in Resend.  
     - For testing: you can use `onboarding@resend.dev` (Resend’s test sender; limited to 100 emails/day).
   - **Contact Email**  
     - The inbox where contact form submissions and important notifications go (e.g. `ace.mc.owner@gmail.com` or your email).
4. Click **Save Settings**.

---

## 4. Resend (sending emails)

1. Sign up at [resend.com](https://resend.com) and create an **API Key**.
2. Add that key in Vercel as `RESEND_API_KEY` (see step 1).
3. **Optional but recommended for production:**  
   - In Resend: **Domains** → **Add Domain** → e.g. `moonbeautyalchemy.com`.  
   - Add the DNS records Resend shows.  
   - After verification, set **From Email** in Admin → Settings to e.g. `support@moonbeautyalchemy.com`.

Until your domain is verified, you can keep using `onboarding@resend.dev` as **From Email** for testing.

---

## 5. Quick checklist

- [ ] `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `RESEND_API_KEY`, `ENCRYPTION_KEY` set in Vercel.
- [ ] `node scripts/init-admin.js` run once against the production DB.
- [ ] Log in at **/admin/login** with that email and password.
- [ ] In **Settings**, set **From Email** and **Contact Email** and save.
- [ ] (Optional) Verify domain in Resend and switch **From Email** to your domain address.
- [ ] Test: contact form and a test order to confirm emails are received.

---

## Troubleshooting

- **Can’t log in**  
  - Confirm you ran `init-admin.js` with the same `DATABASE_URL` Vercel uses.  
  - Confirm `ADMIN_EMAIL` / `ADMIN_PASSWORD` match what you’re typing (no extra spaces).

- **Emails not sending**  
  - Check `RESEND_API_KEY` in Vercel and that **From Email** in Settings is a valid address (or `onboarding@resend.dev` for testing).  
  - Check Resend dashboard for logs and errors.

- **“Invalid credentials”**  
  - Run `init-admin.js` again with the desired `ADMIN_EMAIL` and `ADMIN_PASSWORD`; it will update the existing user’s password.
