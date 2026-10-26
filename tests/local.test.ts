import 'fake-indexeddb/auto';
import { afterEach, expect, test } from 'vitest';
import { LearningDatabase, recordEvent, saveSnapshot } from '../src/cloud/local';
import { progressSchema, type LegacyStore } from '../src/cloud/types';

const databases: LearningDatabase[] = [];
function database() {
  const db = new LearningDatabase(`test-${crypto.randomUUID()}`);
  databases.push(db);
  return db;
}
afterEach(async () => { await Promise.all(databases.splice(0).map(db => db.delete())); });
const progress = { conVat: '🐰', muc: {}, am: {}, loi: {}, loiCT: [], phut: {}, daDoc: {}, docTheo: 0 };

test('records distinct offline events and preserves account ownership across sessions', async () => {
  const db = database();
  await db.bindings.put({ localCode: 'HS01', ownerId: 'parent-a', studentId: 'student-a', revision: 1 });
  const event = { localCode: 'HS01', lesson: 1, activity: 'tau', item: 'ba', correct: true, occurredAt: new Date().toISOString() };
  await Promise.all([recordEvent(event, db), recordEvent(event, db), recordEvent({ ...event, localCode: 'HS02' }, db)]);
  const events = await db.events.toArray();
  expect({ count: events.length, ids: new Set(events.map(e => e.id)).size,
    owners: events.filter(e => e.localCode === 'HS01').map(e => e.ownerId),
    unbound: events.find(e => e.localCode === 'HS02')?.ownerId,
  }).toEqual({ count: 3, ids: 3, owners: ['parent-a', 'parent-a'], unbound: null });
});

test('keeps the original progress structure for device migration', async () => {
  const db = database();
  const store: LegacyStore = { caiDat: { hsCuoi: 'HS01', baiToi: 30 }, hs: { HS01: { ...progress, docTheo: 12, am: { a: 5 } } } };
  await saveSnapshot(store, db);
  expect((await db.snapshots.get('current'))?.store).toEqual(store);
});

test('rejects invalid cloud progress before replacing local data', () => {
  expect(progressSchema.safeParse({ ...progress, docTheo: -1 }).success).toBe(false);
});
