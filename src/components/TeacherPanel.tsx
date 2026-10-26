import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../cloud/client';
import { readableError } from '../cloud/student';
import { approveDevice, createClassroom, formatClassCode, getClassrooms, getClassRoster, setClassLesson,
  type Classroom, type DeviceRequest, type RosterStudent } from '../cloud/teacher';

function authError(error: unknown) {
  const message = readableError(error);
  if (/Invalid login credentials/.test(message)) return 'Email hoặc mật khẩu chưa đúng. Kiểm tra lại hoặc chọn Quên mật khẩu.';
  if (/Email not confirmed/.test(message)) return 'Cô mở email xác nhận tài khoản trước nhé.';
  if (/rate limit/i.test(message)) return 'Đã gửi nhiều yêu cầu. Chờ vài phút rồi thử lại nhé.';
  return message;
}

export function TeacherPanel() {
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
        setMessage(data.session ? 'Đã tạo tài khoản.' : 'Cô mở hộp thư và bấm xác nhận email, sau đó quay lại đăng nhập.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
      setPassword('');
    } catch (error) { setMessage(authError(error)); } finally { setBusy(false); }
  }
  async function forgotPassword() {
    if (!supabase || !email.trim()) { setMessage('Cô nhập email trước, rồi bấm Quên mật khẩu.'); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin + location.pathname });
      if (error) throw error;
      setMessage('Nếu email có tài khoản, cô sẽ nhận được thư đặt lại mật khẩu.');
    } catch (error) { setMessage(authError(error)); } finally { setBusy(false); }
  }
  if (!supabase) return <p>Máy này chưa cấu hình kết nối lớp. Con vẫn học và lưu trên máy bình thường.</p>;
  return <section aria-labelledby="teacher-account-title">
    <h3 id="teacher-account-title">👩‍🏫 Tài khoản của cô</h3>
    <p>Chỉ giáo viên cần đăng nhập. Phụ huynh nhập mã lớp ở trang đầu.</p>
    {session && mode !== 'recovery' ? <>
      <p>Đã đăng nhập: <strong>{session.user.email}</strong></p>
      {role === 'teacher' ? <ClassroomManager /> : <p role="status">{role ? 'Tài khoản đang chờ cấp quyền giáo viên. Cô liên hệ người quản lý app nhé.' : 'Đang kiểm tra quyền giáo viên…'}</p>}
      <button className="nut-nho" disabled={busy} onClick={() => {
        setBusy(true);
        void supabase!.auth.signOut().then(({ error }) => { if (error) setMessage(authError(error)); }).finally(() => setBusy(false));
      }}>Đăng xuất</button>
    </> : <form onSubmit={submit} className="cloud-form">
      {mode !== 'recovery' && <label>Email của cô<input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label>}
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

function ClassroomManager() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [devices, setDevices] = useState<DeviceRequest[]>([]);
  const [name, setName] = useState('Lớp 1A');
  const [count, setCount] = useState(30);
  const [startLesson, setStartLesson] = useState(1);
  const [lesson, setLesson] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [revokeId, setRevokeId] = useState('');
  const selected = classes.find(item => item.id === selectedId);
  const refreshClasses = useCallback(async () => {
    const list = await getClassrooms();
    setClasses(list);
    setSelectedId(current => list.some(item => item.id === current) ? current : list[0]?.id || '');
  }, []);
  const refreshRoster = useCallback(async () => {
    if (!selectedId) return;
    const result = await getClassRoster(selectedId);
    setRoster(result.roster); setDevices(result.devices);
  }, [selectedId]);
  useEffect(() => { void refreshClasses().catch(error => setMessage(readableError(error))); }, [refreshClasses]);
  useEffect(() => {
    setRoster([]); setDevices([]);
    let active = true;
    const refresh = async () => {
      try {
        if (!selectedId) return;
        const result = await getClassRoster(selectedId);
        if (active) { setRoster(result.roster); setDevices(result.devices); }
      } catch (error) { if (active) setMessage(readableError(error)); }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 30000);
    return () => { active = false; clearInterval(interval); };
  }, [selectedId]);
  useEffect(() => { if (selected) setLesson(selected.current_lesson); }, [selected?.id, selected?.current_lesson]);
  async function task(action: () => Promise<void>) {
    setBusy(true); setMessage('');
    try { await action(); } catch (error) { setMessage(readableError(error)); } finally { setBusy(false); }
  }
  async function generate(event: FormEvent) {
    event.preventDefault();
    await task(async () => {
      const id = await createClassroom(name.trim(), count, startLesson);
      await refreshClasses(); setSelectedId(id);
      setMessage('Đã tạo lớp và mã cho phụ huynh.');
    });
  }
  function exportCsv() {
    const rows = [['ma_hs', 'luot_doc', 'phut_luyen', 'cap_nhat'], ...roster.map(student => [student.local_code,
      String(student.progress?.docTheo || 0), String(Object.values(student.progress?.phut || {}).reduce((a, b) => a + b, 0)), student.updatedAt || ''])];
    const content = '\ufeff' + rows.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'tien-trinh-lop.csv'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="classroom-manager">
    <details open={!classes.length}>
      <summary>Tạo lớp và mã lớp mới</summary>
      <form onSubmit={generate} className="cloud-form">
        <label>Tên lớp<input value={name} maxLength={80} onChange={e => setName(e.target.value)} required /></label>
        <div className="cloud-fields">
          <label>Bắt đầu từ bài<input type="number" min={1} max={50} value={startLesson} onChange={e => setStartLesson(Number(e.target.value))} required /></label>
          <label>Số học sinh<input type="number" min={1} max={40} value={count} onChange={e => setCount(Number(e.target.value))} required /></label>
        </div>
        <button className="nut nut-tim" disabled={busy}>{busy ? 'Đang tạo…' : 'Tạo lớp và mã lớp'}</button>
      </form>
    </details>
    {!!classes.length && <label className="cloud-label">Chọn lớp<select value={selectedId} disabled={busy} onChange={e => setSelectedId(e.target.value)}>{classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
    {selected && <>
      <div className="class-code"><span>Mã phụ huynh nhập một lần</span><strong>{formatClassCode(selected.class_code)}</strong>
        <button className="nut-nho" onClick={() => void task(async () => {
          await navigator.clipboard.writeText(`Lớp ${selected.name}: mở ${location.origin + location.pathname}, bấm Nhập mã lớp và nhập ${formatClassCode(selected.class_code)}. Sau đó chọn đúng mã học sinh cô đã giao.`);
          setMessage('Đã chép hướng dẫn để cô gửi qua Zalo.');
        })}>Chép mã và hướng dẫn gửi phụ huynh</button>
      </div>
      <form className="cloud-form" onSubmit={event => { event.preventDefault(); void task(async () => {
        await setClassLesson(selected.id, lesson); await refreshClasses(); setMessage('Đã cập nhật bài học cho cả lớp.');
      }); }}>
        <label>Bài cả lớp đang học<input type="number" min={1} max={50} value={lesson} onChange={e => setLesson(Number(e.target.value))} required /></label>
        <button className="nut-nho" disabled={busy}>Lưu bài cho cả lớp</button>
      </form>
      <h4>Máy xin vào lớp</h4>
      <p>Đối chiếu mã học sinh và mã máy với gia đình qua Zalo trước khi xác nhận. Mỗi lần mở app sau đó không cần xin lại.</p>
      {!devices.some(device => device.status === 'pending') && <p>Chưa có máy nào đang chờ.</p>}
      <ul className="device-list">{devices.filter(device => device.status !== 'revoked').map(device => {
        const student = roster.find(item => item.id === device.student_id);
        return <li key={device.id}>
          <strong>{student?.avatar} {student?.local_code}</strong> · mã máy <b>{device.check_code}</b>
          <span>{device.status === 'pending' ? 'Đang chờ' : 'Đã kết nối'}</span>
          {device.status === 'pending' && <button className="nut-nho" disabled={busy} onClick={() => void task(async () => {
            await approveDevice(device.id, 'approved'); await refreshRoster(); setMessage('Đã cho phép máy của học sinh kết nối.');
          })}>Xác nhận đúng gia đình</button>}
          {revokeId === device.id ? <div className="cloud-actions">
            <button className="nut-nho" disabled={busy} onClick={() => void task(async () => { await approveDevice(device.id, 'revoked'); setRevokeId(''); await refreshRoster(); })}>Đồng ý ngắt kết nối máy này</button>
            <button className="nut-nho" onClick={() => setRevokeId('')}>Hủy</button>
          </div> : <button className="nut-nho" disabled={busy} onClick={() => setRevokeId(device.id)}>{device.status === 'pending' ? 'Từ chối' : 'Ngắt kết nối'}</button>}
        </li>;
      })}</ul>
      <h4>Tiến trình học sinh</h4>
      <div className="cloud-actions"><button className="nut-nho" disabled={busy} onClick={() => void task(refreshRoster)}>Làm mới kết quả</button><button className="nut-nho" onClick={exportCsv}>Tải báo cáo CSV</button></div>
      <div className="roster-scroll"><table className="cloud-roster"><thead><tr><th>Học sinh</th><th>Lượt đọc</th><th>Phút học</th><th>Cần ôn</th><th>Lưu gần nhất</th></tr></thead><tbody>
        {roster.map(student => <tr key={student.id}><th>{student.avatar} {student.local_code}</th><td>{student.progress?.docTheo || 0}</td>
          <td>{Math.round(Object.values(student.progress?.phut || {}).reduce((a, b) => a + b, 0))}</td>
          <td>{Object.entries(student.progress?.muc || {}).filter(([, value]) => value.s > value.d).slice(0, 3).map(([key]) => key.replace(/^t:/, '')).join(', ') || '—'}</td>
          <td>{student.updatedAt ? new Date(student.updatedAt).toLocaleString('vi-VN') : 'Chưa gửi'}</td></tr>)}
      </tbody></table></div>
      <p>Máy đang học không có mạng sẽ gửi kết quả khi kết nối lại. Góc của cô và chế độ ti vi cũ vẫn dùng được bên dưới.</p>
    </>}
    {message && <p role="status" className="cloud-message">{message}</p>}
  </div>;
}
