# Email Setup Guide

This guide explains how to set up email functionality for your Moon Beauty Alchemy website.

## Features

✅ **Contact Form Emails** - Contact form submissions are emailed to the admin  
✅ **Order Confirmation Emails** - Customers receive confirmation when they place an order  
✅ **Order Status Updates** - Customers receive emails when order status changes (PAID, SHIPPED, etc.)  
✅ **Tracking Numbers** - Add tracking numbers when marking orders as shipped, customers receive them via email  

## Setup Instructions

### 1. Sign Up for Resend

1. Go to [resend.com](https://resend.com) and sign up for a free account
2. The free tier includes 3,000 emails/month and 100 emails/day

### 2. Get Your API Key

1. Go to Resend Dashboard → API Keys
2. Create a new API key
3. Copy the API key (starts with `re_...`)

### 3. Add API Key to Vercel

1. Go to your Vercel project → Settings → Environment Variables
2. Add a new variable:
   - **Key**: `RESEND_API_KEY`
   - **Value**: Your Resend API key (e.g., `re_abc123...`)
   - **Environments**: Select all (Production, Preview, Development)
3. Click **Save**

### 4. Verify Your Email Domain (Optional but Recommended)

**Option A: Use Resend's Test Domain (Quick Start)**
- You can use `onboarding@resend.dev` for testing
- Limited to 100 emails/day
- Good for development/testing

**Option B: Verify Your Own Domain (Production)**
1. In Resend Dashboard → Domains → Add Domain
2. Add your domain (e.g., `moonbeautyalchemy.com`)
3. Add the DNS records Resend provides to your domain
4. Wait for verification (usually a few minutes)
5. Once verified, you can use emails like `noreply@moonbeautyalchemy.com`

### 5. Configure Email Settings in Admin Panel

1. Log in to your admin panel at `/admin/login`
2. Go to **Settings** (`/admin/settings`)
3. Configure:
   - **Contact Email**: Where contact form submissions are sent (e.g., `admin@moonbeautyalchemy.com`)
   - **From Email**: The email address that sends emails to customers (must be verified with Resend)
     - For testing: `onboarding@resend.dev`
     - For production: `noreply@yourdomain.com` or `orders@yourdomain.com` (after domain verification)
     - **This is the "from" address customers will see** for:
       - Order confirmation emails
       - Order status update emails
       - Shipping notifications
4. Click **Save Settings**

**Important**: The "From Email" must be verified with Resend before it can be used. If you haven't verified your domain, use `onboarding@resend.dev` for testing (limited to 100 emails/day).

### 6. Update Database Schema

After adding the `trackingNumber` field, run:

```bash
npx prisma db push
```

Or if using migrations:

```bash
npx prisma migrate dev --name add_tracking_number
```

## How It Works

### Contact Form
- When someone submits the contact form, the message is:
  1. Saved to the database
  2. Emailed to the **Contact Email** address you configured

### Order Confirmation
- When a customer places an order, they automatically receive:
  - Order confirmation email with order details
  - Payment instructions
  - Link to track their order

### Order Status Updates
- When you update an order status in the admin panel:
  - **PAID**: Customer receives "Payment Received" email
  - **SHIPPED**: Customer receives "Order Shipped" email with tracking number (if provided)
  - **CANCELED**: Customer receives cancellation notification

### Tracking Numbers
- When marking an order as **SHIPPED**:
  1. A tracking number input field appears
  2. Enter the tracking number (e.g., `1Z999AA10123456784`)
  3. Click "Update Status"
  4. Customer automatically receives an email with the tracking number

## Environment Variables

Add these to your Vercel project:

```
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=noreply@yourdomain.com  # Optional, can also set in admin settings
ADMIN_EMAIL=admin@yourdomain.com   # Optional, can also set in admin settings
NEXT_PUBLIC_SITE_URL=https://yourdomain.com  # For email links
```

## Testing

1. **Test Contact Form**:
   - Submit the contact form on your site
   - Check your Contact Email inbox

2. **Test Order Confirmation**:
   - Place a test order
   - Check the customer's email inbox

3. **Test Order Updates**:
   - Update an order status in admin panel
   - Check the customer's email inbox

## Troubleshooting

**Emails not sending?**
- Check that `RESEND_API_KEY` is set in Vercel environment variables
- Verify your "From Email" is correct in admin settings
- Check Resend dashboard for error logs
- Make sure you haven't exceeded Resend's rate limits

**"From Email" not working?**
- For production, you must verify your domain with Resend
- For testing, use `onboarding@resend.dev`
- Check Resend dashboard → Domains to see verification status

**Tracking numbers not showing?**
- Make sure you've run `npx prisma db push` after the schema update
- Check that the tracking number field is saved when updating order status

## Support

- Resend Documentation: https://resend.com/docs
- Resend Support: support@resend.com

