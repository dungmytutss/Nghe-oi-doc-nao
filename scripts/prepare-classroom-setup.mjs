import { readFileSync, writeFileSync } from 'node:fs';

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: node scripts/prepare-classroom-setup.mjs teacher@example.com');
  process.exit(1);
}
const quotedEmail = email.replaceAll("'", "''");
const migration = ['202610260003_class_codes.sql', '202610260004_fixed_student_codes.sql']
  .map(file => readFileSync(`supabase/migrations/${file}`, 'utf8')).join('\n\n');
const bootstrap = `
begin;
insert into public.teacher_emails(email) values ('${quotedEmail}') on conflict do nothing;
update public.profiles p set role = 'teacher' from auth.users u
where p.id = u.id and lower(u.email) = '${quotedEmail}' and u.email_confirmed_at is not null and p.role <> 'admin';
commit;
`;
writeFileSync('supabase/classroom-setup.local.sql', '-- Classroom code upgrade. Keeps existing progress. Safe to rerun.\n' + migration + bootstrap);
console.log('Prepared supabase/classroom-setup.local.sql. Run it in Supabase SQL Editor; do not rerun the initial setup.sql.');
