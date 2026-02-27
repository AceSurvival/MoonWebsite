# Launch Checklist - Moon Beauty Alchemy

## Statistics System ✅

**IMPORTANT - How it works:**
- Statistics **ONLY** count orders with status **'PAID'**
- When an order is created, it starts as **'PENDING_PAYMENT'**
- **You must manually mark orders as 'PAID' in the admin panel** for them to appear in statistics
- This is correct business behavior - only count revenue when payment is actually received

**Why your order didn't show in statistics:**
- Order was created with status: **PENDING_PAYMENT** ✅
- Statistics only count: **PAID** orders ❌
- **Solution:** Go to Admin Panel → Orders → Find your order → Change status to **PAID**

**To see an order in statistics:**
1. Order is created → Status: PENDING_PAYMENT (default)
2. Customer pays → You mark order as **PAID** in Admin Panel → Orders → [Order ID] → Update Status
3. Order now appears in statistics ✅

**Statistics include:**
- YTD Revenue (Year to Date)
- This Month Revenue
- All-Time Revenue
- Average Order Value
- Monthly Breakdown
- Top Selling Products

## Discount Codes ✅

**Validation:**
- ✅ Checks if code exists
- ✅ Checks if code is active
- ✅ Checks if code has expired (expiryDate)
- ✅ Case-insensitive (automatically uppercased)
- ✅ Applied to order total correctly

**How to test:**
1. Create a discount code in Admin Panel
2. Set discount percentage (e.g., 25%)
3. Set expiry date (optional)
4. Mark as active
5. Use code at checkout - should apply discount

## Creator Codes ✅

**Validation:**
- ✅ Checks if code exists
- ✅ Checks if code is active
- ✅ Case-insensitive (automatically uppercased)
- ✅ Creates usage record when order is placed
- ✅ Tracks revenue amount for creator
- ⚠️ **Note:** Creator codes don't have expiry dates (by design)

**How it works:**
1. Customer enters code at checkout
2. If not a discount code, system checks if it's a creator code
3. If valid creator code, applies discount
4. Creates CreatorCodeUsage record linking code to order
5. Tracks revenue amount for creator

**To test:**
1. Create a creator code in Admin Panel
2. Set discount percentage
3. Mark as active
4. Use code at checkout - should apply discount
5. Check creator code page - should show usage

## Order Flow ✅

**Order Statuses:**
1. **PENDING_PAYMENT** - Order created, waiting for payment
2. **PAID** - Payment received, stock reduced, appears in statistics
3. **SHIPPED** - Order shipped, tracking number can be added
4. **CANCELED** - Order canceled

**Stock Management:**
- Stock is reduced when order status changes to **PAID**
- Only products with stock tracking (stock !== null) are affected
- Backorders allowed (stock can go negative)

**Email Notifications:**
- ✅ Order confirmation sent when order is created
- ✅ Status update emails sent when order status changes
- ✅ Shipping notification with tracking when marked as SHIPPED

## Background Consistency ✅

- ✅ Store page background matches Featured Products section
- Both use: `bg-gradient-to-b from-white via-pink-50/30 to-gray-50`

## Testing Checklist

### Before Launch:

- [ ] Test creating a discount code and applying it at checkout
- [ ] Test creating a creator code and applying it at checkout
- [ ] Test order creation and verify it starts as PENDING_PAYMENT
- [ ] Mark an order as PAID and verify it appears in statistics
- [ ] Test shipping calculation (flat rate and distance-based)
- [ ] Test free shipping threshold
- [ ] Verify email notifications are working
- [ ] Test contact form submission
- [ ] Verify logo image displays correctly
- [ ] Test all navigation buttons
- [ ] Verify MOTD and promo banners display
- [ ] Test product pages and cart functionality
- [ ] Verify stock reduction when order marked as PAID

## Known Behavior

**Statistics:**
- Only counts PAID orders (this is correct!)
- Orders must be manually marked as PAID in admin panel
- This ensures accurate revenue tracking

**Discount Codes:**
- Can have expiry dates
- Must be active to work
- Case-insensitive

**Creator Codes:**
- No expiry dates (by design)
- Must be active to work
- Case-insensitive
- Tracks usage and revenue

