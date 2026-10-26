import { requireStudentClient } from './client';
import { allocateLocalCode, backupBeforeRestore, emptyProgress, localDb } from './local';
import { deviceResponseSchema, type GameBridge, type StudentDevice } from './types';
import { stableJson } from './serialize';
import { parseStudentCode } from './codes';

export function readableError(error: unknown) {
  const message = error instanceof Error ? error.message : String((error as { message?: string })?.message || error);
  if (/PGRST202|schema cache|relation .*does not exist/.test(message)) return 'Cô cần chạy bản cập nhật cơ sở dữ liệu trước khi dùng mã học sinh.';
  if (message.includes('invalid_class_code')) return 'Chưa tìm thấy mã lớp. Kiểm tra lại mã cô gửi nhé.';
  if (message.includes('invalid_student_code')) return 'Mã học sinh không hợp lệ hoặc chưa được cấp. Kiểm tra và dán đầy đủ mã do giáo viên cung cấp.';
  if (message.includes('device_limit_reached')) return 'Hồ sơ đã đạt giới hạn ba thiết bị. Liên hệ giáo viên để ngắt thiết bị cũ trước khi thêm thiết bị mới.';
  if (message.includes('rate_limited')) return 'Đã vượt số lần yêu cầu cho phép. Hệ thống sẽ thử lại sau.';
  if (/gateway_not_configured|gateway_required|upstream_unavailable/.test(message)) return 'Kết nối bảo mật chưa sẵn sàng. Tiến trình trên thiết bị vẫn được giữ.';
  if (message.includes('too_many_requests')) return 'Mã học sinh đã có nhiều máy chờ. Nhờ cô kiểm tra trước khi thêm máy.';
  if (message.includes('invalid_student_device')) return 'Máy này chưa được phép kết nối. Nhờ cô kiểm tra hoặc nhập lại mã lớp.';
  if (message.includes('progress_conflict')) return 'Có tiến trình mới trên máy khác. Bản trên máy này vẫn được giữ; mở Dành cho người lớn để chọn bản cần dùng.';
  if (/fetch|network|Failed to fetch/i.test(message)) return 'Không thể kết nối mạng. Tiến trình vẫn được lưu trên thiết bị và sẽ đồng bộ khi kết nối trở lại.';
  return message;
}

export async function enterStudentCode(game: GameBridge, value: string) {
  const parsed = parseStudentCode(value);
  if (!parsed) throw new Error('invalid_student_code');
  const codeHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(parsed.code))))
    .map(byte => byte.toString(16).padStart(2,'0')).join('');
  const remembered = await localDb.devices.where('codeHash').equals(codeHash).first();
  const payload: Record<string, unknown> = { p_code: parsed.code };
  if (import.meta.env.VITE_STUDENT_GATEWAY_URL) payload.p_device_token = remembered?.token ?? null;
  const { data, error } = await requireStudentClient().rpc('redeem_student_code', payload);
  if (error) throw error;
  const response = deviceResponseSchema.parse(data);
  if (!response.device_token) throw new Error('Chưa nhận được kết nối cho học sinh.');
  const existing = await localDb.devices.where('studentId').equals(response.student_id).first();
  const store = game.snapshot();
  const localCode = existing?.localCode ?? allocateLocalCode(response.local_code, store, await localDb.devices.toArray());
  if (!existing) await backupBeforeRestore(store);
  const progress = existing ? store.hs[localCode] : response.progress || emptyProgress(response.avatar);
  const lesson = existing ? game.currentLesson(localCode) : response.lesson;
  const device: StudentDevice = {
    localCode, studentId: response.student_id, remoteCode: response.local_code, token: response.device_token,
    avatar: response.avatar, className: response.class_name, lesson, status: 'approved', checkCode: response.check_code,
    revision: existing?.revision ?? response.revision ?? 0,
    lastSnapshot: existing?.lastSnapshot ?? stableJson(progress), lastLesson: existing?.lastLesson ?? lesson,
    codeHash,
  };
  await localDb.devices.put(device);
  if (!existing) game.restoreStudent(localCode, progress, lesson);
  game.setEntryMode('student'); game.selectStudent(localCode, lesson, response.local_code);
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
    let currentLesson = game.currentLesson(code);
    const lessonDirty = currentLesson !== (device.lastLesson ?? device.lesson);
    device = { ...device, status: remote.status, lesson: remote.lesson, className: remote.class_name };
    await localDb.devices.put(device);
    if (!lessonDirty) game.setLesson(code, remote.lesson);
    if (remote.status === 'pending') return 'pending' as const;
    let progress = game.snapshot().hs[code];
    let snapshot = stableJson(progress);
    if ((remote.revision ?? 0) !== device.revision) {
      const clean = (snapshot === device.lastSnapshot && !lessonDirty) || (remote.progress && stableJson(remote.progress) === snapshot && currentLesson === remote.lesson);
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
        currentLesson = remote.lesson;
      }
      device.revision = remote.revision ?? 0;
    }
    while (true) {
      const batch = await localDb.events.where('[localCode+synced]').equals([code, 0])
        .filter(event => event.ownerId === device!.studentId).limit(100).toArray();
      if (!batch.length && snapshot === device.lastSnapshot && currentLesson === (device.lastLesson ?? device.lesson) && device.revision > 0) break;
      const { data: revision, error: saveError } = await client.rpc('save_student_code_progress', {
        p_token: device.token, p_progress: progress, p_expected_revision: device.revision,
        p_lesson: currentLesson,
        p_events: batch.map(event => ({ id: event.id, lesson: event.lesson, activity: event.activity,
          item: event.item, correct: event.correct, occurred_at: event.occurredAt })),
      });
      if (saveError) throw saveError;
      device.revision = Number(revision);
      device.lastSnapshot = snapshot;
      device.lastLesson = currentLesson;
      device.lesson = currentLesson;
      device.lastSync = new Date().toISOString();
      await localDb.transaction('rw', localDb.devices, localDb.events, async () => {
        await localDb.devices.put(device!);
        await localDb.events.bulkDelete(batch.map(event => event.id));
      });
      if (batch.length < 100) break;
    }
    device.lastSnapshot = snapshot;
    device.lastLesson = currentLesson;
    device.lesson = currentLesson;
    device.lastSync = new Date().toISOString();
    await localDb.devices.put(device);
    return 'saved' as const;
  } finally { active.delete(code); }
}
