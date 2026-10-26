import { requireStudentClient } from './client';
import { allocateLocalCode, backupBeforeRestore, emptyProgress, localDb } from './local';
import { classLookupSchema, deviceResponseSchema, type GameBridge, type StudentDevice } from './types';
import { stableJson } from './serialize';

export function readableError(error: unknown) {
  const message = error instanceof Error ? error.message : String((error as { message?: string })?.message || error);
  if (/PGRST202|function .*schema cache|relation .*does not exist/.test(message)) return 'Cô cần chạy bản cập nhật cơ sở dữ liệu trước khi dùng mã lớp.';
  if (message.includes('invalid_class_code')) return 'Chưa tìm thấy mã lớp. Kiểm tra lại mã cô gửi nhé.';
  if (message.includes('too_many_requests')) return 'Mã học sinh đã có nhiều máy chờ. Nhờ cô kiểm tra trước khi thêm máy.';
  if (message.includes('invalid_student_device')) return 'Máy này chưa được phép kết nối. Nhờ cô kiểm tra hoặc nhập lại mã lớp.';
  if (message.includes('progress_conflict')) return 'Có tiến trình mới trên máy khác. Bản trên máy này vẫn được giữ; mở Dành cho người lớn để chọn bản cần dùng.';
  if (/fetch|network|Failed to fetch/i.test(message)) return 'Chưa có mạng. Tiến trình vẫn lưu trên máy; app sẽ thử lại khi có mạng.';
  return message;
}

export async function lookupClass(code: string) {
  const { data, error } = await requireStudentClient().rpc('lookup_classroom', { p_code: code });
  if (error) throw error;
  return classLookupSchema.parse(data);
}

export async function joinClass(game: GameBridge, code: string, studentId: string) {
  const existing = await localDb.devices.where('studentId').equals(studentId).first();
  if (existing) {
    // Re-entering a class code is also the recovery path for a revoked/expired credential.
    const { data, error } = await requireStudentClient().rpc('read_student_device', { p_token: existing.token });
    if (!error && data) { game.selectStudent(existing.localCode, existing.lesson, existing.remoteCode); return existing; }
    if (error && !error.message.includes('invalid_student_device')) throw error;
  }
  const { data, error } = await requireStudentClient().rpc('request_student_device', { p_code: code, p_student_id: studentId });
  if (error) throw error;
  const response = deviceResponseSchema.parse(data);
  if (!response.device_token) throw new Error('Chưa tạo được kết nối. Thử lại nhé.');
  const store = game.snapshot();
  const localCode = existing?.localCode ?? allocateLocalCode(response.local_code, store, await localDb.devices.toArray());
  await backupBeforeRestore(store);
  const progress = existing ? store.hs[localCode] : emptyProgress(response.avatar);
  const device: StudentDevice = {
    localCode, studentId, remoteCode: response.local_code, token: response.device_token,
    avatar: response.avatar, className: response.class_name, lesson: response.lesson,
    status: response.status, checkCode: response.check_code, revision: existing?.revision ?? 0,
    lastSnapshot: existing?.lastSnapshot ?? stableJson(progress),
  };
  await localDb.devices.put(device);
  game.restoreStudent(localCode, progress, response.lesson);
  game.selectStudent(localCode, response.lesson, response.local_code);
  return device;
}

const active = new Set<string>();
export async function syncDevice(game: GameBridge, code: string, resolution?: 'local' | 'remote') {
  if (active.has(code)) return;
  active.add(code);
  try {
    let device = await localDb.devices.get(code);
    if (!device) return;
    const client = requireStudentClient();
    const { data, error } = await client.rpc('read_student_device', { p_token: device.token });
    if (error) throw error;
    const remote = deviceResponseSchema.parse(data);
    if (remote.student_id !== device.studentId) throw new Error('Kết nối không đúng hồ sơ. Nhờ cô kiểm tra.');
    device = { ...device, status: remote.status, lesson: remote.lesson, className: remote.class_name };
    await localDb.devices.put(device);
    game.setLesson(code, remote.lesson);
    if (remote.status === 'pending') return 'pending' as const;
    let progress = game.snapshot().hs[code];
    let snapshot = stableJson(progress);
    if ((remote.revision ?? 0) !== device.revision) {
      const clean = snapshot === device.lastSnapshot || (remote.progress && stableJson(remote.progress) === snapshot);
      if (!resolution && !clean) throw new Error('progress_conflict');
      if (!resolution && document.body.dataset.man !== 'dau') return 'newer' as const;
      await backupBeforeRestore(game.snapshot());
      if (resolution === 'local' && remote.progress) {
        const backup = game.snapshot();
        backup.hs[code] = remote.progress;
        await localDb.snapshots.put({ id: `remote-before-replace-${crypto.randomUUID()}`, store: backup, savedAt: new Date().toISOString() });
      } else if (remote.progress) {
        game.restoreStudent(code, remote.progress, remote.lesson);
        progress = remote.progress;
        snapshot = stableJson(progress);
      }
      device.revision = remote.revision ?? 0;
    }
    while (true) {
      const batch = await localDb.events.where('[localCode+synced]').equals([code, 0])
        .filter(event => event.ownerId === device!.studentId).limit(100).toArray();
      if (!batch.length && snapshot === device.lastSnapshot && device.revision > 0) break;
      const { data: revision, error: saveError } = await client.rpc('save_student_device', {
        p_token: device.token, p_progress: progress, p_expected_revision: device.revision,
        p_events: batch.map(event => ({ id: event.id, lesson: event.lesson, activity: event.activity,
          item: event.item, correct: event.correct, occurred_at: event.occurredAt })),
      });
      if (saveError) throw saveError;
      device.revision = Number(revision);
      device.lastSnapshot = snapshot;
      device.lastSync = new Date().toISOString();
      await localDb.transaction('rw', localDb.devices, localDb.events, async () => {
        await localDb.devices.put(device!);
        await localDb.events.bulkDelete(batch.map(event => event.id));
      });
      if (batch.length < 100) break;
    }
    device.lastSnapshot = snapshot;
    device.lastSync = new Date().toISOString();
    await localDb.devices.put(device);
    return 'saved' as const;
  } finally { active.delete(code); }
}
