import { useState, type FormEvent } from 'react';
import { joinClass, lookupClass, readableError } from '../cloud/student';
import type { ClassLookup, GameBridge, StudentDevice } from '../cloud/types';

export function StudentClassroom({ game, devices, onRefresh }: {
  game: GameBridge; devices: StudentDevice[]; onRefresh: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [classroom, setClassroom] = useState<ClassLookup | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selected = devices.find(device => device.localCode === game.selectedCode());
  async function lookup(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { setClassroom(await lookupClass(code)); } catch (error) { setError(readableError(error)); } finally { setBusy(false); }
  }
  async function choose(id: string) {
    setBusy(true); setError('');
    try { await joinClass(game, code, id); await onRefresh(); setClassroom(null); setCode(''); setOpen(false); }
    catch (error) { setError(readableError(error)); } finally { setBusy(false); }
  }
  return <section className="student-classroom" aria-label="Lớp của con">
    {selected && <div className="student-connection">
      <strong>{selected.avatar} {selected.remoteCode} · {selected.className}</strong>
      <small>{selected.status === 'pending' ? `Máy ${selected.checkCode} đang chờ cô xác nhận. Con vẫn học được nhé!` : 'Tiến trình tự gửi cho cô khi có mạng.'}</small>
    </div>}
    {devices.length > 1 && <div className="remembered-children" role="group" aria-label="Chọn bạn học trên máy này">
      {devices.map(device => <button key={device.studentId} className="nut-nho" aria-pressed={selected?.studentId === device.studentId}
        onClick={() => { game.selectStudent(device.localCode, device.lesson, device.remoteCode); void onRefresh(); }}>
        <span aria-hidden="true">{device.avatar}</span> {device.remoteCode} · {device.className}
      </button>)}
    </div>}
    <button className="nut-nho class-entry" onClick={() => { setOpen(!open); setError(''); }} aria-expanded={open}>🏫 {devices.length ? 'Nhập mã lớp / thêm bạn' : 'Có mã cô gửi? Nhập mã lớp'}</button>
    {open && <div className="class-enrollment">
      {!classroom ? <form className="cloud-form" onSubmit={lookup}>
        <label>Mã lớp cô gửi<input value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" autoComplete="off" spellCheck={false} placeholder="Ví dụ: 642891" maxLength={20} required /></label>
        <button className="nut nut-xanh" disabled={busy}>{busy ? 'Đang tìm lớp…' : 'Tìm lớp của con'}</button>
        <p className="goi-y">Chỉ nhập lần đầu. Không cần email hay mật khẩu.</p>
      </form> : <>
        <h3>{classroom.name} · Bài {classroom.lesson}</h3>
        <p>Chọn đúng mã và con vật cô đã giao cho con.</p>
        <div className="cloud-student-grid">{classroom.students.map(student => <button key={student.id} className="o-ma" disabled={busy}
          onClick={() => void choose(student.id)} aria-label={`Chọn ${student.local_code}`}><span>{student.avatar}</span>{student.local_code}</button>)}</div>
        <p className="goi-y">Cô xác nhận máy lần đầu để kết quả gửi đúng học sinh. Trong lúc chờ, con vẫn học bình thường.</p>
        <button className="nut-nho" disabled={busy} onClick={() => setClassroom(null)}>Nhập mã lớp khác</button>
      </>}
      {error && <p role="alert" className="cloud-message">{error}</p>}
    </div>}
  </section>;
}
