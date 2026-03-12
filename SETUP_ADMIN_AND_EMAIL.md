# Moon Beauty Alchemy – Setup Guide for New Owners

This guide is for the person who is taking over the website. You don’t need to be a developer. Follow the steps in order on a **Windows PC**. If you get stuck, ask the person who gave you the site for help.

---

## What you’ll need before you start

- An **email address** you can use for new accounts.
- A **password** you want to use to log in to the **admin panel** (the private area where you manage the site). Make it strong and don’t share it.
- Your **website address** (e.g. `moonbeautyalchemy.com`), if you already have one.
- **(Optional)** If you will run the “create admin” step yourself: the **website folder** on your computer (the person who gave you the site can send or copy it to you).

---

## Step 1: Create a GitHub account (so the site code can be used online)

GitHub is where the website’s code is stored. Vercel (the service that hosts the site) will read the code from here.

1. Open your web browser and go to: **https://github.com**
2. Click **Sign up** (top right).
3. Enter your **email**, a **password**, and a **username**. Click **Create account**.
4. Confirm your email if GitHub asks you to (check your inbox and click the link).
5. **Get access to the website’s repository (repo):**
   - The **previous owner** must add you to the project. They do this on GitHub by going to the repo → **Settings** → **Collaborators** → **Add people** and entering your GitHub username or email.
   - You will get an **email invite** from GitHub. Open it and click **Accept invite**.
   - After that, you should see the website’s repo when you’re logged in to GitHub.

You don’t need to download or edit the code. You just need an account and access to that repo.

---

## Step 2: Create a Vercel account and put the site online

Vercel is the service that hosts the website and makes it visible on the internet.

1. Go to: **https://vercel.com**
2. Click **Sign Up** and choose **Continue with GitHub**.
3. Log in with your GitHub account if it asks you. Allow Vercel to access GitHub when it asks.
4. After you’re in Vercel, click **Add New…** → **Project**.
5. You should see a list of your GitHub repos. Find the **Moon Website** repo (or whatever it’s called) and click **Import** next to it.
6. On the next screen, **don’t change the default settings**. Just click **Deploy**.
7. Wait a minute or two. When it’s done, you’ll see a link like `something.vercel.app`. That’s your site – but it won’t work fully until you add the **database** and **settings** in the next steps.

**Optional – use your own domain (e.g. moonbeautyalchemy.com):**  
Later, in the Vercel project, go to **Settings** → **Domains** → **Add** and type your domain. Vercel will tell you what to change at your domain provider (where you bought the domain). After the domain is connected, use that full address (e.g. `https://moonbeautyalchemy.com`) wherever this guide says “your site address.”

---

## Step 3: Create a database (where orders and admin login are stored)

The site needs a **database** to store orders, contact messages, and the admin account. A simple free option is **Supabase**.

1. Go to: **https://supabase.com**
2. Click **Start your project** and sign up (you can use your GitHub account or email).
3. Create a **new project**: give it a name (e.g. Moon Beauty), a password (save it somewhere safe), and pick a region close to you. Click **Create new project** and wait until it’s ready.
4. Get the **connection string** (this is the “address” of your database):
   - In the left menu, click **Project Settings** (gear icon).
   - Click **Database**.
   - Scroll to **Connection string** and choose **URI**.
   - Copy the long line that looks like:  
     `postgresql://postgres.xxxx:YOUR_PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres`
   - Replace `YOUR_PASSWORD` in that line with the database password you set when you created the project. **Keep this full line secret** – you’ll paste it into Vercel in the next step.

---

## Step 4: Add the site’s “secrets” in Vercel (Environment Variables)

The site needs a few **settings** (called environment variables) to run. You add them in Vercel.

1. In **Vercel**, open your project (click the project name).
2. Go to **Settings** (top menu) → **Environment Variables** (left side).
3. Add **each** of the following, one by one. For each row:
   - Type the **Name** exactly as written.
   - Paste or type the **Value**.
   - Leave the environment as **Production** (or check Production).
   - Click **Save**.

| Name | Where to get the value |
|------|------------------------|
| `DATABASE_URL` | The long database line you copied from Supabase in Step 3 (the one that starts with `postgresql://`). |
| `ADMIN_EMAIL` | The email address you want to use to **log in to the admin panel** (e.g. your personal or business email). |
| `ADMIN_PASSWORD` | The **password** you want for the admin panel. Use a strong password. |
| `RESEND_API_KEY` | You’ll get this in **Step 6** (Resend). You can add a placeholder like `todo` for now and come back to change it. |
| `ENCRYPTION_KEY` | A long random string. Search online for “random 64 character hex generator” and copy one 64-character string. Or ask the person who gave you the site to generate one for you. |
| `NEXT_PUBLIC_SITE_URL` | Your site’s full address: `https://yoursite.vercel.app` or `https://moonbeautyalchemy.com` if you already connected your domain. |

4. After you add or change any variable, **redeploy** the site: go to the **Deployments** tab, click the **⋯** next to the latest deployment, and choose **Redeploy**.

---

