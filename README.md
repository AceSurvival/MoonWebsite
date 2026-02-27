# Moon Beauty Alchemy - Research Vial & Peptide Store

A production-ready e-commerce web application for selling research peptides with manual payment processing.

## Features

- **Public Storefront**
  - Home page with hero section and featured products
  - Product catalog with category filtering
  - Product detail pages
  - Shopping cart (localStorage-based)
  - Checkout flow with manual payment instructions
  - FAQ page with accordion UI
  - Contact form

- **Admin Panel**
  - Secure admin authentication
  - Product management (CRUD)
  - Order management with status updates
  - FAQ management
  - Settings management (payment instructions, contact email)
  - Discount code and creator code tracking

- **Payment Processing**
  - Manual payment workflow (Zelle, Bitcoin, Cash App)
  - Order status tracking (PENDING_PAYMENT, PAID, SHIPPED, CANCELED)
  - Discount codes and creator codes with revenue tracking

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM) - Required for Vercel deployment
- **Styling**: Tailwind CSS
- **Authentication**: Session-based (cookie)

## ⚠️ Important: Database Setup for Vercel

**SQLite does NOT work on Vercel.** You must use PostgreSQL for production deployment.

### Quick Setup Options:

1. **Vercel Postgres** (Recommended - Easiest)
   - Go to your Vercel project → Storage → Create Database → Postgres
   - Copy the connection string
   - Add it as `DATABASE_URL` in Vercel Environment Variables

