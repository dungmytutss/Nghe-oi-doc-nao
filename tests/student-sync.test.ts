import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { localDb, emptyProgress, recordEvent } from '../src/cloud/local';
import { stableJson } from '../src/cloud/serialize';
import type { GameBridge, LegacyStore, StudentProgress } from '../src/cloud/types';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../src/cloud/client', () => ({ requireStudentClient: () => ({ rpc }) }));
import { syncDevice } from '../src/cloud/student';

const studentId = '00000000-0000-4000-8000-000000000001';
const metadata = { student_id: studentId, local_code: 'HS01', avatar: '🐰', class_name: 'Lớp 1A', lesson: 21, check_code: 'ABC123', status: 'approved' };
let store: LegacyStore;
let game: GameBridge;
beforeEach(async () => {
  vi.stubGlobal('document', { body: { dataset: { man: 'dau' } } });
  rpc.mockReset();
  await Promise.all([localDb.devices.clear(), localDb.events.clear(), localDb.snapshots.clear()]);
  const progress = emptyProgress('🐰');
  store = { caiDat: { hsCuoi: 'HS01', baiToi: 21 }, hs: { HS01: { ...progress, docTheo: 1 } } };
  game = {
    snapshot: () => structuredClone(store), selectedCode: () => 'HS01', selectStudent: vi.fn(), setLesson: vi.fn(),
    restoreStudent: (code: string, saved: StudentProgress) => { store.hs[code] = saved; },
  };
  await localDb.devices.put({ localCode: 'HS01', studentId, remoteCode: 'HS01', token: 'a'.repeat(64), avatar: '🐰', className: 'Lớp 1A',
    lesson: 21, status: 'approved', checkCode: 'ABC123', revision: 0, lastSnapshot: stableJson(progress) });
});
afterEach(() => vi.unstubAllGlobals());

test('retry after a lost server response keeps one history event and preserves progress', async () => {
  let revision = 0;
  let remote: StudentProgress | undefined;
  const history = new Set<string>();
  let loseFirstResponse = true;
  await recordEvent({ localCode: 'HS01', lesson: 21, activity: 'doc', item: 'ba', correct: null, occurredAt: new Date().toISOString() });
  rpc.mockImplementation(async (name: string, payload: Record<string, unknown>) => {
    if (name === 'read_student_device') return { data: { ...metadata, revision, ...(remote ? { progress: remote } : {}) } };
    revision++; remote = payload.p_progress as StudentProgress;
    for (const event of payload.p_events as { id: string }[]) history.add(event.id);
    if (loseFirstResponse) { loseFirstResponse = false; return { error: { message: 'Network connection lost after save' } }; }
    return { data: revision };
  });
  await syncDevice(game, 'HS01').catch(() => {});
  await syncDevice(game, 'HS01');
  expect({ queued: await localDb.events.count(), eventsOnServer: history.size, localReadings: store.hs.HS01.docTheo,
    serverReadings: remote?.docTheo, savedRevision: (await localDb.devices.get('HS01'))?.revision,
  }).toEqual({ queued: 0, eventsOnServer: 1, localReadings: 1, serverReadings: 1, savedRevision: 2 });
});

test('a dirty local snapshot never silently replaces newer cloud progress', async () => {
  rpc.mockResolvedValue({ data: { ...metadata, revision: 2, progress: { ...emptyProgress('🐰'), docTheo: 5 } } });
  let error = '';
  try { await syncDevice(game, 'HS01'); } catch (failure) { error = (failure as Error).message; }
  expect({ error, localReadings: store.hs.HS01.docTheo, saveCalls: rpc.mock.calls.filter(([name]) => name === 'save_student_device').length })
    .toEqual({ error: 'progress_conflict', localReadings: 1, saveCalls: 0 });
});

test('explicitly choosing cloud progress creates a local recovery snapshot first', async () => {
  rpc.mockImplementation(async (name: string) => name === 'read_student_device'
    ? { data: { ...metadata, revision: 2, progress: { ...emptyProgress('🐰'), docTheo: 5 } } }
    : { data: 3 });
  await syncDevice(game, 'HS01', 'remote');
  const backups = await localDb.snapshots.toArray();
  expect({ localReadings: store.hs.HS01.docTheo, backupReadings: backups[0]?.store.hs.HS01.docTheo }).toEqual({ localReadings: 5, backupReadings: 1 });
});
