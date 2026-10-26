# Supabase setup

## Free plan

The Free plan is suitable for an initial small pilot using compact learning records. Audio and lessons are static app assets, not database rows. The database allowance is 500 MB; monitor actual usage rather than assuming a fixed student capacity. Low-activity projects can be paused after a seven-day period.

References: https://supabase.com/pricing and https://supabase.com/docs/guides/platform/free-project-pausing.

## Create and connect

1. Create a project at https://supabase.com/dashboard. The GitHub repository selector is optional; leave it empty if the repository is unavailable.
2. Keep the database password private. Obtain the Project URL and publishable key from the project's connection/API settings. A legacy anon key also works as the frontend key.
3. Copy `.env.example` to `.env.local` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Restart the dev server after changes.
4. On a new project, run `supabase/setup.sql` once in the SQL Editor. It combines the two foundational migrations. Alternatively, apply `supabase/migrations/` in timestamp order through the Supabase CLI migration workflow. Choose one method; do not run both or rerun the initial setup over an already migrated database.
5. Configure Auth redirect URLs for the local development URL and the published app URL when the reviewed login flow is implemented.
6. For GitHub builds, add repository Actions secrets `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. The publishable key is designed for browsers; RLS and grants enforce database access. Never use a service-role/secret key in frontend build variables.

Teacher login, the class-code generator, parent code entry, teacher-approved device pairing, and automatic student sync are implemented. The app still works locally before the database upgrade. Local development does not execute cloud migrations automatically.

## Upgrade the existing project for classroom codes

The initial tables already exist on the configured project. **Do not rerun `supabase/setup.sql`.**

1. Run `node scripts/prepare-classroom-setup.mjs teacher@example.com` with the intended first teacher's email. This generates `supabase/classroom-setup.local.sql`, which is ignored by Git so personal email configuration stays local.
2. Run that generated SQL in the project's SQL Editor. It adds the classroom/device tables, secures the RPCs, and allows that verified email to receive the teacher role. It preserves the existing learning tables and can be rerun safely.
3. In Supabase Auth URL Configuration, add the local and deployed app URLs to the allowed redirect URLs. Keep email confirmation enabled. If hosted email delivery is restricted, configure SMTP or provision the teacher through the Auth dashboard rather than weakening student access policies.
4. Open **Dành cho người lớn → Tài khoản của cô → Tạo mới**, set a password, and confirm the teacher email. An existing confirmed account is promoted by the generated upgrade; a newly confirmed allowlisted account is promoted by the database trigger. Other signups cannot grant themselves teacher access.
5. Log in, create a class with its starting lesson and student count, and copy the six-digit code and app website to send through Zalo.
6. Families enter that code once and choose the assigned student animal/code. They can practise while waiting. Verify the displayed machine-check code with the family before approving the first connection in the teacher panel.

Class codes identify class settings rather than encoding a fixed lesson. Changing the class's current lesson updates the child's default lesson the next time their device connects.

## Keepalive

`.github/workflows/supabase-keepalive.yml` queries a dedicated, non-sensitive `app_health` row each day at **10:17 Asia/Saigon (03:17 UTC)**. It works independently of app visits and uses only the publishable key. It reads PostgreSQL through the Data API, rather than pinging the site's homepage. Failures cause a failed Actions run.

Activation requires the health-table migration, the two repository secrets, and the workflow on the repository's default branch. After merging, run it once with **Actions → Supabase database keepalive → Run workflow** and verify a green run. Merely pushing it to the feature branch does not activate the schedule.

This reduces inactivity risk, not a guarantee of availability or exemption from Supabase policies. Scheduled GitHub jobs can be delayed; public repositories can have schedules disabled after 60 days without repository activity. Check Actions and Supabase notices periodically. A paused project may need to be resumed in the Supabase dashboard. See https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule.

## Data and permissions

- `profiles`: adult identity and trusted role assignment, defaulting to parent.
- `students`: stable UUID, account-scoped code, and animal avatar.
- `student_progress`: the existing mastery, review, garden, minutes, and reading counters; revision checks prevent stale overwrites.
- `learning_history`: immutable per-attempt events with unique IDs for retry-safe uploads. Reading completion has a null correctness value because the app does not assess the child's voice.
- `student_teachers`: original optional sharing grants, retained for compatibility. New generated classes are owned by their teacher.
- `classrooms`: teacher-owned class name, six-digit code, and current lesson.
- `student_devices`: hashed, revocable device credentials. Pending devices cannot access cloud progress. Teachers can read approval metadata but not credential hashes.
- `teacher_emails`: trusted provisioning allowlist, unavailable to browser roles.
- `app_health`: one public read-only row, no student data.

RLS denies anonymous table access to learning data. Students access their own progress through constrained RPCs requiring a valid, approved device credential; they never use a teacher session. Class owners read their own roster/history and approve or revoke devices. Users cannot assign their own role. The old `1a` teacher code controls the original local teaching tools only; it is not cloud authorization.

## Local data

The original `nghe-oi-doc-nao.v1` localStorage key stays intact. IndexedDB keeps a second progress snapshot, per-student device credentials, and a queue of attempt events. No cloud upload happens without teacher-approved pairing. Joining a class preserves occupied legacy profiles by allocating another local slot; the home screen displays the teacher's assigned student code. Different classes' HS01 profiles stay separate on a shared phone.

Restore saves the previous full local snapshot into IndexedDB under `before-restore-*`. The adult area offers explicit local/cloud choices for conflicting progress. Pending history remains queued; unique event IDs prevent duplicates on retry. The original JSON export/import remains available. The classroom feature does not implement automatic merging of two modified progress copies.

## Verification

`npm run check` compiles the app, checks the original audio assets, and runs local storage/sync tests plus isolated PostgreSQL tests through PGlite. `npm run test:e2e` uses a local Vite server and mocked Supabase endpoints to test student entry, classroom generation, approval, reading saves, and returning devices. Browser tests cannot sign up or modify the live project. Cloud deployment and actual teacher signup still need the SQL upgrade and Supabase Auth configuration above.