2. **Supabase** (Free tier available)
   - Sign up at [supabase.com](https://supabase.com)
   - Create a project → Settings → Database
   - Copy the connection string (use the "URI" format)
   - Add it as `DATABASE_URL` in Vercel Environment Variables

3. **Neon** (Free tier available)
   - Sign up at [neon.tech](https://neon.tech)
   - Create a project and copy the connection string
   - Add it as `DATABASE_URL` in Vercel Environment Variables

### After Setting Up Database:

1. **Add DATABASE_URL to Vercel:**
   - Go to Vercel project → Settings → Environment Variables
   - Add `DATABASE_URL` with your PostgreSQL connection string
   - Format: `postgresql://user:password@host:5432/database?sslmode=require`
   - Select all environments (Production, Preview, Development)

2. **Create Database Tables:**
   
   **Option A: Using the setup script (Recommended)**
   ```bash
   # Set DATABASE_URL locally (create .env file or export)
   export DATABASE_URL="your-postgresql-connection-string"
   
   # Run setup script
   node scripts/setup-database.js
   
   # Create admin user
   node scripts/init-admin.js
   ```
   
   **Option B: Manual setup**
   ```bash
   # Set DATABASE_URL
   export DATABASE_URL="your-postgresql-connection-string"
   
   # Generate Prisma Client
   npx prisma generate
   
   # Push schema to database (creates tables)
   npx prisma db push
   
   # Create admin user
   node scripts/init-admin.js
   ```

3. **Redeploy on Vercel** - The app should now work!

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

**For Local Development (SQLite - Optional):**
```env
DATABASE_URL="file:./dev.db"
ADMIN_EMAIL="admin@moonbeautyalchemy.com"
ADMIN_PASSWORD="your-secure-password"
```

**For Production/Vercel (PostgreSQL - Required):**
```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
ADMIN_EMAIL="admin@moonbeautyalchemy.com"
ADMIN_PASSWORD="your-secure-password"
```

**Note:** If you want to use SQLite locally, you'll need to temporarily change the schema back to `provider = "sqlite"` for local development, then change it back to `provider = "postgresql"` before deploying. Alternatively, use PostgreSQL for both local and production.

### 3. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Create admin user
node scripts/init-admin.js
```

The admin user will be created with the email and password from your `.env` file.

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 5. Access Admin Panel

Navigate to `http://localhost:3000/admin/login` and log in with your admin credentials.

## Deployment to HostGator

### Prerequisites

1. HostGator shared hosting account with Node.js support
2. SSH access (or cPanel File Manager)
3. Domain name configured

### Steps

1. **Upload Files**
   - Upload all project files to your hosting directory (usually `public_html` or a subdirectory)
   - Make sure to include all files except `node_modules` and `.next`

2. **Set Up Database**
   - HostGator uses MySQL by default. Update your Prisma schema to use MySQL:
     - Change `provider = "sqlite"` to `provider = "mysql"` in `prisma/schema.prisma`
     - Update `DATABASE_URL` in `.env` to your MySQL connection string:
       ```
       DATABASE_URL="mysql://username:password@hostname:3306/database_name"
       ```
   - Run migrations:
     ```bash
     npm run db:push
     ```

3. **Install Dependencies**
   - SSH into your HostGator account
   - Navigate to your project directory
   - Run: `npm install --production`

4. **Build the Application**
   ```bash
   npm run build
   ```

5. **Set Environment Variables**
   - Create `.env` file on the server with your production values
   - Make sure `.env` is not publicly accessible

6. **Create Admin User**
   ```bash
   node scripts/init-admin.js
   ```

7. **Configure Node.js App in cPanel**
   - Go to cPanel → Node.js Selector
   - Create a new application
   - Set the application root to your project directory
   - Set the application URL (e.g., `yourdomain.com`)
   - Set startup file to: `server.js` (you may need to create this)
   - Set Node.js version (recommended: 18.x or 20.x)

8. **Create server.js** (if needed)
   ```javascript
   const { createServer } = require('http')
   const { parse } = require('url')
   const next = require('next')

   const dev = process.env.NODE_ENV !== 'production'
   const hostname = 'localhost'
   const port = process.env.PORT || 3000

   const app = next({ dev, hostname, port })
   const handle = app.getRequestHandler()

   app.prepare().then(() => {
     createServer(async (req, res) => {
       try {
         const parsedUrl = parse(req.url, true)
         await handle(req, res, parsedUrl)
       } catch (err) {
         console.error('Error occurred handling', req.url, err)
         res.statusCode = 500
         res.end('internal server error')
       }
     }).listen(port, (err) => {
       if (err) throw err
       console.log(`> Ready on http://${hostname}:${port}`)
     })
   })
   ```

9. **Start the Application**
   - In cPanel Node.js Selector, click "Start" on your application
   - Or use PM2 if available: `pm2 start server.js`

10. **Set Up SSL Certificate** (Recommended)
    - Use HostGator's free SSL certificate (Let's Encrypt)
    - Configure in cPanel → SSL/TLS Status

### Alternative: Using HostGator's PHP/MySQL Setup

If Node.js is not available, you can:
1. Use HostGator's MySQL database
2. Keep Prisma with MySQL provider
3. Deploy as a static export (limited functionality) or use a different hosting solution

## Admin Login

1. Navigate to `/admin/login`
2. Enter your admin email and password (set in `.env` file)
3. After login, you'll be redirected to the admin dashboard

## Default Admin Credentials

After running `node scripts/init-admin.js`, use:
- **Email**: The value from `ADMIN_EMAIL` in your `.env` file
- **Password**: The value from `ADMIN_PASSWORD` in your `.env` file

**Important**: Change the default password immediately after first login!

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin panel pages
│   ├── api/               # API routes
│   ├── cart/              # Shopping cart page
│   ├── checkout/          # Checkout page
│   ├── contact/           # Contact page
│   ├── faq/               # FAQ page
│   ├── order-confirmation/ # Order confirmation page
│   ├── products/          # Product detail pages
│   ├── store/             # Store catalog page
│   └── page.tsx           # Home page
├── components/             # React components
├── lib/                    # Utility functions
├── prisma/                 # Database schema
├── scripts/                # Utility scripts
└── middleware.ts           # Auth middleware
```

## Database Schema

- **User**: Admin users
- **Product**: Store products
- **Order**: Customer orders
- **OrderItem**: Order line items
- **FAQ**: Frequently asked questions
- **Setting**: Site settings (key-value pairs)
- **Message**: Contact form submissions
- **DiscountCode**: Discount codes
- **CreatorCode**: Creator codes with revenue tracking

## Security Notes

- Admin routes are protected by authentication middleware
- Passwords are hashed using bcrypt
- Sessions are stored in memory (consider Redis for production)
- No public user registration (admin only)

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Support

For issues or questions, please contact the development team.

---

**Disclaimer**: All products are sold for laboratory research use only. Not for human consumption, medical use, veterinary use, or household use. These products are intended for research purposes in a controlled laboratory environment only.


