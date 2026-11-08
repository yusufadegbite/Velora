# VELORA — Drive Beyond Ordinary.

A full-stack premium automotive marketplace for **buying, reserving, comparing and renting** vehicles.
Built with Next.js 15 (App Router), TypeScript, Tailwind CSS 4, Framer Motion, PostgreSQL and Prisma.

---

## Quick start

**Prerequisites:** Node.js 20+ and PostgreSQL 14+ (or Docker, to run PostgreSQL with one command).

```bash
# 0. Start PostgreSQL (skip if you already have it running locally)
docker compose up -d

# 1. Install
npm install

# 2. Configure
cp .env.example .env          # then set DATABASE_URL and SESSION_SECRET (openssl rand -base64 48)

# 3. Database: migrations (incl. the rental overlap constraint) + realistic seed data
npx prisma generate
npx prisma migrate deploy
npm run db:seed

# 4. Run
npm run dev                   # http://localhost:3000
```

**Seeded accounts**

| Role | Email | Password |
|---|---|---|
| Admin | `yousuph15@gmail.com` (or `SEED_ADMIN_EMAIL`) | `Velora!Admin2026` (or `SEED_ADMIN_PASSWORD`) |
| Customer | `amara.okafor@example.com`, `tunde.bello@example.com`, … | `Customer123` |

> Change the seed admin password before deploying anywhere public.

**Scripts:** `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `db:migrate`, `db:deploy`, `db:seed`, `db:reset`.

---

## What's included

| Area | Features |
|---|---|
| **Homepage** | Cinematic hero (admin-managed banner), multi-field vehicle search, featured grid, brand collection, Why VELORA, Signature Collection carousel, latest arrivals, popular rentals, special offers, How it works (buy/rent tabs), testimonials, concierge CTA, newsletter |
| **Marketplace** `/cars` | Database-backed filters (brand, model, price, year, mileage, body, fuel, transmission, engine capacity, condition, availability), keyword search, 7 sort orders, pagination, removable filter chips, mobile filter drawer, optimistic URL state, empty states |
| **Vehicle details** `/cars/[slug]` | Gallery with thumbnails, swipe, keyboard & full-screen lightbox; key facts; grouped specification tables; wishlist; compare; enquiry modal; WhatsApp; Place Order / Reserve; reviews; related vehicles; `schema.org/Car` JSON-LD; dynamic metadata/Open Graph |
| **Brands** | `/brands` and `/brands/[slug]` listing pages |
| **Compare** `/compare` | Up to 4 vehicles, persistent tray across the site, "best in row" highlights, differences-only mode, save comparisons to the dashboard |
| **Rentals** `/rentals` | Fleet with daily/weekly/monthly rates; booking form with locations, dates, time, add-on services, live price estimate (cheapest tier combination), visible unavailable periods, policies & deposit info |
| **Checkout** `/checkout/[slug]` | Full payment (≤ ₦75M), 10% reservation deposit, or no-payment purchase enquiry; delivery/collection; billing; terms |
| **Auth** | Register, login, logout, forgot/reset password, optional Google OAuth (PKCE) |
| **Customer dashboard** | Overview stats & activity, orders (+ timeline, pay, cancel), rentals (+ pay, cancel), wishlist, saved comparisons, notifications, profile, security (password, active sessions) |
| **Admin console** `/admin` | KPI overview with revenue & status charts; vehicle CRUD with image upload/URLs, reorder, specs editor, featured toggle, archive/delete; brands; orders (status workflow, offline payment confirmation); rentals (approve/reject/activate/complete, availability blocks); customers (suspend, roles, activity log); enquiries; content (banners, offers, testimonials) |
| **SEO** | Dynamic metadata, canonical URLs, Open Graph, `sitemap.xml`, `robots.txt`, JSON-LD, SSR |

---

## Architecture

```
prisma/
  schema.prisma                 # normalized relational model (19 models)
  migrations/                   # init + rental_overlap_guard (raw SQL constraints)
  seed.ts                       # 10 brands, 32 vehicles, customers, orders, rentals, content
src/
  app/
    (site)/                     # public pages (navbar/footer layout, page transitions)
    (auth)/                     # login, register, forgot/reset password
    dashboard/                  # customer area (requireUser)
    admin/                      # admin console (requireAdmin)
    api/                        # Google OAuth, Paystack callback + webhook, admin upload
    sitemap.ts, robots.ts
  actions/                      # Server Actions: auth, engagement, commerce, account, admin
  components/
    ui/                         # Button, Field, Dialog, Toast, LoadingSkeleton, Reveal, Counter, …
    layout/                     # Navbar, Footer, PageHeader, WhatsApp
    vehicles/                   # VehicleCard, VehicleGrid, VehicleFilters, SearchBar, VehicleGallery,
                                # SpecificationTable, PriceDisplay, WishlistButton, CompareToggle
    rentals/                    # RentalBookingForm, RentalPolicies
    compare/                    # ComparisonTable, CompareProvider, CompareBar
    dashboard/                  # DashboardSidebar, StatCard, Timeline, PayButton
    admin/                      # AdminDataTable, VehicleForm, StatusControl, Charts, …
  lib/
    auth/                       # sessions, password hashing, tokens, Google OAuth
    services/                   # orders + payments, rentals (transactional business logic)
    pricing/                    # pure, unit-tested pricing (shared by UI estimate & server)
    payments/paystack.ts        # initialize / verify / webhook signature
    data/vehicles.ts            # catalogue queries & DTO mapping
    validation.ts               # Zod schemas
    email.ts, cloudinary.ts, rate-limit.ts, notify.ts, env.ts, site.ts
  middleware.ts                 # fast session-cookie gate for protected routes
