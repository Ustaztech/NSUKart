# Readiness and scope

## Implemented

- Responsive emerald/gold storefront; mobile bottom navigation; separate desktop/mobile layouts.
- Login, email confirmation callback, registration, password reset and password update.
- Supabase SSR session refresh, server-side account checks, private profile edits.
- Protected buyer/vendor/admin roles, account suspension, required admin TOTP MFA.
- Vendor application and approval/rejection/suspension with audit history.
- Product creation, editing, inventory, service listings, image upload, admin archival.
- Public stores, category search, price sorting, product details and saved items.
- Persistent cart, atomic checkout, multi-vendor suborders, item-price snapshots.
- Stock reservations, expiry, server payment verification, signed Paystack webhooks and duplicate-event protection.
- Buyer orders, vendor progress, order-linked messages and buyer pickup confirmation.
- Verified-purchase reviews and pre-completion disputes.
- Persistent notifications and retryable Resend email outbox.
- Earnings ledger, reserved withdrawal requests and operator-recorded settlement.
- Admin operational views, CSV export, listing moderation, dispute decisions and audit records.
- Source code, migrations, tests, setup guide, CI and operational guidance.

## Requires external configuration and validation

- Supabase project, migrations, auth emails, redirect allowlist and storage setup.
- Verified Resend domain and API key; Supabase SMTP settings for auth email.
- Paystack sandbox account and provider-approved production arrangement.
- Protected scheduler and failed-job monitoring.
- Hosting, canonical domain, secrets, backups, monitoring and restore verification.
- Hosted end-to-end testing with separate buyer, vendor, admin and attacker accounts.
- Final operator identity, contact details, refund policy and privacy retention schedule.

## Remaining features and hardening

This implementation is not the entire long-term specification. The following are not represented as complete:

- Flutterwave, provider-automated refunds, partial refunds, automatic payouts and payout reconciliation.
- University identity API integration, verification-document collection and staff/external-vendor onboarding variants.
- Configurable commission UI, variants, multi-image galleries, discount/coupon management, category administration and low-stock email notifications.
- Vendor resubmission after rejection, vendor responses to reviews, listing/review reporting and review moderation UI.
- Service-specific fulfilment states, cancellation workflows, post-completion dispute/refund policy and attachments.
- Search pagination, price-range/condition/rating filters, analytics date ranges, full historical exports and advanced reporting.
- Rich store branding, following, order delivery routing and GPS tracking.
- Marketing subscriptions, browser push, notification preferences and native mobile applications.
- Automated account deletion/anonymization, data export, rate-limit-row retention, full error monitoring, image re-encoding and malware scanning.
- Strict nonce-based CSP; current production policy permits inline scripts required by this initial Next.js integration.
- Accessibility audit, performance load tests and independent security review.

These are launch-planning items, not silently simulated features. Do not present the app as a certified production payment platform until the relevant operational and financial requirements have been completed and verified.
