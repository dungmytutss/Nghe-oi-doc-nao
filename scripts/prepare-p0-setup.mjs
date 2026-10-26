import { randomBytes, createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const env = Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(line => line.includes('='))
  .map(line => { const i=line.indexOf('='); return [line.slice(0,i),line.slice(i+1).trim()]; }));
const secretsPath='gateway/secrets.local.json';
const existing=existsSync(secretsPath) ? JSON.parse(readFileSync(secretsPath,'utf8')) : {};
const secret=existing.STUDENT_GATEWAY_SECRET || randomBytes(32).toString('hex');
if (!/^[0-9a-f]{64}$/.test(secret)) throw new Error('Invalid local gateway secret.');
if (!env.VITE_SUPABASE_PUBLISHABLE_KEY) throw new Error('Configure the publishable key in .env.local first.');
const secrets={STUDENT_GATEWAY_SECRET:secret,SUPABASE_PUBLISHABLE_KEY:env.VITE_SUPABASE_PUBLISHABLE_KEY};
writeFileSync(secretsPath,JSON.stringify(secrets,null,2)+'\n');
writeFileSync('gateway/.dev.vars',Object.entries(secrets).map(([key,value])=>`${key}=${value}`).join('\n')+'\n');
const hash=createHash('sha256').update(secret).digest('hex');
const sql=readFileSync('supabase/migrations/202610260005_p0_security.sql','utf8')+`
begin;
insert into app_private.gateway_config(id,secret_hash) values(true,'${hash}')
on conflict(id) do update set secret_hash=excluded.secret_hash;
commit;
`;
writeFileSync('supabase/p0-setup.local.sql','-- Apply only after the Worker and its secrets are deployed. Existing progress is preserved.\n'+sql);
console.log('Prepared ignored gateway secrets and supabase/p0-setup.local.sql. No secrets were printed.');
