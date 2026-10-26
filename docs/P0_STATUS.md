# P0 deployment status

This is the first P0 batch: student API access, device limits, code recovery, server validation and restricted teacher account creation. It does not claim completion of the entire P0 checklist.

## Implemented and tested locally

- Worker accepts only the three student RPCs, bounds request bodies, rejects unlisted origins, limits requests, applies an upstream timeout and returns no-store responses.
- Shared gateway credential stays on the Worker. PostgreSQL stores its digest in a private schema and rejects direct student RPC requests without that credential.
- SQL limits three active devices per student, reuses a remembered device credential and enforces additional per-device/per-student budgets.
- Teachers can lock a student code or explicitly replace a compromised access-key segment. Routine learning never changes the code. Both recovery actions preserve student identity and learning progress and revoke old devices.
- Server-side nested JSON/event validation precedes progress writes, including legacy write paths. Revision checks and event deduplication remain intact.
- Public/private function grants are explicitly reset, including Supabase-style default grants.
- Only allowlisted teacher emails can create an Auth profile. A Before User Created hook is prepared for a clearer Auth response; it must be enabled in the Supabase dashboard.

## Deployment order

1. Authorize Wrangler locally with the Cloudflare OAuth browser flow. Do not paste API tokens or passwords into chat.
2. Run `node scripts/prepare-p0-setup.mjs`. It generates ignored local secret files and the P0 SQL setup. Running it again retains the existing secret.
3. Deploy `gateway/wrangler.jsonc`, then upload `gateway/secrets.local.json` with `wrangler secret bulk`. Use the same configuration file for both commands.
4. Run `supabase/p0-setup.local.sql` in Supabase SQL Editor. Unlike the older setup file, this preserves existing progress and immediately enforces the gateway. Direct-mode student sync will stop working by design.
5. Set `VITE_STUDENT_GATEWAY_URL` to the deployed Worker origin in `.env.local` and the production build configuration. Do not put STUDENT_GATEWAY_SECRET in a VITE variable.
6. Test that raw Supabase student RPCs are rejected and the deployed Worker accepts valid student requests. Verify enrollment, code locking and recovery using a dedicated test profile, not real student progress.
7. Enable `public.before_teacher_signup` as the Before User Created hook in Supabase Auth. The profile trigger already rejects unlisted email accounts if this dashboard step is not yet done.

## Deployment verification — 2026-10-26

- Restored the complete project to `F:\Nghe-oi-doc-nao` after another chat moved it to a backup directory. The branch and uncommitted changes were preserved.
- Cloudflare OAuth is authorized. Worker and its two secrets are deployed at `https://nghe-student-api.en11001100.workers.dev`.
- Live checks: allowed-origin preflight returns 204; untrusted origin returns 403; an invalid device reaches Supabase and returns sanitized 403. No real student data was changed.
- Fixed a deployed-runtime issue: Workers does not implement Fetch `redirect: 'error'`. The gateway uses `manual` and rejects 3xx responses without forwarding credentials. Covered by a regression test.
- Owner applied `supabase/p0-setup.local.sql`. Live Supabase checks reject both absent and incorrect gateway credentials with `gateway_required`, and anonymous access to the internal `student_device_id` helper is denied. The deployed Worker reaches the guarded RPC and receives `invalid_student_device` for a fake token.
- Local `.env.local` now routes student sync through the deployed gateway. Repeat the read-only deployment checks with `node scripts/verify-p0.mjs`.
- GitHub Actions uses the deployed gateway by default, with `STUDENT_GATEWAY_URL` available as a repository-variable override. This branch has not deployed the website.
- Validation passed: production build, 21 unit/database/gateway tests, six browser-flow tests, and checks for all 815 recordings and accidental secrets. Student browser tests use an isolated gateway and block direct Supabase requests.

## Remaining work

- Worker rate limits are approximate and apply per Cloudflare location; they are not a globally exact counter. Database budgets/device caps provide an additional layer after credential validation. The TOTAL binding is a pilot circuit breaker, not a tested capacity promise. Tune all limits after a staging load test.
- This protects student RPCs; teacher Auth/REST remains on Supabase and needs its own production Auth settings and monitoring.
- MFA for teachers, production CSP/security headers, remaining legacy HTML/import review, and authenticated cross-teacher permission verification are not marked complete by this batch. Live enrollment/save/lock/rotation with a dedicated teacher test account remains to be verified; local database tests cover those operations.
- No DDoS simulation or production load test has been performed. Managed DDoS protection and deployment availability must be verified against the actual Cloudflare account/plan.
- Hosted SQL and Auth settings are not changed by local unit tests or Worker dry-run builds.
