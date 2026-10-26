import { createRoot } from 'react-dom/client';
import screens from './game/screens.html?raw';
import './game/game.css';
import './components/cloud.css';
import { initializeGame } from './game/engine';
import { recordEvent, reportStorageFailure, saveSnapshot, localDb } from './cloud/local';
import { CloudSettings } from './components/CloudSettings';
import { registerSW } from 'virtual:pwa-register';

async function start() {
  // Retain the original key. Recover from IndexedDB only if browser-local data is absent.
  try {
    if (!localStorage.getItem('nghe-oi-doc-nao.v1')) {
      const backup = await localDb.snapshots.get('current');
      if (backup) localStorage.setItem('nghe-oi-doc-nao.v1', JSON.stringify(backup.store));
    }
  } catch { /* The original teaching engine handles unavailable browser storage. */ }
  document.getElementById('game-root')!.innerHTML = screens;
  const game = initializeGame({
    onSave: store => {
      void saveSnapshot(store).catch(reportStorageFailure);
      window.dispatchEvent(new Event('nghe-progress-change'));
    },
    onLearningEvent: event => { void recordEvent(event).catch(reportStorageFailure); },
    onStudentChange: () => window.dispatchEvent(new Event('nghe-student-change')),
    onTeacherOpen: () => window.dispatchEvent(new Event('nghe-open-teacher')),
  });
  createRoot(document.getElementById('root')!).render(<CloudSettings game={game} />);
  if (!document.body.classList.contains('chup')) {
    void saveSnapshot(game.snapshot()).catch(reportStorageFailure);
  }
  registerSW({ immediate: true });
}

void start().catch(() => {
  document.getElementById('root')!.textContent = 'Không mở được app. Tải lại trang hoặc kiểm tra bộ nhớ trình duyệt.';
});
