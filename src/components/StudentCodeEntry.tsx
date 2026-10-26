import { useState, type FormEvent } from 'react';
import { enterStudentCode, readableError } from '../cloud/student';
import { parseStudentCode } from '../cloud/codes';
import type { GameBridge } from '../cloud/types';

export function StudentCodeEntry({ game, onJoined }: { game: GameBridge; onJoined: () => Promise<void> }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const parsed = parseStudentCode(code);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await enterStudentCode(game, code); await onJoined(); }
    catch (error) { setMessage(readableError(error)); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="cloud-form">
    <label>Mã học sinh<textarea className="student-code-input" value={code} onChange={event => setCode(event.target.value)}
      autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="NGHE1-SB-C…-HS…-B…-…" maxLength={200} required /></label>
    <p>Dán đầy đủ mã do giáo viên cung cấp. Hệ thống sẽ xác định lớp và hồ sơ học sinh; không cần đăng ký tài khoản.</p>
    {parsed && <dl className="code-breakdown" aria-label="Thông tin nhận diện mã"><div><dt>Lớp</dt><dd>{parsed.classRef}</dd></div><div><dt>Học sinh</dt><dd>{parsed.student}</dd></div><div><dt>Bài bắt đầu</dt><dd>{parsed.startLesson}</dd></div><div><dt>Nơi lưu</dt><dd>{parsed.storage}</dd></div></dl>}
    <button className="nut nut-xanh" disabled={busy}>{busy ? 'Đang mở hồ sơ…' : 'Mở hồ sơ học sinh'}</button>
    <p className="goi-y">Mã nhận diện được giữ nguyên. Tiến độ và vị trí bài học được cập nhật trong hồ sơ.</p>
    {message && <p className="cloud-message" role="alert">{message}</p>}
  </form>;
}
