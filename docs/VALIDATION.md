# Validation

Development validation date: 27 October 2026.

## Automated checks

- ESLint: passed with no warnings before final packaging.
- TypeScript: passed.
- Production Next.js build: passed.
- Unit/database tests: 20 passed.
- Browser checks: 6 passed, covering desktop Chromium and mobile Chromium emulation.
- npm dependency audit: zero reported vulnerabilities at validation time; rerun before release.

The normal browser download was unavailable in the build environment. Browser tests used a locally unpacked Chromium 153 from the `@sparticuz/chromium` package. That package/binary is not part of application source; CI installs its own standard Playwright Chromium.

## Database tests

The actual migrations are applied to PGlite with minimal auth/storage test schemas. Tests verify:

1. A buyer cannot grant themselves administrator privileges.
2. Checkout creates one reservation and reuses a still-pending checkout.
3. Another checkout cannot buy the last reserved item.
4. Another buyer cannot read private orders or order items.
5. Authenticated clients cannot invoke the service-only payment confirmation function.
6. Wrong amounts fail and duplicate valid confirmations have one effect.
7. Only buyer confirmation with the correct code completes a ready suborder and credits net earnings once.
8. A reserved withdrawal cannot spend the same available balance again.
9. Vendor settlement actions require administrator role and MFA.
10. Withdrawal rejection reverses the reservation only once.
11. Late payment after expiry records refund-required without selling released stock.

Unit tests verify webhook signature handling, cron authorization, auth redirect validation, form validation, and money formatting.

Browser tests verify the public home/search/login/signup paths, absence of horizontal overflow at desktop and mobile sizes, and fail-closed private routes without configuration. They do not validate live provider credentials or bank settlement.

## Hosted acceptance checklist — pending

- Register buyer A and buyer B with real test email accounts; confirm verification links and reset-password links work exactly once and expire appropriately.
- Provision an admin and verify that administrator functions reject AAL1 and accept AAL2 sessions.
- Apply as vendor A and vendor B; approve each through the admin account.
- Confirm suspended vendors cannot add products, and their store is hidden from public sales.
- Upload valid JPG/PNG/WebP images; reject oversized or invalid uploads.
- Buy from two vendors in one checkout. Confirm each vendor sees only their suborder and order messages.
- Complete Paystack sandbox payment. Replay webhook and callback; confirm no double stock deduction or ledger credit.
- Attempt wrong amounts, forged signatures, unknown references and expired reservations.
- Confirm vendor acceptance/ready states, buyer-only receipt confirmation, review eligibility and dispute blocking.
- Confirm queued notifications reach buyer and vendor through the configured email provider.
- Verify unauthorized record-ID changes fail under RLS.
- Verify withdrawal requests, rejection reversal and external payout-reference recording.
- Verify private pages are not cached and service keys are not in browser bundles.
- Load-test concurrent last-item checkout and simultaneous withdrawal attempts against hosted PostgreSQL.
- Conduct keyboard, screen-reader, accessibility, security and backup/restore reviews.

No claims are made that pending hosted acceptance tasks were completed locally.