tests/                          # node:test suites (pricing, security, concurrency, payments)
```

**Principles**
- **Server is the source of truth.** Prices, deposits, rental totals, extras, availability and payment status are all computed or verified server-side. Checkout forms contain no price fields; unknown add-on codes are dropped.
- **Server Components by default**, Client Components only for interactivity. Mutations use Server Actions with Zod validation; route handlers are used only for OAuth, Paystack and uploads.
- **Pure pricing modules** (`lib/pricing`) give the booking form instant estimates and the server the same rules.

---

## Data integrity & concurrency

- **Rental double-booking** is prevented at three levels:
  1. the booking transaction locks the vehicle row (`SELECT … FOR UPDATE`), so concurrent requests for the same car run one after another;
  2. overlaps with active bookings (`PENDING`, `CONFIRMED`, `ACTIVE`) and admin availability blocks are checked inside that transaction;
  3. a PostgreSQL **exclusion constraint** (`btree_gist`, `tsrange(pickupAt, returnAt, '[)')`) makes overlapping active bookings impossible at the database level. Back-to-back bookings are allowed.
- **Orders** are created in a transaction with the vehicle row locked. A deposit/full-payment order holds the vehicle for 30 minutes, which blocks other customers from paying for the same car at the same time.
- **Payment confirmation** is idempotent (a conditional `updateMany` on the payment status). The browser callback and the webhook can race safely, and side effects such as notifications and emails run exactly once.
- Check constraints cover date ranges, review ratings and positive prices.

## Security

- Passwords hashed with **bcrypt (cost 12)**. Login runs in constant time whether or not the email exists, and password-reset responses don't reveal which accounts exist.
- **DB-backed sessions**: random 256-bit token in an `httpOnly`, `SameSite=Lax`, `Secure` (prod) cookie; only the SHA-256 hash is stored. Sliding expiry, per-device revocation, and password changes sign out other sessions.
- **RBAC**: `requireUser` / `requireAdmin` in layouts, `assertAdmin` in every admin action and route. Customer queries are always scoped by `userId`, so other users' orders return not-found.
- **Rate limiting** on login (per IP and per email), registration, password reset, enquiries, newsletter, checkout, booking, payment and uploads.
- **Paystack webhook**: HMAC-SHA512 signature verified with a timing-safe comparison, then the transaction is **re-verified with the Paystack API**. Amount and currency must match the server-side record exactly.
- **Uploads**: admin-only. Type is checked by magic bytes (JPEG/PNG/WebP/AVIF, not just the extension), with a size limit and signed server-side Cloudinary upload.
- Safe `next` redirects (no open redirects), honeypot on contact forms, security headers (HSTS, `nosniff`, frame deny, referrer and permissions policy), escaped JSON-LD, built-in Origin checks on Server Actions, and no secrets in client bundles.

---

## Integrations

Every external service is optional. When it isn't configured, the app tells the user plainly; it never pretends the call succeeded.

| Service | Env vars | Without credentials |
|---|---|---|
| **Paystack** | `PAYSTACK_SECRET_KEY`, `PAYMENT_CURRENCY` | Orders are still created, but stay **Awaiting Payment**; checkout and order pages explain that online payment is unavailable. Admins can record **offline** payments (a reference note is required). |
| **Email (Resend)** | `RESEND_API_KEY`, `EMAIL_FROM` | Emails are written to the server log (reset links included, for local testing). |
| **Cloudinary** | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | The upload button is disabled; admins paste HTTPS image URLs. |
| **Google sign-in** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | The Google button is hidden. |
| **WhatsApp** | `NEXT_PUBLIC_WHATSAPP_NUMBER` | Uses the placeholder number. |

**Paystack setup:** set the webhook URL to `https://<your-domain>/api/payments/paystack/webhook` in the Paystack dashboard. The callback URL (`/api/payments/paystack/callback`) is sent automatically with each transaction.
**Google setup:** add `https://<your-domain>/api/auth/google/callback` as an authorised redirect URI.
Swapping in Flutterwave means implementing the same three functions as `lib/payments/paystack.ts`.

---

## Testing

```bash
npm test          # requires a migrated + seeded database
```

- **Pricing**: daily/weekly/monthly tiering, Lagos timezone handling, extras, deposits and payment-option limits.
- **Security**: webhook signature verification, filter sanitisation, no client-supplied prices in checkout, password policy.
- **Concurrency** (real DB): 8 simultaneous overlapping bookings, exactly 1 succeeds; the exclusion constraint rejects overlaps directly.
- **Payments** (real DB, stubbed Paystack): success confirms and reserves (idempotent under a callback/webhook race), amount mismatch is rejected, and failed or abandoned charges never confirm an order.

End-to-end flows (register → filter → wishlist → compare/save → rental booking → checkout → cancel → admin approval → access control) were exercised with Playwright during development.

---

## Notes & next steps

- **Seed photography** uses Unsplash URLs as illustrative placeholders and may not match each exact model. Replace them with real stock photos from the admin console. Any image that fails to load shows a branded fallback.
- The rate limiter is in-memory (single instance). For multiple instances, swap in Redis/Upstash behind the same `rateLimit()` interface.
- Legal copy (`/terms`, `/privacy`) is a development summary and needs legal review before launch.
- Suggested next steps: email verification on sign-up, Flutterwave adapter, saved searches and price-drop alerts, and a test-drive booking calendar.
