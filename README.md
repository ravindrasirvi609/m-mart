# Mmart - Full Stack Grocery Store (Next.js + Supabase)

Production-ready grocery e-commerce application for **Mmart** with:
- User-side store, cart, checkout with UPI screenshot upload.
- Manual payment verification workflow.
- Admin dashboard for products, categories, and orders.
- Supabase Auth (Email OTP), PostgreSQL, and Realtime status updates.
- Resend email notifications for customer and admin.

## Store Details

- Store: **Mmart**
- Owner: **Naveen Sirvi**
- Location: **Mukai Nagar, Hinjewadi Phase 1, Pune, Maharashtra**
- Contact: **8955872627**
- Payment: **UPI QR + Manual Verification**

## Tech Stack

- Next.js 16 (App Router)
- Tailwind CSS
- Supabase (Auth + Postgres + Storage + Realtime)
- Resend (email)

## Folder Structure

- `app/(auth)` - login and auth callback
- `app/(store)` - storefront, products, cart, checkout, profile, orders
- `app/(admin)` - protected admin panel
- `app/api` - API routes (health check)
- `components` - reusable UI and feature components
- `lib` - shared helpers, Supabase clients, auth/query utilities
- `actions` - server actions for writes
- `supabase/schema.sql` - database schema, RLS, function, and bucket setup

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Fill `.env.local` values:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `RESEND_API_KEY` (optional but recommended)
- `RESEND_FROM_EMAIL` (optional)

4. Apply SQL in Supabase SQL Editor:
- Open `supabase/schema.sql`
- Run the full script
- Add your admin email to `public.admin_users`

5. Configure Supabase Auth:
- Enable Email OTP login
- Set site URL and redirect URL: `http://localhost:3000/auth/callback`

6. Run development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Payment Flow

1. User checks out and pays through static UPI QR.
2. User uploads screenshot.
3. Order is created with:
- `payment_status = pending_verification`
- `order_status = pending`
4. Admin reviews screenshot and updates payment/order status.

## Features Implemented

### User Side
- Email OTP login
- Homepage with banner, categories, featured products, location, call CTA
- Product listing with search debounce, category filter, pagination
- Product detail page
- Cart with quantity controls and delivery charge logic
- Checkout with UPI QR, screenshot upload, and place order
- Profile management (name/phone/address)
- Order history with realtime status updates
- Dark mode toggle

### Admin Side
- Protected admin routes (admin email only)
- Dashboard metrics (orders, pending payments, revenue, low-stock)
- Category and product management
- Product image upload support
- Order management and status updates
- Payment screenshot viewing

### Security and Performance
- DB writes through Server Actions
- Role checks for admin actions
- Screenshot and image upload validation
- RLS policies and transactional order function in Supabase
- Optimized images with Next/Image
- Loading skeletons and error boundaries

## Deployment Notes

- Deploy on Vercel or any Node-compatible platform.
- Ensure all env vars are set in deployment settings.
- Add production domain to Supabase auth redirect URLs.
- Configure Resend verified sender domain for reliable email delivery.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
