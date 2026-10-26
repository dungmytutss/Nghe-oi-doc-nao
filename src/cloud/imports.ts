import { z } from 'zod';
import { progressSchema } from './types';

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const safeKey = z.string().min(1).max(2000).refine(key => !['__proto__', 'constructor', 'prototype'].includes(key));
const code = z.string().regex(/^(HS(?:0[1-9]|[1-3][0-9]|40)|KHACH)$/);
const count = z.number().int().min(0).max(1_000_000_000);
const lesson = z.number().int().min(1).max(50);
const boundedRecord = <T extends z.ZodType>(value: T) => z.record(safeKey, value)
  .refine(record => Object.keys(record).length <= 2048);
const compact = z.object({
  cv: z.string().max(20),
  m: z.array(z.tuple([safeKey, count.min(1).max(5), count, count, count])).max(2048),
  a: boundedRecord(count.max(9)), l: boundedRecord(count),
  p: boundedRecord(z.number().min(0).max(1440)), r: count, dd: boundedRecord(count),
});
export const reportSchema = z.object({
  v: z.literal(1), m: code, t: lesson,
  n: z.array(z.tuple([z.string().regex(/^\d{2}-\d{2}$/), z.number().min(0).max(1440)])).max(14),
  d: count, s: count, l: boundedRecord(count),
  y: z.array(z.tuple([safeKey, count, count])).max(8), g: count, r: count.default(0), b: compact.optional(),
});
const settings = z.object({
  baiToi: lesson.optional(), hsCuoi: code.optional(), itCD: z.boolean().optional(),
  giong: z.string().max(80).optional(), entryMode: z.enum(['guest', 'student']).optional(),
  baiTheoHS: z.record(code, lesson).optional(), viTriHS: z.record(code, lesson).optional(),
  nhanHS: z.record(code, z.string().max(80)).optional(),
});
const backup = z.object({ caiDat: settings.default({}), hs: z.record(code, progressSchema)
  .refine(rows => Object.keys(rows).length >= 1 && Object.keys(rows).length <= 41) });

export function parseImportJson(text: string): unknown {
  if (new TextEncoder().encode(text).byteLength > MAX_IMPORT_BYTES) throw new Error('import_too_large');
  let nodes = 0;
  const result: unknown = JSON.parse(text, (key, value: unknown) => {
    if (++nodes > 100_000 || ['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('invalid_import');
    return value;
  });
  return result;
}

export function parseBackup(text: string) { return backup.parse(parseImportJson(text)); }

export async function decodeReport(payload: string, budget = { remaining: MAX_IMPORT_BYTES }) {
  if (!/^[ZJ][A-Za-z0-9_-]+$/.test(payload) || payload.length > MAX_IMPORT_BYTES) throw new Error('invalid_import');
  const raw = Uint8Array.from(atob(payload.slice(1).replace(/-/g, '+').replace(/_/g, '/')), character => character.charCodeAt(0));
  const stream = new Blob([raw]).stream();
  const reader = (payload[0] === 'Z' ? stream.pipeThrough(new DecompressionStream('deflate-raw')) : stream).getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      budget.remaining -= value.byteLength;
      if (size > MAX_IMPORT_BYTES || budget.remaining < 0) throw new Error('import_too_large');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return reportSchema.parse(parseImportJson(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
}

export function csvCell(value: unknown) {
  const text = String(value);
  return '"' + (/^[\s]*[=+@-]|^[\t\r\n]/.test(text) ? "'" + text : text).replace(/"/g, '""') + '"';
}
