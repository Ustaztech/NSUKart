# Operational runbook

## Launch

1. Use isolated test services and complete the acceptance tasks in `VALIDATION.md`.
2. Review RLS and function grants in hosted Supabase.
3. Confirm MFA on every admin, no shared credentials, and no secrets in client bundles.
4. Confirm payment webhook retries and the protected scheduler are actually running.
5. Verify the sender domain and email delivery from real order events.
6. Finalize policies, support contacts and financial settlement arrangements.
7. Enable database backups with retention appropriate to the operator, then test a restore into an isolated project.

## Reconciliation

- Review `refund_required` orders daily. Verify the original transaction in Paystack before executing any refund.
- Examine failed `email_jobs`; confirm whether the message reached Resend before manual replay.
- Verify each withdrawal beneficiary out of band. Move requested withdrawals to processing before paying externally, then record the provider-confirmed reference.
- Never reject a processing withdrawal without investigating whether money was already transferred.
- Compare provider settlements, paid orders, ledger balances and recorded payouts. Local status alone is not evidence of bank settlement.
- Investigate held orders whose payments are pending for longer than expected.

## Backup and restore

Use Supabase backup/PITR facilities according to the selected plan. Back up product storage separately where required. A database-only restore does not restore deleted storage objects. Keep configuration and SMTP/payment settings in the operator's secret manager.

Perform a restore drill in an isolated project: restore the database, restore required objects, apply the same access policies, verify roles and representative order/ledger totals, and run sandbox acceptance tests. Never send restored test emails or payments through production credentials.

## Deployment rollback

Keep the last known-good Git commit and deployment. Roll back application deployments using the hosting platform. Review database compatibility before rolling back code: do not blindly reverse financial migrations or remove ledger history. Use additive database migrations and a maintenance window for changes that affect order processing.

## Incident response

Suspend the affected account/store when needed. Preserve audit and financial records. Rotate any exposed service credentials, revoke affected sessions and review unauthorized actions. Do not log card data or secrets. Consult payment-provider records when local and provider states disagree.

## Scaling

Monitor worker duration, queue depth, retry counts, reservations, payment failures and late-payment rates. The default worker processes bounded batches; tune scheduling and function duration to actual provider latency. Add durable orchestration or split payment and email workers before exceeding invocation limits.
