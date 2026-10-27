# NSUKart

**Your Campus. Your Marketplace.**

A mobile-first multi-vendor marketplace for the Nasarawa State University, Keffi community. Built with **Next.js, React, TypeScript, Tailwind CSS, shadcn-style components, Supabase PostgreSQL/Auth/Storage, Paystack, and Resend**. No PHP.

## Release status

This is a runnable initial implementation, not a claim of completed production certification. The storefront works without credentials and clearly shows a setup/empty state. Accounts, listings, financial workflows and private dashboards use real Supabase data after configuration. There is no fake payment success or demonstration business database.

Live services were **not provisioned** during development. See [readiness](docs/READINESS.md) for tested functionality, limitations, and launch blockers. Refunds and payouts are operator-assisted; this release does not automatically transfer vendor funds or execute provider refunds.

## Quick start

Requirements: Node.js 22 or newer, npm, and a Supabase project.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Visit `http://localhost:3000`. The homepage, auth forms, marketplace, help, and setup pages render before integration credentials are supplied. Private pages redirect to setup or login rather than inventing authenticated sessions.

### Database and storage

In a new Supabase project, apply these migrations **in order** through the SQL editor or the Supabase CLI:

1. `supabase/migrations/202610270001_marketplace.sql`
2. `supabase/migrations/202610270002_operations.sql`

The migrations create the profile trigger, stores, products, carts, orders, suborders, reservations, messages, reviews, disputes, notifications, email outbox, ledger, withdrawals, audit records, RLS policies, transaction functions, rate limits, and product-image storage bucket.

Use a fresh project or review migrations before applying to an existing database. Do not bypass RLS or expose the service-role key to clients. No default administrator or sample accounts are seeded.

### Environment variables

| Variable                        | Purpose                                                           | Exposure                 |
| ------------------------------- | ----------------------------------------------------------------- | ------------------------ |
| `NEXT_PUBLIC_APP_URL`           | Canonical app origin, including protocol                          | Public                   |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                                              | Public                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key                                          | Public; protected by RLS |
| `SUPABASE_SERVICE_ROLE_KEY`     | Payment reconciliation, outbox worker, administrator provisioning | Server only              |
| `PAYSTACK_SECRET_KEY`           | Initialize and verify transactions, verify webhook signatures     | Server only              |
| `RESEND_API_KEY`                | Deliver transactional email                                       | Server only              |
| `EMAIL_FROM`                    | Sender on a verified Resend domain                                | Server configuration     |
| `CRON_SECRET`                   | Strong random bearer secret for background jobs                   | Server only              |

Never commit `.env.local`. `.env.example` contains names and placeholders only.

### Authentication

In Supabase Auth:

- Enable email confirmation.
- Set the Site URL to `NEXT_PUBLIC_APP_URL`.
- Allow the exact `/auth/callback` redirect URL for local and deployed environments.
- Set custom SMTP credentials for a verified sender. Resend SMTP can deliver Supabase verification and reset emails. The application Resend API queue handles order notifications separately.
- Review authentication rate limits and enable breached-password protection where available.
- Enable TOTP MFA. Administrators must enrol and establish an AAL2 session at `/account/security`.

Users sign up as buyers. They cannot set a role through profile metadata. Vendor approval is a platform decision; matriculation-number collection is not official university verification.

### Provision an administrator

Create an account through the normal signup flow and confirm its email first. Load `.env.local` for this one server-side command:

```bash
node --env-file=.env.local scripts/provision-admin.mjs you@example.com
```

The script promotes an existing verified account. It never creates a shared password. Sign in, visit `/account/security`, and complete authenticator verification before opening `/admin`.

### Payments

Use Paystack test credentials first. Configure this webhook URL in Paystack:

```text
https://YOUR_DOMAIN/api/payments/webhook
```

The application initializes NGN transactions from server-computed totals. Callbacks and signed webhooks verify transactions with Paystack before calling a service-role-only database transaction. Reference, amount, and currency must match. Duplicate successful events do not decrement inventory twice.

Checkout holds stock for 20 minutes. A protected worker expires reservations. A payment confirmed after expiry becomes `refund_required`, never a fake successful order. Operators must arrange and reconcile the refund through the provider.

A parent order contains independent vendor suborders and immutable item prices. A 5% commission is snapshotted at checkout. It is currently fixed in the SQL migration; change it through a reviewed migration before launch if needed. There is no hidden customer delivery fee.

