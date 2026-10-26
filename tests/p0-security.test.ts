import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, test } from 'vitest';

let db: PGlite;
const teacher = '00000000-0000-4000-8000-000000000001';
const stranger = '00000000-0000-4000-8000-000000000002';
const gatewaySecret = 'a'.repeat(64);
const progress = { conVat: '🐰', muc: {}, am: {}, loi: {}, loiCT: [], phut: {}, daDoc: {}, docTheo: 1 };
async function asUser(id?: string, gateway = true, assurance = 'aal2') {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.headers',$2,false)",
    [id || '', JSON.stringify(gateway ? { 'x-nghe-gateway': gatewaySecret } : {})]);
  await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({sub:id,aal:assurance})]);
  await db.exec(id ? 'set role authenticated' : 'set role anon');
}
async function rpc<T>(expression: string, params: unknown[] = []) {
  return (await db.query<{ value: T }>(`select ${expression} as value`, params)).rows[0].value;
}
async function rejected(expression: string, params: unknown[] = []) {
  try { await rpc(expression, params); return false; } catch { return true; }
}
async function student() {
  await asUser(teacher);
  const classId = await rpc<string>("public.create_classroom_with_codes('Lớp kiểm thử',1,21)");
  const row = (await db.query<{ student_id: string; issued_code: string }>('select sc.student_id,sc.issued_code from public.student_codes sc join public.students s on s.id=sc.student_id where s.class_id=$1', [classId])).rows[0];
  return row;
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role supabase_auth_admin; create schema auth;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function auth.jwt() returns jsonb language sql as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
    grant usage on schema auth to anon,authenticated;
    alter default privileges in schema public grant execute on functions to anon,authenticated;`);
  for (const file of ['202610260001_learning.sql', '202610260003_class_codes.sql', '202610260004_fixed_student_codes.sql']) {
    await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
  }
  await db.exec("insert into public.teacher_emails values('teacher@example.test'),('stranger@example.test')");
  await db.query('insert into auth.users values($1,$2,now()),($3,$4,now())', [teacher,'teacher@example.test',stranger,'stranger@example.test']);
  await db.exec(readFileSync('supabase/migrations/202610260005_p0_security.sql', 'utf8'));
  await db.exec(readFileSync('supabase/migrations/202610260005_p0_security.sql', 'utf8'));
  await db.query("insert into app_private.gateway_config(secret_hash) values(encode(sha256(convert_to($1,'UTF8')),'hex'))", [gatewaySecret]);
}, 30000);
afterAll(async () => { await db?.close(); });

test('direct calls and private helpers stay blocked despite Supabase-style default grants', async () => {
  const row = await student();
  await asUser(undefined,false);
  const direct = await rejected('public.redeem_student_code($1)', [row.issued_code]);
  const privateHelper = await rejected('app_private.redeem_student_code($1)', [row.issued_code]);
  const internalHelper = await rejected('public.student_device_id($1)', ['b'.repeat(64)]);
  const legacyWrite = await rejected('public.save_student_device($1,$2,0,$3)', ['b'.repeat(64),progress,[]]);
  await asUser();
  const valid = await rpc<{ student_id: string }>('public.redeem_student_code($1)', [row.issued_code]);
  expect({ direct, privateHelper, internalHelper, legacyWrite, valid: valid.student_id === row.student_id })
    .toEqual({ direct:true, privateHelper:true, internalHelper:true, legacyWrite:true, valid:true });
});

test('same device is reusable and a student cannot allocate unlimited active devices', async () => {
  const row = await student(); await asUser();
  const first = await rpc<{ device_token: string }>('public.redeem_student_code($1)', [row.issued_code]);
  const repeat = await rpc<{ device_token: string }>('public.redeem_student_code($1,$2)', [row.issued_code,first.device_token]);
  await rpc('public.redeem_student_code($1)', [row.issued_code]);
  await rpc('public.redeem_student_code($1)', [row.issued_code]);
  const fourthBlocked = await rejected('public.redeem_student_code($1)', [row.issued_code]);
  expect({ same:repeat.device_token === first.device_token, fourthBlocked }).toEqual({ same:true,fourthBlocked:true });
});

test('server rejects malformed progress and events without changing the existing record', async () => {
  const row = await student(); await asUser();
  const paired = await rpc<{ device_token: string }>('public.redeem_student_code($1)',[row.issued_code]);
  await rpc('public.save_student_code_progress($1,$2,0,$3,21)',[paired.device_token,progress,[]]);
  const malformed = await rejected('public.save_student_code_progress($1,$2,1,$3,21)',[paired.device_token,{...progress,docTheo:-1},[]]);
  const invalidNested = await rejected('public.save_student_code_progress($1,$2,1,$3,21)',[paired.device_token,{...progress,muc:{a:{b:99,d:0,s:0,h:1}}},[]]);
  const invalidEvent = await rejected('public.save_student_code_progress($1,$2,1,$3,21)',[paired.device_token,progress,[{id:'not-a-uuid'}]]);
  const saved = await rpc<{ revision: number; progress:{docTheo:number} }>('public.read_student_device($1)',[paired.device_token]);
  expect({malformed,invalidNested,invalidEvent,revision:saved.revision,readings:saved.progress.docTheo})
    .toEqual({malformed:true,invalidNested:true,invalidEvent:true,revision:1,readings:1});
});

test('locking and emergency key replacement retain identity and progress but revoke old access', async () => {
  const row = await student(); await asUser();
  const paired = await rpc<{device_token:string}>('public.redeem_student_code($1)',[row.issued_code]);
  await rpc('public.save_student_code_progress($1,$2,0,$3,25)',[paired.device_token,progress,[]]);
  await asUser(stranger);
  const wrongTeacher = await rejected('public.set_student_code_lock($1,true)',[row.student_id]);
  await asUser(teacher); await rpc('public.set_student_code_lock($1,true)',[row.student_id]);
  await asUser();
  const deviceBlocked = await rejected('public.read_student_device($1)',[paired.device_token]);
  const codeBlocked = await rejected('public.redeem_student_code($1)',[row.issued_code]);
  await asUser(teacher);
  const replacement = await rpc<string>('public.rotate_student_code($1)',[row.student_id]);
  await asUser();
  const oldCodeBlocked = await rejected('public.redeem_student_code($1)',[row.issued_code]);
  const restored = await rpc<{student_id:string;lesson:number}>('public.redeem_student_code($1)',[replacement]);
  expect({wrongTeacher,deviceBlocked,codeBlocked,oldCodeBlocked,sameIdentity:restored.student_id===row.student_id,lesson:restored.lesson,
    samePrefix:replacement.slice(0,-32)===row.issued_code.slice(0,-32),newSecret:replacement!==row.issued_code})
    .toEqual({wrongTeacher:true,deviceBlocked:true,codeBlocked:true,oldCodeBlocked:true,sameIdentity:true,lesson:25,samePrefix:true,newSecret:true});
});

test('non-allowlisted Auth accounts are rejected by both hook and database trigger', async () => {
  await db.exec('reset role');
  const result = await rpc<{error:{http_code:number}}>('public.before_teacher_signup($1)',[{user:{email:'unknown@example.test'}}]);
  let insertBlocked=false;
  try { await db.query('insert into auth.users values($1,$2,now())',[crypto.randomUUID(),'unknown@example.test']); } catch { insertBlocked=true; }
  expect({code:result.error.http_code,insertBlocked}).toEqual({code:403,insertBlocked:true});
});

test('per-device read budget rejects excess requests with HTTP 429 semantics', async () => {
  const row = await student(); await asUser();
  const paired = await rpc<{device_token:string}>('public.redeem_student_code($1)',[row.issued_code]);
  // Redeeming already used one read; 119 additional reads consume the remaining budget.
  for (let n=0;n<119;n++) await rpc('public.read_student_device($1)',[paired.device_token]);
  let code='';
  try { await rpc('public.read_student_device($1)',[paired.device_token]); } catch(error) { code=(error as {code:string}).code; }
  expect(code).toBe('PT429');
});

test('teacher MFA is enforced by RPCs and REST policies while student gateway access remains usable', async () => {
  const row=await student(); await asUser();
  const paired=await rpc<{device_token:string}>('public.redeem_student_code($1)',[row.issued_code]);
  await db.exec('reset role');
  const migration=readFileSync('supabase/migrations/202610260006_teacher_mfa.sql','utf8');
  await db.exec(migration); await db.exec(migration);
  await asUser(teacher,true,'aal1');
  const classDenied=await rejected("public.create_classroom_with_codes('Không được tạo',1,21)");
  const rotateDenied=await rejected('public.rotate_student_code($1)',[row.student_id]);
  const writeDenied=await rejected('public.save_student_progress($1,$2,21,0)',[row.student_id,progress]);
  const tables=['classrooms','students','student_progress','learning_history','student_codes','student_devices','student_teachers'];
  const visible=[];
  for(const table of tables) visible.push((await db.query(`select ${table==='student_devices'?'id':'*'} from public.${table}`)).rows.length);
  let restInsertCode='';
  try{await db.query("insert into public.students(owner_id,local_code) values($1,'HS40')",[teacher]);}
  catch(error){restInsertCode=(error as {code:string}).code;}
  expect({classDenied,rotateDenied,writeDenied,visible,restInsertCode})
    .toEqual({classDenied:true,rotateDenied:true,writeDenied:true,visible:tables.map(()=>0),restInsertCode:'42501'});
  await asUser(teacher);
  expect((await db.query('select student_id from public.student_codes where student_id=$1',[row.student_id])).rows).toHaveLength(1);
  await asUser(stranger);
  expect((await db.query('select student_id from public.student_codes where student_id=$1',[row.student_id])).rows).toHaveLength(0);
  const formerTeacherClass=await rpc<string>("public.create_classroom_with_codes('Lớp kiểm quyền',1,21)");
  await db.exec('reset role');
  await db.query("update public.profiles set role='parent' where id=$1",[stranger]);
  await asUser(stranger);
  expect((await db.query('select id from public.classrooms where id=$1',[formerTeacherClass])).rows).toHaveLength(0);
  expect(await rejected("public.create_classroom_with_codes('Sai quyền',1,21)")).toBe(true);
  await asUser();
  expect((await rpc<{student_id:string}>('public.read_student_device($1)',[paired.device_token])).student_id).toBe(row.student_id);
});
