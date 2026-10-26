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

Teacher login, fixed student codes, code entry, a separate single-profile guest mode, and automatic student sync are implemented. The app still works locally before the database upgrade. Local development does not execute cloud migrations automatically.

## Upgrade the existing project for classroom codes

The initial tables already exist on the configured project. **Do not rerun `supabase/setup.sql`.**

1. Run `node scripts/prepare-classroom-setup.mjs teacher@example.com` with the intended first teacher's email. This generates `supabase/classroom-setup.local.sql`, which is ignored by Git so personal email configuration stays local.
2. Run that generated SQL in the project's SQL Editor. It adds the classroom/device tables, secures the RPCs, and allows that verified email to receive the teacher role. It preserves the existing learning tables and can be rerun safely.
3. In Supabase Auth URL Configuration, add the local and deployed app URLs to the allowed redirect URLs. Keep email confirmation enabled. If hosted email delivery is restricted, configure SMTP or provision the teacher through the Auth dashboard rather than weakening student access policies.
4. Open **Góc của cô → Tài khoản giáo viên → Tạo mới**, set a password, and confirm the teacher email. An existing confirmed account is promoted by the generated upgrade; a newly confirmed allowlisted account is promoted by the database trigger. Other signups cannot grant themselves teacher access.
5. Open #goc-co, log in, and create a class with its starting lesson and student count. Each student receives a permanent structured code. Copy the individual code from the class roster and send it to the corresponding family.
6. Families open #nhap-ma and paste the full student code. It authenticates exactly one student without selecting from a roster or waiting for approval. The device retains its own credential, separate from teacher Auth.

The generated upgrade includes migrations 003 and 004. Issued student codes retain the original class, student and starting-lesson fields permanently. Learning writes update the existing student_progress row and append idempotent history events; they do not issue or rotate a code. A class's default lesson applies when a code is first issued, while a returning student resumes their own saved lesson.

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
- `student_codes`: permanent structured credentials and their lookup hashes. Only the owning teacher can read full issued codes; anonymous clients can redeem only an exact valid code.
- `app_health`: one public read-only row, no student data.

RLS denies anonymous table access to learning data. Students access their own progress through constrained RPCs requiring a valid, approved device credential; they never use a teacher session. Class owners read their own roster/history and approve or revoke devices. Users cannot assign their own role. The old `1a` teacher code controls the original local teaching tools only; it is not cloud authorization.

## Local data

The original `nghe-oi-doc-nao.v1` localStorage key stays intact. IndexedDB keeps a second progress snapshot, per-student device credentials, and a queue of attempt events. No cloud upload happens without redeeming a valid teacher-issued student code (or a previously approved legacy device). Entering a student code preserves occupied legacy profiles by allocating another local slot; the home screen displays the teacher's assigned student code. Different classes' HS01 profiles stay separate on a shared phone.

Restore saves the previous full local snapshot into IndexedDB under `before-restore-*`. The adult area offers explicit local/cloud choices for conflicting progress. Pending history remains queued; unique event IDs prevent duplicates on retry. The original JSON export/import remains available. The classroom feature does not implement automatic merging of two modified progress copies. The guest profile is stored once as KHACH, and guest events are not put into the cloud queue.

## Verification

`npm run check` compiles the app, checks the original audio assets, and runs local storage/sync tests plus isolated PostgreSQL tests through PGlite. `npm run test:e2e` uses a local Vite server and mocked Supabase endpoints to test student entry, classroom generation, approval, reading saves, and returning devices. Browser tests cannot sign up or modify the live project. Cloud deployment and actual teacher signup still need the SQL upgrade and Supabase Auth configuration above.

## Source organization

- src/components/EntryScreens.tsx: entry, code, guest, teacher and local-tool screens.
- src/components/entry/navigation.ts: explicit routes; the root always opens the default chooser.
- src/components/teacher/: teacher account and classroom management.
- src/cloud/codes.ts and guest.ts: code parsing and the single guest profile.
- src/cloud/student.ts: student authentication, stable-identity sync and conflict handling.
- src/game/audio.js: original voice playback, extracted without changing recordings.
- src/game/engine.js: preserved learning engine and the typed integration bridge.