### Background jobs

Schedule an authenticated **GET** request to `/api/jobs`, ideally every minute:

```http
Authorization: Bearer YOUR_CRON_SECRET
```

The worker rotates pending/expired payment reconciliation, expires reservations, claims email outbox jobs with database locks, and retries failures with backoff. Configure a plan-appropriate scheduler; Vercel Cron is an option, but no paid schedule is provisioned automatically. Match runtime limits to payment-provider latency and batch sizes before launch.

Jobs persist in PostgreSQL across server restarts. Emails use stable Resend idempotency keys. Failed jobs remain inspectable in `email_jobs`. Operators should monitor and resolve dead-letter jobs. Do not retry an old email automatically outside Resend's idempotency retention without reviewing whether it was delivered.

### Vendor workflow

1. Sign up and verify your buyer account.
2. Submit `/vendor/apply` with a store name, unique URL slug, description, and pickup information.
3. An MFA-verified administrator approves the application.
4. Add listings and images at `/vendor/products`.
5. Accept paid orders and mark them ready for pickup.
6. The buyer confirms receipt using the order code. Net earnings are credited once.
7. Request a withdrawal. An operator verifies details and records externally confirmed settlement.

Uploading requires an approved vendor, a maximum 5 MB image, accepted magic bytes and MIME type, and a vendor-owned storage path. Advanced image re-encoding, metadata stripping and malware scanning remain launch-hardening items.

## Main routes

| Route                                 | Behaviour                                                |
| ------------------------------------- | -------------------------------------------------------- |
| `/`                                   | Campus storefront and live latest listings               |
| `/marketplace`                        | Search, category filtering and sorting                   |
| `/products/[id]`                      | Product detail, cart, saved item, purchase reviews       |
| `/stores`, `/stores/[slug]`           | Approved vendor directory and stores                     |
| `/login`, `/signup`                   | Supabase-backed account workflows                        |
| `/reset-password`, `/update-password` | Secure password-reset workflow                           |
| `/cart`, `/checkout`                  | Persistent cart and vendor-grouped checkout              |
| `/dashboard`                          | Buyer overview                                           |
| `/dashboard/orders`                   | Orders, messages, pickup confirmation, disputes, reviews |
| `/dashboard/wishlist`                 | Saved listings                                           |
| `/dashboard/notifications`            | Transactional updates and mark-read action               |
| `/dashboard/account`                  | Whitelisted profile edits                                |
| `/vendor`                             | Vendor overview, products, orders and earnings           |
| `/admin`                              | MFA-gated operations dashboard                           |
| `/api/admin/export`                   | MFA-gated order CSV export                               |
| `/api/health`                         | Non-secret application health response                   |

All navigation adapts to mobile. Account, vendor, and admin views have a collapsible navigation panel on small screens. No native mobile app or offline payment flow is included.

## Development and tests

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

`npm run check` runs lint, TypeScript, unit/database tests, and production build. CI also runs browser checks on desktop Chromium and mobile Chromium emulation.

The database tests apply the actual migrations inside PGlite and exercise PostgreSQL RLS, permission grants, stock reservations, payment idempotency, fulfilment, and the earnings ledger. They are not a substitute for testing hosted Supabase Auth/Storage or real Paystack/Resend sandboxes. See `docs/VALIDATION.md`.

A restricted environment can point browser tests at a compatible installed Chromium through `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

## Deploy

1. Push this source to your GitHub repository.
2. Import the repository into Vercel as a Next.js project.
3. Provision/configure Supabase, Resend and Paystack in the intended environment.
4. Add the environment variables before building the deployment.
5. Update the canonical origin and authentication redirect allowlist.
6. Configure Paystack webhooks and the protected background scheduler.
7. Provision the admin, enable MFA, and run the sandbox acceptance checklist.
8. Finalize marketplace policies and operator contact details before allowing public transactions.

Rebuild after changing public environment variables. Use separate database projects and provider credentials for preview/test and production. Never point untrusted pull-request previews at the production service-role key.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Readiness and scope](docs/READINESS.md)
- [Validation](docs/VALIDATION.md)
- [Operational runbook](docs/OPERATIONS.md)

Official integration references:
[Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client),
[Paystack webhooks](https://paystack.com/docs/payments/webhooks/),
[Resend email API](https://resend.com/docs/api-reference/emails/send-email),
[Next.js deployment](https://nextjs.org/docs/app/getting-started/deploying).
