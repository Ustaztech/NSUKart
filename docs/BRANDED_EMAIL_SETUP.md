# NSUKart branded onboarding notifications

## Supabase Auth setting — action required

In the Supabase project dashboard go to **Authentication → Providers → Email**, disable **Confirm email**, and save. This setting is managed by Supabase: application code alone cannot disable mandatory confirmation. **Keep email/password authentication, secure password recovery, and rate limits enabled.** Disabling confirmation allows unverified email ownership, increasing the risk of fake accounts. Consider CAPTCHA, abuse monitoring and rate limiting.

Set the Supabase Auth Site URL to `https://ustaztech-nsukart.vercel.app` and keep `https://ustaztech-nsukart.vercel.app/auth/callback` in the allowed redirect URLs for password recovery.

## Database migration — action required

After the existing migrations, run `supabase/migrations/202610270003_lifecycle_email.sql` once in Supabase SQL editor or CLI. It queues a welcome message when a new profile is created, and a store-submitted notification when a store is created. The existing admin store-review and order status notifications are preserved. Email sending failures must not abort signup or store creation.

## Resend and scheduler

Set server-side `RESEND_API_KEY`, a verified-domain `EMAIL_FROM`, `SUPABASE_SERVICE_ROLE_KEY`, and `CRON_SECRET` in Vercel production environment. Set `NEXT_PUBLIC_APP_URL=https://ustaztech-nsukart.vercel.app`. Redeploy to apply changes. Never expose secret values to browser code or Git.

Schedule authorized `GET /api/jobs` with `Authorization: Bearer <CRON_SECRET>` to deliver the queued HTML emails. Do not manually trigger the job from the public client. Emails include plain-text fallback. The worker uses idempotency keys and retries.

## Acceptance checks

1. Register a new account and verify immediate login without a confirmation link.
2. Inspect `email_jobs` for a welcome email and verify exactly one successful delivery.
3. Submit a vendor store and verify a store-created email is queued/delivered; application remains pending approval.
4. Approve/reject a store as MFA-authenticated admin and verify an updated-status email.
5. Verify order lifecycle emails, password-reset link validity, and no duplicate emails on retries.
6. Check HTML display on Gmail/mobile; inspect Resend domain health, sender reputation and delivery logs.

Do not disable password recovery. Do not put Resend API keys in code, comments or client-side environment variables.
