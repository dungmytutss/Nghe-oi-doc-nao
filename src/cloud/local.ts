import Dexie, { type Table } from 'dexie';
import type { LearningEvent, LegacyStore, QueuedEvent, StudentBinding } from './types';

export class LearningDatabase extends Dexie {
  events!: Table<QueuedEvent, string>;
  bindings!: Table<StudentBinding, string>;
  snapshots!: Table<{ id: string; store: LegacyStore; savedAt: string }, string>;

  constructor(name = 'nghe-oi-learning-v2') {
    super(name);
    this.version(1).stores({
      events: 'id, localCode, [localCode+synced], ownerId',
      bindings: 'localCode, ownerId',
      snapshots: 'id',
    });
  }
}
export const localDb = new LearningDatabase();

export async function recordEvent(event: LearningEvent, db = localDb) {
  // Capture the binding when the event is written, not when another user signs in.
  await db.transaction('rw', db.events, db.bindings, async () => {
    const binding = await db.bindings.get(event.localCode);
    await db.events.add({ ...event, id: crypto.randomUUID(), ownerId: binding?.ownerId ?? null, synced: 0 });
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
