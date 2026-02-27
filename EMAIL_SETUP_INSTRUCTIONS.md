# Email Setup Instructions for Moon Beauty Alchemy

## Quick Setup Guide

### Step 1: Verify Domain with Resend

1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Navigate to **Domains** → **Add Domain**
3. Enter: `moonbeautyalchemy.com`
4. Add the DNS records Resend provides to your domain's DNS settings
5. Wait for verification (usually a few minutes)

### Step 2: Configure Email Settings in Admin Panel

1. Log in to Admin Panel: `/admin/login`
2. Go to **Settings**: `/admin/settings`
3. Set the following:

   **From Email:**
   - Enter: `support@moonbeautyalchemy.com`
   - This is what customers will see as the sender
   - Must be verified with Resend first

   **Contact Email:**
   - Enter: `ace.mc.owner@gmail.com`
   - All contact form submissions and notifications will be sent here

4. Click **Save Settings**

### Step 3: Verify Resend API Key is Set

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Make sure `RESEND_API_KEY` is set with your Resend API key
3. If not set, add it now

## How It Works

- **Customer Emails** (Order confirmations, status updates, shipping notifications):
- **From:** support@moonbeautyalchemy.com
  - **To:** Customer's email address

- **Contact Form Submissions:**
- **From:** support@moonbeautyalchemy.com
  - **To:** ace.mc.owner@gmail.com
  - **Reply-To:** Customer's email (so you can reply directly)

- **Order Notifications:**
  - All order-related emails are sent to customers
  - You can view orders in the Admin Panel

## Testing

1. After setup, test by:
   - Submitting the contact form
   - Placing a test order
   - Checking that emails arrive at ace.mc.owner@gmail.com

## Troubleshooting

**Emails not sending?**
- Check that `RESEND_API_KEY` is set in Vercel
- Verify domain is verified in Resend dashboard
- Check Resend dashboard for error logs

**Domain not verified?**
- Make sure DNS records are added correctly
- Wait a few minutes for DNS propagation
- Check Resend dashboard for verification status

**Using test mode?**
- If domain isn't verified yet, you can use `onboarding@resend.dev` temporarily
- Limited to 100 emails/day
- Update to `support@moonbeautyalchemy.com` once domain is verified

