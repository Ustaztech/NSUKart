# NSUKart contributor guidance

- Use TypeScript, Next.js App Router and the established Supabase architecture. Do not introduce PHP.
- Read README.md and docs/READINESS.md before claiming a workflow is production-ready.
- Enforce all private mutations in RLS or narrowly scoped transaction functions as well as the app server.
- Keep service-role, payment and email keys server-only. Never commit .env files.
- Store money in integer kobo and preserve item/commission snapshots.
- Do not simulate payment success, refunds, withdrawals, university verification or customer activity.
- Maintain emerald/gold styling and mobile accessibility, including admin navigation.
- For database changes, add migrations and tests for financial/authorization invariants.
- Run npm run check and npm run test:e2e for relevant changes. Report external validation gaps honestly.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
