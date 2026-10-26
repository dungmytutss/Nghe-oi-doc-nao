import { ClassroomManager } from './ClassroomManager';
import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../cloud/client';
import { readableError } from '../../cloud/student';

function authError(error: unknown) {
  const message = readableError(error);
  if (/Invalid login credentials/.test(message)) return 'Email hoặc mật khẩu không chính xác. Kiểm tra lại thông tin hoặc sử dụng chức năng đặt lại mật khẩu.';
  if (/Email not confirmed/.test(message)) return 'Cần xác nhận email trước khi đăng nhập.';
  if (/rate limit/i.test(message)) return 'Đã vượt số lần yêu cầu cho phép. Vui lòng thử lại sau.';
  return message;
}

export function TeacherAccount() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!supabase) return;
    let live = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!live) return;
      if (error) setMessage(authError(error));
      else setSession(data.session);
    }).catch(error => { if (live) setMessage(authError(error)); });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === 'PASSWORD_RECOVERY') setMode('recovery');
    });
    return () => { live = false; data.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    setRole('');
    if (!session || !supabase) return;
    let live = true;
    void supabase.from('profiles').select('role').eq('id', session.user.id).single().then(({ data, error }) => {
      if (!live) return;
      if (error) setMessage(readableError(error)); else setRole(data.role as string);
    });
    return () => { live = false; };
  }, [session?.user.id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage('');
    try {
      if (mode === 'recovery') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMode('login'); setMessage('Đã đổi mật khẩu.');
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password,
          options: { emailRedirectTo: location.origin + location.pathname } });
        if (error) throw error;
        setMessage(data.session ? 'Đã tạo tài khoản.' : 'Đã gửi email xác nhận. Mở liên kết trong email để kích hoạt tài khoản trước khi đăng nhập.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
      setPassword('');
    } catch (error) { setMessage(authError(error)); } finally { setBusy(false); }
  }
  async function forgotPassword() {
    if (!supabase || !email.trim()) { setMessage('Nhập email tài khoản trước khi yêu cầu đặt lại mật khẩu.'); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin + location.pathname });
      if (error) throw error;
      setMessage('Nếu email đã được đăng ký, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu.');
    } catch (error) { setMessage(authError(error)); } finally { setBusy(false); }
  }
  if (!supabase) return <p>Chưa cấu hình kết nối cơ sở dữ liệu. Chế độ khách vẫn có thể sử dụng trên thiết bị.</p>;
  return <section aria-labelledby="teacher-account-title">
    <h3 id="teacher-account-title">Tài khoản giáo viên</h3>
    <p>Đăng nhập để quản lý lớp, cấp mã học sinh và theo dõi tiến độ. Phụ huynh không cần tài khoản.</p>
    {session && mode !== 'recovery' ? <>
      <p>Đã đăng nhập: <strong>{session.user.email}</strong></p>
      {role === 'teacher' ? <ClassroomManager /> : <p role="status">{role ? 'Tài khoản chưa được cấp quyền giáo viên. Liên hệ quản trị viên để được cấp quyền.' : 'Đang kiểm tra quyền giáo viên…'}</p>}
      <button className="nut-nho" disabled={busy} onClick={() => {
        setBusy(true);
        void supabase!.auth.signOut().then(({ error }) => { if (error) setMessage(authError(error)); }).finally(() => setBusy(false));
      }}>Đăng xuất</button>
    </> : <form onSubmit={submit} className="cloud-form">
      {mode !== 'recovery' && <label>Email<input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label>}
      <label>{mode === 'recovery' ? 'Mật khẩu mới' : 'Mật khẩu'}<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} value={password} onChange={e => setPassword(e.target.value)} required /></label>
      <button className="nut nut-tim" disabled={busy}>{busy ? 'Đang xử lý…' : mode === 'signup' ? 'Tạo tài khoản' : mode === 'recovery' ? 'Lưu mật khẩu mới' : 'Đăng nhập'}</button>
      {mode !== 'recovery' && <div className="cloud-actions">
        <button type="button" className="nut-nho" disabled={busy} onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); }}>{mode === 'login' ? 'Chưa có tài khoản? Tạo mới' : 'Đã có tài khoản? Đăng nhập'}</button>
        <button type="button" className="nut-nho" disabled={busy} onClick={() => void forgotPassword()}>Quên mật khẩu</button>
      </div>}
    </form>}
    {message && <p role="status" className="cloud-message">{message}</p>}
  </section>;
}
