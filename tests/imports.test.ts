import { expect, test } from 'vitest';
import { csvCell, decodeReport, MAX_IMPORT_BYTES, parseBackup, parseImportJson } from '../src/cloud/imports';
import { contentSecurityPolicy } from '../security/policy';

const progress = { conVat:'🐰', muc:{}, am:{}, loi:{}, loiCT:[], phut:{}, daDoc:{}, docTheo:2 };
const report = { v:1,m:'HS01',t:21,n:[['10-26',6]],d:3,s:1,l:{},y:[],g:0,r:2 };
const encode = (value: unknown) => 'J'+Buffer.from(JSON.stringify(value)).toString('base64url');

test('backup validation preserves progress and rejects dangerous keys before merging',()=>{
  expect(parseBackup(JSON.stringify({hs:{KHACH:progress},caiDat:{baiToi:21}})).hs.KHACH.docTheo).toBe(2);
  for(const key of ['__proto__','constructor','prototype']) {
    expect(()=>parseBackup(`{"hs":{"KHACH":${JSON.stringify(progress)}},"caiDat":{"${key}":{"polluted":true}}}`)).toThrow();
  }
  expect(()=>parseBackup(JSON.stringify({hs:{HS01:{...progress,docTheo:'<img onerror=alert(1)>'}}}))).toThrow();
  expect(()=>parseImportJson(' '.repeat(MAX_IMPORT_BYTES+1))).toThrow('import_too_large');
  expect(({} as {polluted?:boolean}).polluted).toBeUndefined();
});

test('legacy report import rejects HTML in numeric cells and decompression bombs',async()=>{
  expect((await decodeReport(encode(report))).m).toBe('HS01');
  await expect(decodeReport(encode({...report,r:'<img src=x onerror=alert(1)>'}))).rejects.toThrow();
  await expect(decodeReport(encode({...report,m:'__proto__'}))).rejects.toThrow();
  const stream = new Blob([' '.repeat(MAX_IMPORT_BYTES+1)]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  const packed = Buffer.from(await new Response(stream).arrayBuffer()).toString('base64url');
  await expect(decodeReport('Z'+packed)).rejects.toThrow('import_too_large');
  const budget={remaining:Buffer.byteLength(JSON.stringify(report))+1};
  await decodeReport(encode(report),budget);
  await expect(decodeReport(encode(report),budget)).rejects.toThrow('import_too_large');
});

test('CSV export neutralizes spreadsheet formulas without changing ordinary values',()=>{
  expect([csvCell('=HYPERLINK("https://bad")'),csvCell('  +1'),csvCell('HS01'),csvCell(21)])
    .toEqual(['"\'=HYPERLINK(""https://bad"")"','"\'  +1"','"HS01"','"21"']);
});

test('CSP allows configured APIs and local assets while blocking injected scripts',()=>{
  const policy = contentSecurityPolicy({VITE_SUPABASE_URL:'https://db.example',VITE_STUDENT_GATEWAY_URL:'https://api.example'});
  expect(policy).toContain("script-src 'self'; script-src-attr 'none'");
  expect(policy).toContain("connect-src 'self' https://db.example https://api.example");
  expect(policy).not.toContain('unsafe-eval'); expect(policy).not.toContain('ws://');
  expect(()=>contentSecurityPolicy({VITE_SUPABASE_URL:'http://db.example'})).toThrow();
});
