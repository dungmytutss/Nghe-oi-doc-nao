import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

test('class codes require teacher approval; devices are isolated, revocable and retry-safe', async () => {
  const db = new PGlite();
  const teacher = '00000000-0000-4000-8000-000000000001';
  const otherTeacher = '00000000-0000-4000-8000-000000000002';
  const parent = '00000000-0000-4000-8000-000000000003';
  async function asUser(id?: string) {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id || '']);
    await db.exec(id ? 'set role authenticated' : 'set role anon');
  }
  async function rpc<T>(sql: string, args: unknown[] = []) {
    const result = await db.query<{ value: T }>(`select ${sql} as value`, args);
    return result.rows[0].value;
  }
  async function denied(action: () => Promise<unknown>) {
    try { await action(); return false; } catch { return true; }
  }
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated;
    `);
    for (const file of ['202610260001_learning.sql', '202610260002_keepalive.sql', '202610260003_class_codes.sql']) {
      await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
    }
    // The new upgrade can be rerun without the original "table already exists" failure.
    await db.exec(readFileSync('supabase/migrations/202610260003_class_codes.sql', 'utf8'));
    await db.exec("insert into public.teacher_emails values ('teacher@example.test'), ('other@example.test')");
    await db.query('insert into auth.users values($1,$2,now()),($3,$4,now()),($5,$6,now())',
      [teacher, 'teacher@example.test', otherTeacher, 'other@example.test', parent, 'parent@example.test']);
    await asUser(parent);
    const parentCannotCreate = await denied(() => rpc("public.create_classroom('Lớp giả', 2, 1)"));
    await asUser(teacher);
    const classId = await rpc<string>("public.create_classroom('Lớp 1A', 2, 21)");
    const classId2 = await rpc<string>("public.create_classroom('Lớp 1B', 2, 5)");
    const code = (await db.query<{ class_code: string }>('select class_code from public.classrooms where id = $1', [classId])).rows[0].class_code;
    await asUser(otherTeacher);
    const otherTeacherSeesNoClasses = (await db.query('select id from public.classrooms')).rows.length === 0;
    await asUser();
    const lookup = await rpc<{ name: string; lesson: number; students: { id: string; local_code: string }[] }>('public.lookup_classroom($1)', [`nghe-${code}`]);
    const studentId = lookup.students[0].id;
    const pending = await rpc<{ device_token: string; status: string }>('public.request_student_device($1,$2)', [`NGHE-${code}`, studentId]);
    const noPublicHistory = await denied(() => db.query('select * from public.learning_history'));
    const noTokensReadable = await denied(() => db.query('select token_hash from public.student_devices'));
    const progress = { conVat: '🐰', muc: {}, am: {}, loi: {}, loiCT: [], phut: {}, daDoc: {}, docTheo: 1 };
    const pendingCannotSave = await denied(() => rpc('public.save_student_device($1,$2,0,$3)', [pending.device_token, progress, []]));
    const pendingRead = await rpc<Record<string, unknown>>('public.read_student_device($1)', [pending.device_token]);
    await asUser(teacher);
    const deviceId = (await db.query<{ id: string }>('select id from public.student_devices where student_id=$1', [studentId])).rows[0].id;
    await rpc('public.set_student_device_status($1,$2)', [deviceId, 'approved']);
    await asUser();
    const event = { id: crypto.randomUUID(), lesson: 21, activity: 'doc', item: 'ba', correct: true, occurred_at: new Date().toISOString() };
    const revision = await rpc<number>('public.save_student_device($1,$2,0,$3)', [pending.device_token, progress, [event]]);
    const staleWriteBlocked = await denied(() => rpc('public.save_student_device($1,$2,0,$3)', [pending.device_token, progress, [event]]));
    await rpc('public.save_student_device($1,$2,$3,$4)', [pending.device_token, progress, revision, [event]]);
    const saved = await rpc<{ student_id: string; revision: number }>('public.read_student_device($1)', [pending.device_token]);
    await asUser(otherTeacher);
    const otherTeacherCannotApprove = await denied(() => rpc('public.set_student_device_status($1,$2)', [deviceId, 'approved']));
    await asUser(teacher);
    const history = (await db.query<{ correct: boolean | null }>('select correct from public.learning_history where student_id=$1', [studentId])).rows;
    await rpc('public.set_student_device_status($1,$2)', [deviceId, 'revoked']);
    await asUser();
    const revokedBlocked = await denied(() => rpc('public.read_student_device($1)', [pending.device_token]));
    expect({ parentCannotCreate, otherTeacherSeesNoClasses, noPublicHistory, noTokensReadable,
      pendingCannotSave, pendingHasNoProgress: !('progress' in pendingRead), staleWriteBlocked,
      otherTeacherCannotApprove, revokedBlocked, classLesson: lookup.lesson,
      studentCodes: lookup.students.map(s => s.local_code), differentClasses: classId !== classId2,
      savedStudent: saved.student_id, revision: saved.revision, history,
    }).toEqual({ parentCannotCreate: true, otherTeacherSeesNoClasses: true, noPublicHistory: true, noTokensReadable: true,
      pendingCannotSave: true, pendingHasNoProgress: true, staleWriteBlocked: true,
      otherTeacherCannotApprove: true, revokedBlocked: true, classLesson: 21,
      studentCodes: ['HS01', 'HS02'], differentClasses: true, savedStudent: studentId, revision: 2,
      history: [{ correct: null }],
    });
  } finally { await db.close(); }
}, 30000);
