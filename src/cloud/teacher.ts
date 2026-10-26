import { requireSupabase } from './client';
import { progressSchema, type StudentProgress } from './types';

export interface Classroom { id: string; name: string; current_lesson: number; class_code: string }
export interface RosterStudent { id: string; local_code: string; avatar: string; progress?: StudentProgress; updatedAt?: string }
export interface DeviceRequest { id: string; student_id: string; status: string; check_code: string; created_at: string }

export function formatClassCode(code: string) { return code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code; }

export async function getClassrooms() {
  const { data, error } = await requireSupabase().from('classrooms').select('id,name,current_lesson,class_code').order('created_at');
  if (error) throw error;
  return data as Classroom[];
}
export async function createClassroom(name: string, count: number, lesson: number) {
  const { data, error } = await requireSupabase().rpc('create_classroom', { p_name: name, p_student_count: count, p_lesson: lesson });
  if (error) throw error;
  return data as string;
}
export async function setClassLesson(classId: string, lesson: number) {
  const { data, error } = await requireSupabase().from('classrooms').update({ current_lesson: lesson }).eq('id', classId).select('id').single();
  if (error || !data) throw error || new Error('Chưa cập nhật được bài học.');
}
export async function getClassRoster(classId: string) {
  const client = requireSupabase();
  const { data: students, error } = await client.from('students').select('id,local_code,avatar').eq('class_id', classId).order('local_code');
  if (error) throw error;
  const roster = students as RosterStudent[];
  if (!roster.length) return { roster, devices: [] as DeviceRequest[] };
  const ids = roster.map(student => student.id);
  const [progressResult, deviceResult] = await Promise.all([
    client.from('student_progress').select('student_id,progress,updated_at').in('student_id', ids),
    client.from('student_devices').select('id,student_id,status,check_code,created_at').in('student_id', ids).order('created_at'),
  ]);
  if (progressResult.error) throw progressResult.error;
  if (deviceResult.error) throw deviceResult.error;
  return {
    roster: roster.map(student => {
      const saved = progressResult.data.find(row => row.student_id === student.id);
      return { ...student, progress: saved ? progressSchema.safeParse(saved.progress).data : undefined, updatedAt: saved?.updated_at as string | undefined };
    }),
    devices: deviceResult.data as DeviceRequest[],
  };
}
export async function approveDevice(deviceId: string, status: 'approved' | 'revoked') {
  const { error } = await requireSupabase().rpc('set_student_device_status', { p_device_id: deviceId, p_status: status });
  if (error) throw error;
}
