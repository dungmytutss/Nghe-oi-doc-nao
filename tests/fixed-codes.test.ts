import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { parseStudentCode } from '../src/cloud/codes';

test('structured code parser identifies app, storage, class, student and immutable starting lesson', () => {
  expect(parseStudentCode(`nghe1-sb-c642891-hs01-b21-${'a'.repeat(32)}`)).toMatchObject({
    storage: 'Supabase', classRef: '642891', student: 'HS01', startLesson: 21,
  });
});

test('issued student code stays fixed while one progress record advances and another device resumes it', async () => {
  const db = new PGlite();
  const teacher = '00000000-0000-4000-8000-000000000001';
  const stranger = '00000000-0000-4000-8000-000000000002';
  async function asUser(id?: string) {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id || '']);
    await db.exec(id ? 'set role authenticated' : 'set role anon');
  }
  async function rpc<T>(sql: string, params: unknown[] = []) {
    return (await db.query<{ value: T }>(`select ${sql} as value`, params)).rows[0].value;
  }
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to anon,authenticated;`);
    for (const file of ['202610260001_learning.sql', '202610260003_class_codes.sql', '202610260004_fixed_student_codes.sql']) {
      await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
    }
    await db.exec(readFileSync('supabase/migrations/202610260004_fixed_student_codes.sql', 'utf8'));
    await db.query('insert into auth.users values($1,$2,now()),($3,$4,now())', [teacher, 'teacher@example.test', stranger, 'stranger@example.test']);
    await db.exec("update public.profiles set role='teacher'");
    await asUser(teacher);
    const classroom = await rpc<string>("public.create_classroom_with_codes('Lớp 1A',2,21)");
    const codes = (await db.query<{ student_id: string; issued_code: string }>('select student_id,issued_code from public.student_codes order by issued_code')).rows;
    const code = codes[0].issued_code;
    const studentId = codes[0].student_id;
    await asUser();
    let directReadBlocked = false;
    try { await db.query('select issued_code from public.student_codes'); } catch { directReadBlocked = true; }
    let sharedClassEnrollmentBlocked = false;
    try { await rpc('public.lookup_classroom($1)', [parseStudentCode(code)!.classRef]); } catch { sharedClassEnrollmentBlocked = true; }
    const paired = await rpc<{ device_token: string; student_id: string; lesson: number }>('public.redeem_student_code($1)', [code]);
    const progress = { conVat: '🐰', muc: {}, am: {}, loi: {}, loiCT: [], phut: {}, daDoc: {}, docTheo: 4 };
    await rpc('public.save_student_code_progress($1,$2,0,$3,25)', [paired.device_token, progress, []]);
    let modifiedHeaderBlocked = false;
    try { await rpc('public.redeem_student_code($1)', [code.replace('-B21-', '-B25-')]); } catch { modifiedHeaderBlocked = true; }
    await asUser(teacher);
    await db.query('update public.classrooms set current_lesson=30 where id=$1', [classroom]);
    await rpc('public.issue_class_student_codes($1)', [classroom]);
    const sameCode = await rpc<string>('public.issue_student_code($1)', [studentId]);
    const progressCount = (await db.query('select student_id from public.student_progress where student_id=$1', [studentId])).rows.length;
    await asUser(stranger);
    const otherTeacherCodes = (await db.query('select issued_code from public.student_codes')).rows.length;
    await asUser();
    const resumed = await rpc<{ student_id: string; lesson: number; progress: { docTheo: number } }>('public.redeem_student_code($1)', [code]);
    expect({ count: codes.length, initialLesson: paired.lesson, sameCode: sameCode === code, originalLesson: parseStudentCode(sameCode)?.startLesson,
      progressCount, resumedLesson: resumed.lesson, readings: resumed.progress.docTheo, sameStudent: resumed.student_id === studentId,
      directReadBlocked, sharedClassEnrollmentBlocked, modifiedHeaderBlocked, otherTeacherCodes,
    }).toEqual({ count: 2, initialLesson: 21, sameCode: true, originalLesson: 21, progressCount: 1,
      resumedLesson: 25, readings: 4, sameStudent: true, directReadBlocked: true, sharedClassEnrollmentBlocked: true, modifiedHeaderBlocked: true, otherTeacherCodes: 0 });
  } finally { await db.close(); }
}, 30000);
