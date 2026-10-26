import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { requireSupabase } from '../../cloud/client';

type Setup = { id: string; qr: string; secret: string };
export function TeacherMfa({ session, children }: { session: Session; children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'enroll' | 'challenge' | 'ready' | 'error'>('loading');
  const [factorId, setFactorId] = useState('');
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let live = true;
    setState('loading'); setSetup(null); setCode(''); setMessage('');
    void (async () => {
      try {
        const api = requireSupabase().auth.mfa;
        const { data: assurance, error: assuranceError } = await api.getAuthenticatorAssuranceLevel();
        if (assuranceError) throw assuranceError;
        if (assurance.currentLevel === 'aal2') { if (live) setState('ready'); return; }
        const { data, error } = await api.listFactors(); if (error) throw error;
        if (!live) return;
        const factor = data.totp[0];
        setFactorId(factor?.id || ''); setState(factor ? 'challenge' : 'enroll');
      } catch { if (live) { setState('error'); setMessage('Không thể kiểm tra xác thực hai bước. Kiểm tra kết nối rồi thử lại.'); } }
    })();
    return () => { live = false; };
  }, [session.access_token, retry]);

  async function enroll() {
    setBusy(true); setMessage('');
    try {
      const api = requireSupabase().auth.mfa;
      const { data: factors, error: listError } = await api.listFactors(); if (listError) throw listError;
      // Only discard unfinished TOTP setups after the teacher explicitly starts again.
      for (const factor of factors.all.filter(item => item.factor_type === 'totp' && item.status === 'unverified')) {
        const { error } = await api.unenroll({ factorId: factor.id }); if (error) throw error;
      }
      const { data, error } = await api.enroll({ factorType: 'totp', friendlyName: 'Nghé ơi, đọc nào', issuer: 'Nghe oi doc nao' });
      if (error) throw error;
      setSetup({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret }); setFactorId(data.id); setCode('');
    } catch { setMessage('Chưa thiết lập được xác thực hai bước. Kiểm tra kết nối và bảo đảm TOTP đã được bật trong Supabase Auth.'); }
    finally { setBusy(false); }
  }
  async function verify(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const { error } = await requireSupabase().auth.mfa.challengeAndVerify({ factorId, code });
      if (error) throw error;
      setSetup(null); setCode(''); setRetry(value => value + 1);
    } catch { setMessage('Chưa xác nhận được mã. Nhập mã 6 số hiện tại trong ứng dụng xác thực và kiểm tra giờ trên điện thoại.'); }
    finally { setBusy(false); }
  }
  if (state === 'ready') return <>{children}</>;
  return <section className="teacher-mfa" aria-labelledby="teacher-mfa-title">
    <h4 id="teacher-mfa-title">Xác thực hai bước</h4>
    {state === 'loading' ? <p role="status">Đang kiểm tra xác thực…</p> : <>
      {state === 'enroll' && !setup && <>
        <p>Thiết lập ứng dụng xác thực để bảo vệ lớp và mã học sinh. Sau bước mật khẩu, giáo viên cần nhập mã 6 số từ ứng dụng này.</p>
        <p>Có thể dùng ứng dụng xác thực hỗ trợ TOTP trên điện thoại. Nếu mất quyền truy cập ứng dụng, cần liên hệ quản trị viên để khôi phục; đặt lại mật khẩu không bỏ qua bước này.</p>
        <button className="nut-nho" disabled={busy} onClick={() => void enroll()}>Thiết lập xác thực hai bước</button>
      </>}
      {setup && <>
        <p>Trong ứng dụng xác thực, chọn thêm tài khoản rồi quét mã QR. Khi dùng cùng một điện thoại, có thể nhập khóa thiết lập bên dưới.</p>
        <img className="mfa-qr" src={setup.qr} alt="Mã QR để thêm tài khoản vào ứng dụng xác thực" width="220" height="220" />
        <details><summary>Nhập khóa thiết lập thủ công</summary><p><code className="mfa-secret">{setup.secret}</code></p><p>Giữ khóa này riêng tư. Không gửi cho người khác.</p></details>
      </>}
      {(setup || state === 'challenge') && <form className="cloud-form" onSubmit={verify}>
        <label>Mã xác thực 6 số<input value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required autoFocus /></label>
        <button className="nut nut-tim" disabled={busy}>{busy ? 'Đang xác nhận…' : 'Xác nhận mã'}</button>
      </form>}
      {state === 'error' && <button className="nut-nho" onClick={() => setRetry(value => value + 1)}>Thử lại</button>}
    </>}
    {message && <p role="alert" className="cloud-message">{message}</p>}
  </section>;
}
