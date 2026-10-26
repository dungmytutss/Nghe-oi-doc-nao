import Dexie, { type Table } from 'dexie';
import type { LearningEvent, LegacyStore, QueuedEvent, StudentBinding, StudentDevice } from './types';

export class LearningDatabase extends Dexie {
  events!: Table<QueuedEvent, string>;
  bindings!: Table<StudentBinding, string>;
  snapshots!: Table<{ id: string; store: LegacyStore; savedAt: string }, string>;
  devices!: Table<StudentDevice, string>;

  constructor(name = 'nghe-oi-learning-v2') {
    super(name);
    this.version(1).stores({
      events: 'id, localCode, [localCode+synced], ownerId',
      bindings: 'localCode, ownerId',
      snapshots: 'id',
    });
    this.version(2).stores({ devices: 'localCode, &studentId' });
  }
}
export const localDb = new LearningDatabase();

export async function recordEvent(event: LearningEvent, db = localDb) {
  // Capture the binding when the event is written, not when another user signs in.
  await db.transaction('rw', db.events, db.bindings, db.devices, async () => {
    const binding = await db.bindings.get(event.localCode);
    const device = await db.devices.get(event.localCode);
    await db.events.add({ ...event, id: crypto.randomUUID(), ownerId: device?.studentId ?? binding?.ownerId ?? null, synced: 0 });
  });
}

export async function saveSnapshot(store: LegacyStore, db = localDb) {
  await db.snapshots.put({ id: 'current', store, savedAt: new Date().toISOString() });
}

export async function backupBeforeRestore(store: LegacyStore) {
  await localDb.snapshots.put({ id: `before-restore-${crypto.randomUUID()}`, store, savedAt: new Date().toISOString() });
}

export function reportStorageFailure() {
  window.dispatchEvent(new CustomEvent('nghe-storage-error'));
}

export function emptyProgress(avatar: string) {
  return { conVat: avatar, muc: {}, am: {}, loi: {}, loiCT: [], phut: {}, daDoc: {}, docTheo: 0 };
}

export function allocateLocalCode(preferred: string, store: LegacyStore, devices: StudentDevice[]) {
  const used = new Set([...Object.keys(store.hs), ...devices.map(device => device.localCode)]);
  if (!used.has(preferred)) return preferred;
  for (let n = 1; n <= 40; n++) {
    const code = `HS${String(n).padStart(2, '0')}`;
    if (!used.has(code)) return code;
  }
  throw new Error('Máy đã có 40 hồ sơ. Nhờ cô sao lưu và dọn hồ sơ cũ trước khi thêm.');
}
