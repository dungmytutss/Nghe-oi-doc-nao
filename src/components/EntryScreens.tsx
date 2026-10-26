import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { localDb } from '../cloud/local';
import { prepareGuest } from '../cloud/guest';
import { readableError } from '../cloud/student';
import type { GameBridge, StudentDevice } from '../cloud/types';
import { StudentCodeEntry } from './StudentCodeEntry';
import { TeacherAccount } from './teacher/TeacherAccount';
import { hashes, readScreen, type Screen } from './entry/navigation';

export function EntryScreens({ game, devices, onRefresh }: { game: GameBridge; devices: StudentDevice[]; onRefresh: () => Promise<void> }) {
  const [screen, setScreen] = useState<Screen>(() => readScreen());
  const [message, setMessage] = useState('');
  const route = useRef(screen);
  route.current = screen;
  const preview = document.body.classList.contains('chup');
  const navigate = useCallback((next: Screen) => {
    game.closeDialogs(); setMessage('');
    if (location.hash !== hashes[next]) location.hash = hashes[next];
    setScreen(next);
    window.scrollTo(0, 0);
  }, [game]);

  useEffect(() => {
    const changed = () => setScreen(readScreen());
    const teacher = () => navigate('teacher');
    window.addEventListener('hashchange', changed);
    window.addEventListener('nghe-open-teacher', teacher);
    return () => { window.removeEventListener('hashchange', changed); window.removeEventListener('nghe-open-teacher', teacher); };
  }, [game, navigate]);
  useEffect(() => {
    if (preview) return;
    const gameRoot = document.getElementById('game-root')!;
    gameRoot.hidden = screen === 'choose' || screen === 'code' || screen === 'teacher';
    document.body.dataset.entryScreen = screen;
    if (screen === 'guest') {
      void prepareGuest(game, () => route.current === 'guest').catch(error => setMessage(readableError(error)));
    }
    if (screen === 'student') {
      void localDb.devices.get(game.selectedCode()).then(device => {
        if (!device && route.current === 'student') navigate('code');
      }).catch(error => setMessage(readableError(error)));
    }
    return () => { gameRoot.hidden = false; delete document.body.dataset.entryScreen; };
  }, [screen, game, preview, navigate]);
  if (preview) return null;

  const homeSlot = document.getElementById('student-classroom');
  const selected = devices.find(device => device.localCode === game.selectedCode());
  const fullScreen = screen === 'choose' || screen === 'code' || screen === 'teacher';
  return <>
    {fullScreen && <main className={`entry-page entry-page-${screen}`}>
      <header className="entry-header"><a href="#bat-dau" className="entry-brand">🐃 Nghé ơi, đọc nào!</a>
        <nav aria-label="Dành cho giáo viên"><a href="#goc-co" aria-current={screen === 'teacher' ? 'page' : undefined}>👩‍🏫 Góc của cô</a></nav>
      </header>
      {screen === 'choose' && <section className="entry-welcome" aria-labelledby="entry-title">
        <div className="entry-mascot" aria-hidden="true">🐃</div><p className="entry-eyebrow">Mỗi ngày một chút, đọc hay hơn mỗi ngày</p>
        <h1 id="entry-title">Chọn cách bắt đầu</h1><p>Sử dụng mã học sinh do giáo viên cấp hoặc tiếp tục ở chế độ khách.</p>
        <div className="entry-choices">
          <button className="entry-choice" onClick={() => navigate('code')}><span aria-hidden="true">🎟️</span><strong>Nhập mã học sinh</strong><small>Mở hồ sơ học sinh và đồng bộ tiến độ với lớp.</small></button>
          <button className="entry-choice guest-choice" onClick={() => navigate('guest')}><span aria-hidden="true">🌱</span><strong>Tiếp tục với tư cách khách</strong><small>Lưu một tiến trình trên thiết bị này. Có thể xuất mã để sao lưu.</small></button>
        </div>
        {!!devices.length && <section className="entry-remembered" aria-label="Hồ sơ học sinh trên thiết bị"><h2>Hồ sơ đã lưu trên thiết bị</h2>
          <div className="remembered-children">{devices.map(device => <button key={device.studentId} className="nut-nho" onClick={() => {
            game.setEntryMode('student'); game.selectStudent(device.localCode, game.currentLesson(device.localCode), device.remoteCode); navigate('student');
          }}>{device.avatar} {device.remoteCode} · {device.className}</button>)}</div>
        </section>}
      </section>}
      {screen === 'code' && <section className="entry-card" aria-labelledby="code-screen-title"><h1 id="code-screen-title">🎟️ Nhập mã học sinh</h1>
        <p>Mã được giáo viên cấp riêng cho từng học sinh. Hồ sơ sẽ được ghi nhớ trên thiết bị sau lần nhập đầu tiên.</p>
        <StudentCodeEntry game={game} onJoined={async () => { await onRefresh(); navigate('student'); }} />
        <p>Chưa có mã? <a href="#khach">Tiếp tục với tư cách khách</a>.</p>
      </section>}
      {screen === 'teacher' && <section className="entry-card teacher-workspace" aria-labelledby="teacher-screen-title">
        <h1 id="teacher-screen-title">👩‍🏫 Góc của cô</h1><p>Quản lý lớp, cấp mã học sinh và theo dõi tiến độ học tập.</p>
        <TeacherAccount />
        <section className="teacher-local-tools"><h2>Công cụ dạy học trên thiết bị</h2><p>Trình chiếu bài học và tổng hợp kết quả từ mã tiến trình do phụ huynh gửi.</p>
          <div className="cloud-actions"><button className="nut-nho" onClick={() => { navigate('tools'); game.openTeacherTool('tivi'); }}>📺 Mở chế độ ti vi</button>
          <button className="nut-nho" onClick={() => { navigate('tools'); game.openTeacherTool('co'); }}>📊 Xem mã kết quả / bản đồ lỗi</button></div>
        </section>
      </section>}
    </main>}
    {homeSlot && (screen === 'guest' || screen === 'student') && createPortal(<section className="learner-mode">
      <div className="cloud-actions"><button className="nut-nho" onClick={() => navigate('choose')}>‹ Trang chủ</button><button className="nut-nho" onClick={() => navigate('teacher')}>👩‍🏫 Góc của cô</button></div>
      {screen === 'guest' ? <>
        <h2>🌱 Chế độ khách</h2><p>Thiết bị chỉ lưu một tiến trình khách. Xuất mã tiến trình để sao lưu hoặc chuyển sang thiết bị khác.</p>
        <div className="cloud-actions"><button className="nut-nho" onClick={() => game.exportProgress()}>📋 Xuất mã tiến trình</button><button className="nut-nho" onClick={() => game.importGuestProgress()}>📂 Nhập mã tiến trình</button></div>
      </> : selected && <div className="student-connection"><strong>{selected.avatar} {selected.remoteCode} · {selected.className}</strong><small>{selected.status === 'pending' ? `Máy ${selected.checkCode} đang chờ cô xác nhận. Con vẫn học được nhé!` : 'Tiến trình tự gửi cho cô khi có mạng.'}</small></div>}
    </section>, homeSlot)}
    {screen === 'tools' && <button className="teacher-return nut-nho" onClick={() => navigate('teacher')}>‹ Về Góc của cô</button>}
    {message && <p role="alert" className="entry-error">{message}</p>}
  </>;
}