## Step 5: Create your admin login (one-time setup)

The **admin panel** is where you log in to manage orders and settings. Someone has to “create” that login once by running a small script. You can do it yourself on Windows, or ask the person who gave you the site to do it.

### Option A: You do it on your Windows PC

1. **Install Node.js** (this lets you run the script):
   - Go to **https://nodejs.org**
   - Download the **LTS** version (green button).
   - Run the installer and click **Next** until it finishes.
2. Get the **website folder** on your computer (e.g. on the Desktop or in Downloads). The person who gave you the site may have sent it as a ZIP – if so, right‑click the ZIP → **Extract All** and open the extracted folder.
3. Inside that folder, create a new text file named **`.env`** (with the dot at the start). Open it with Notepad and paste these three lines, **replacing** the values with your real ones:
   ```
   DATABASE_URL="paste your Supabase connection string here"
   ADMIN_EMAIL="your@email.com"
   ADMIN_PASSWORD="YourAdminPassword"
   ```
   Save and close the file.
4. Open **Command Prompt**:
   - Press the **Windows key**, type **cmd**, press **Enter**.
5. Go to the website folder. Type **cd** followed by a space, then **drag the website folder** from File Explorer into the Command Prompt window. Press **Enter**.  
   (Example: if the folder is on your Desktop, you might see something like `cd C:\Users\YourName\Desktop\MoonWebsite`.)
6. Run the admin-creation script by typing exactly:
   ```
   node scripts/init-admin.js
   ```
   Press **Enter**.
7. You should see a message like **Admin user created!** or **Admin password updated!**. If you see an error, check that `.env` has the correct `DATABASE_URL` (same as in Vercel) and that you’re in the right folder.

### Option B: Someone else does it for you

Give the person who set up the site:

- Your **database connection string** (same as `DATABASE_URL` in Vercel).
- The **admin email** and **admin password** you want to use.

They run `node scripts/init-admin.js` on their computer with those values in a `.env` file. After that, you can log in from any computer.

### Logging in to the admin panel

- Open your site in the browser (e.g. `https://yoursite.vercel.app` or `https://moonbeautyalchemy.com`).
- Go to: **/admin/login** (e.g. `https://moonbeautyalchemy.com/admin/login`).
- Enter the **ADMIN_EMAIL** and **ADMIN_PASSWORD** you set in Step 4 (and used in Step 5).

---

## Step 6: Set up email (Resend) so the site can send messages

The site uses **Resend** to send emails (e.g. when someone uses the contact form or places an order).

1. Go to: **https://resend.com**
2. Sign up (use your email or sign in with Google/GitHub).
3. Create an **API Key**:
   - In the Resend dashboard, go to **API Keys**.
   - Click **Create API Key**, give it a name (e.g. Moon Website), and click **Create**.
   - **Copy the key** (you won’t see it again). Paste it somewhere safe for a moment.
4. Add the key to Vercel:
   - In **Vercel** → your project → **Settings** → **Environment Variables**.
   - Find **RESEND_API_KEY** and click **Edit**. Paste the key you copied. Save.
   - If you had put `todo` earlier, replace it with this key and save.
5. **Redeploy** the project again (Deployments → **⋯** → **Redeploy**).

**Optional – send from your own domain (e.g. support@moonbeautyalchemy.com):**  
In Resend, go to **Domains** → **Add Domain** and type your domain. Resend will show you which DNS records to add at your domain provider. After the domain is verified, you can use an address like `support@moonbeautyalchemy.com` in the admin settings below. Until then, you can use Resend’s test address: `onboarding@resend.dev`.

---

## Step 7: Set email addresses in the admin panel

1. Log in to the admin panel (your site address + **/admin/login**).
2. Go to **Settings** (or **/admin/settings**).
3. Fill in:
   - **From Email** – The address that appears as the sender (e.g. `support@moonbeautyalchemy.com` after your domain is verified in Resend, or `onboarding@resend.dev` for testing).
   - **Contact Email** – The inbox where you want to receive contact form messages and order notifications (e.g. your Gmail or business email).
4. Click **Save Settings**.

---

## Quick checklist – is everything working?

- [ ] You have a **GitHub** account and were added to the website’s repo.
- [ ] You have a **Vercel** account and the project is imported and deployed.
- [ ] You have a **Supabase** (or other) database and copied the connection string into Vercel as **DATABASE_URL**.
- [ ] In Vercel **Environment Variables** you added: **ADMIN_EMAIL**, **ADMIN_PASSWORD**, **RESEND_API_KEY**, **ENCRYPTION_KEY**, **NEXT_PUBLIC_SITE_URL** (and **DATABASE_URL**).
- [ ] The **admin user** was created (you or someone else ran **Step 5**).
- [ ] You can **log in** at your site’s **/admin/login** with your admin email and password.
- [ ] In **Admin → Settings** you set **From Email** and **Contact Email** and saved.
- [ ] You **tested** the contact form and received the email at your Contact Email.

If all of these are done, your website, admin panel, and email are set up. You can give this guide to the next owner if you ever pass the site on.
