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

## Google sign-in integration — awaiting provider setup

- Uses the existing official `@supabase/supabase-js` SDK: `auth.signInWithOAuth({provider: 'google', ...})`. Supabase owns OAuth URL construction, callback processing, token/session handling and same-email identity linking. No custom OAuth server, password database, Google token validator, callback endpoint, or Gmail API integration was added.
- The app requests the standard Google sign-in identity only, with account selection. It adds no Gmail/Drive scopes or offline Google access. Same-email linking is handled by Supabase; using a different Google email does not transfer classes or automatically grant teacher privileges.
- The callback destination is the existing app entry point with `?auth=teacher`. A routing marker keeps the teacher page open while Supabase consumes/clears its callback fragment. It preserves the GitHub Pages project base path.
- Live read-only Supabase Auth settings confirmed `external.google=false`. The button is therefore disabled by default with a setup message. Enable `VITE_GOOGLE_SIGN_IN_ENABLED=true` locally only after setup. Production builds use the repository variable `GOOGLE_SIGN_IN_ENABLED=true`; no Google secret belongs in Vite variables or Git.
- Existing password login and MFA remain unchanged. Google sign-in is not equivalent to Supabase AAL2; the teacher MFA gate and database policies are not bypassed. Real-account MFA/Google validation remains pending.
- Validation passed: build, 26 unit/database tests and 12 browser tests. Isolated OAuth tests exercise the real Supabase SDK redirect/callback handling, preserve teacher routing after fragment cleanup, and verify that Google does not bypass teacher role or MFA checks. These mocks do not validate the external Google project configuration.

### Provider setup owned by the project administrator

1. In Google Auth Platform, create/select the Google Cloud project. Configure Branding, Audience and Data Access. If Audience is External/Testing, add `dungmytutss@gmail.com` as a test user. Use only `openid`, email and profile identity scopes.
2. Create an OAuth Client of type **Web application**. Authorized JavaScript origins for this project are `http://127.0.0.1:5173` and `https://dungmytutss.github.io` (no project subpath in origins).
3. Set Google's Authorized redirect URI to **`https://mixlblrijfmmvpzawxco.supabase.co/auth/v1/callback`**. The app still uses the hosted Supabase project during local development; this is not a local database callback URL.
4. In Supabase → Authentication → Sign In / Providers → Google, enable Google and save the Client ID and Client Secret directly there. Do not send the secret in chat, put it into the frontend, or disable nonce validation.
5. In Supabase Auth URL Configuration, add exact app redirect URLs `http://127.0.0.1:5173/?auth=teacher` and `https://dungmytutss.github.io/Nghe-oi-doc-nao/?auth=teacher`. Keep existing email confirmation/recovery URLs. Site URL should be the actual production app URL when that app is deployed.
6. Once the provider is enabled, enable the frontend flag, restart/rebuild, and test with the authorized teacher Gmail in a regular browser tab. Google may reject OAuth in an embedded browser. Verify same teacher user ID/classes, denied access for an unapproved email, cancelled sign-in, sign-out, and the existing MFA challenge before marking this live-tested.

Provider configuration requires Google/Supabase administrative access; publishable keys cannot perform it. References: [Supabase Google provider setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [automatic identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking), [redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls).
