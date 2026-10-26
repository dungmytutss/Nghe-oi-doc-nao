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
- Live enrollment/save/lock/rotation with a dedicated teacher test account remains to be verified; local database tests cover those operations.
- No DDoS simulation or production load test has been performed. Managed DDoS protection and deployment availability must be verified against the actual Cloudflare account/plan.
- Hosted SQL and Auth settings are not changed by local unit tests or Worker dry-run builds.

## Second P0 batch — teacher MFA and browser/import protection

- Teacher UI requires TOTP enrollment or a fresh authenticator challenge before mounting the classroom manager. Setup starts only on an explicit click; QR/secret stays in component memory and is cleared after verification. An incorrect code keeps classes inaccessible. Student and guest flows do not require accounts or MFA.
- Apply `supabase/migrations/202610260006_teacher_mfa.sql` after the new frontend is available. The migration requires signed JWT AAL2 for teacher RPCs and adds restrictive policies to all seven class/student/progress/history tables, including direct REST paths inherited from the old parent-account schema. Profile self-read remains available for login. Existing data is preserved; the script is rerunnable.
- MFA SQL awaits owner application. Local PostgreSQL tests verify AAL1 cannot read/write class data or use teacher RPCs, AAL2 can read owned codes, another teacher cannot read them, and anonymous student access through the gateway still works.
- `vite.config.ts` puts CSP into built HTML: same-origin scripts only, inline handlers/eval blocked, fixed API origins, no objects/frames/base URL changes. Inline styles remain necessary for the teaching engine. Zod runs without eval/JIT probes.
- Vite dev/preview also send CSP frame-ancestors, nosniff, referrer, frame and permissions headers. **GitHub Pages does not gain these HTTP headers from this configuration**; its built HTML receives the meta CSP/referrer policy only. Production anti-framing and other response headers need a host/proxy capable of setting them. Do not mark that hosting task complete.
- Legacy reports and raw backups are validated before import, reject prototype keys and malformed numbers, and enforce a 2 MiB input/decompressed limit. Streaming decompression stops at the limit. Progress schema bounds match server constraints. Imported avatar text is escaped before HTML rendering; CSV cells neutralize formula prefixes.
- Validation: build and 26 unit/database tests passed; nine browser tests cover existing student/guest/teacher flows, TOTP setup/challenge, malformed restore and injected handlers. A production-preview guest lesson completed without CSP violations. Hosted teacher MFA enrollment/recovery still requires testing with the owner; no real factor was enrolled automatically.

### Teacher rollout and recovery

1. Use the new frontend, apply migration 006, then open Góc của cô and sign in.
2. Choose Thiết lập xác thực hai bước. Add its QR/manual secret to a TOTP authenticator and enter the current six-digit code. Do not share the QR or secret in chat.
3. On later password logins, enter the authenticator code before class management opens.
4. If the authenticator is lost, the Supabase project administrator must verify the teacher's identity and remove/reset the factor through trusted Auth administration. A password reset alone does not bypass MFA. No public MFA reset endpoint or fallback master code is provided.

References: [Supabase TOTP flow](https://supabase.com/docs/guides/auth/auth-mfa/totp), [Supabase MFA assurance levels](https://supabase.com/docs/guides/auth/auth-mfa), [MDN frame-ancestors and meta limitation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors).
