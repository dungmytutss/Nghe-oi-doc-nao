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

Only foundational schema and sync functions are prepared. The current UI continues to work locally. The revised flow uses teacher-managed personal student links without parent registration; teacher login, classroom management, secure device pairing, and automatic sync are not implemented yet. No cloud migrations or Auth changes have been executed by the local setup.

## Keepalive

`.github/workflows/supabase-keepalive.yml` queries a dedicated, non-sensitive `app_health` row each day at **10:17 Asia/Saigon (03:17 UTC)**. It works independently of app visits and uses only the publishable key. It reads PostgreSQL through the Data API, rather than pinging the site's homepage. Failures cause a failed Actions run.

Activation requires the health-table migration, the two repository secrets, and the workflow on the repository's default branch. After merging, run it once with **Actions → Supabase database keepalive → Run workflow** and verify a green run. Merely pushing it to the feature branch does not activate the schedule.

This reduces inactivity risk, not a guarantee of availability or exemption from Supabase policies. Scheduled GitHub jobs can be delayed; public repositories can have schedules disabled after 60 days without repository activity. Check Actions and Supabase notices periodically. A paused project may need to be resumed in the Supabase dashboard. See https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule.

## Data and permissions

- `profiles`: adult identity and trusted role assignment, defaulting to parent.
- `students`: stable UUID, account-scoped code, and animal avatar.
- `student_progress`: the existing mastery, review, garden, minutes, and reading counters; revision checks prevent stale overwrites.
- `learning_history`: immutable per-attempt events with unique IDs for retry-safe uploads. Reading completion has a null correctness value because the app does not assess the child's voice.
- `student_teachers`: explicit teacher read access. Class and invitation management is a later step in the reviewed flow.
- `app_health`: one public read-only row, no student data.

RLS denies anonymous access to learning data. Owners access their own students. Linked teachers can read the granted students' progress and history. Users cannot assign their own role. The old `1a` teacher code controls the original local teaching tools only; it is not cloud authorization.

## Local data

The original `nghe-oi-doc-nao.v1` localStorage key stays intact. IndexedDB keeps a second progress snapshot and a queue of attempt events. No cloud upload happens until a future explicit account-link action. Local profiles already linked to one account cannot silently be uploaded to another account.

Restore saves the previous full local snapshot into IndexedDB under `before-restore-*`. An adult-facing restore/recovery UI will be added with the reviewed account flow; the original JSON export/import remains available now.
