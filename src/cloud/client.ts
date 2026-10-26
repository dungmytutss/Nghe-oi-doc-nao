import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
export const supabase = url && key ? createClient(url, key) : null;
// Student capabilities stay independent of the teacher's Auth session on shared devices.
const studentClient = url && key ? createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
}) : null;

export function requireStudentClient() {
  if (!studentClient) throw new Error('Chưa kết nối máy chủ. Con vẫn học trên máy này.');
  return studentClient;
}

export function requireSupabase() {
  if (!supabase) throw new Error('Chưa kết nối máy chủ. App vẫn học và lưu trên máy này.');
  return supabase;
}
