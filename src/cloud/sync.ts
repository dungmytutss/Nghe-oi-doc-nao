import { requireSupabase } from './client';
import { localDb } from './local';
import { progressSchema, type GameBridge, type StudentBinding } from './types';

const CONFLICT = 'Có tiến trình trên máy khác. Tải bản trên mạng về trước hoặc sao lưu bản trên máy này để đối chiếu.';
const activeSyncs = new Set<string>();

async function requireOwner(code: string, userId: string) {
  const binding = await localDb.bindings.get(code);
  if (binding && binding.ownerId !== userId) {
    throw new Error('Mã trên máy này đã liên kết tài khoản khác. Đăng nhập tài khoản đó hoặc dùng mã HS khác.');
  }
  return binding;
}

async function findStudent(code: string, userId: string, avatar: string) {
  const client = requireSupabase();
  const { data, error } = await client.from('students').upsert({
    owner_id: userId, local_code: code, avatar,
  }, { onConflict: 'owner_id,local_code' }).select('id').single();
  if (error) throw error;
  return data.id as string;
}

export async function syncStudent(game: GameBridge, code: string, userId: string) {
  if (activeSyncs.has(code)) return;
  activeSyncs.add(code);
  try {
    const binding = await requireOwner(code, userId);
    const store = game.snapshot();
    const progress = progressSchema.parse(store.hs[code]);
    const lesson = store.caiDat.baiToi || 1;
    const studentId = binding?.studentId ?? await findStudent(code, userId, progress.conVat);
    const client = requireSupabase();
    const { data: remote, error: readError } = await client.from('student_progress')
      .select('revision').eq('student_id', studentId).maybeSingle();
    if (readError) throw readError;
    if ((remote?.revision ?? 0) !== (binding?.revision ?? 0)) throw new Error(CONFLICT);
    const snapshot = JSON.stringify({ progress, lesson });
    let revision = binding?.revision ?? 0;
    if (snapshot !== binding?.lastSnapshot) {
      const { data, error } = await client.rpc('save_student_progress', {
        p_student_id: studentId, p_progress: progress, p_lesson: lesson, p_expected_revision: revision,
      });
      if (error) {
        if (error.message.includes('progress_conflict')) throw new Error(CONFLICT);
        throw error;
      }
      revision = data as number;
    }
    const linked: StudentBinding = { localCode: code, ownerId: userId, studentId, revision, lastSnapshot: snapshot };
    await localDb.bindings.put(linked);
    // Claim only this student's unbound events, following the adult's explicit sync action.
    await localDb.transaction('rw', localDb.events, async () => {
      await localDb.events.where('[localCode+synced]').equals([code, 0])
        .filter(event => event.ownerId === null).modify({ ownerId: userId });
    });
    // Bounded batches keep requests small. Event IDs make retries idempotent.
    while (true) {
      const batch = await localDb.events.where('[localCode+synced]').equals([code, 0])
        .filter(event => event.ownerId === userId).limit(100).toArray();
      if (!batch.length) break;
      const { error } = await client.from('learning_history').upsert(batch.map(event => ({
        id: event.id, student_id: studentId, lesson: event.lesson, activity: event.activity,
        item: event.item, correct: event.correct, occurred_at: event.occurredAt,
      })), { onConflict: 'id', ignoreDuplicates: true });
      if (error) throw error;
      await localDb.events.bulkDelete(batch.map(event => event.id));
    }
  } finally {
    activeSyncs.delete(code);
  }
}

export async function restoreStudent(game: GameBridge, code: string, userId: string) {
  if (activeSyncs.has(code)) throw new Error('Đang đồng bộ mã này. Chờ một chút rồi thử lại.');
  activeSyncs.add(code);
  try {
    await requireOwner(code, userId);
    const client = requireSupabase();
    const { data: student, error } = await client.from('students').select('id')
      .eq('owner_id', userId).eq('local_code', code).maybeSingle();
    if (error) throw error;
    if (!student) throw new Error('Mã này chưa có bản lưu trên mạng.');
    const { data: remote, error: readError } = await client.from('student_progress')
      .select('progress, lesson, revision').eq('student_id', student.id).single();
    if (readError) throw readError;
    const progress = progressSchema.parse(remote.progress);
    // Save a backup before any local replacement, including on a new device.
    const { backupBeforeRestore } = await import('./local');
    await backupBeforeRestore(game.snapshot());
    game.restoreStudent(code, progress, remote.lesson);
    await localDb.bindings.put({ localCode: code, ownerId: userId, studentId: student.id,
      revision: remote.revision, lastSnapshot: JSON.stringify({ progress, lesson: remote.lesson }) });
  } finally {
    activeSyncs.delete(code);
  }
}
