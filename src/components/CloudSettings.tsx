import { createPortal } from 'react-dom';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../cloud/client';
import { localDb } from '../cloud/local';
import { readableError, syncDevice } from '../cloud/student';
import type { GameBridge, StudentDevice } from '../cloud/types';
import { EntryScreens } from './EntryScreens';

export function CloudSettings({ game }: { game: GameBridge }) {
  const [storageError, setStorageError] = useState(false);
  const [devices, setDevices] = useState<StudentDevice[]>([]);
  const [syncMessages, setSyncMessages] = useState<Record<string, { text: string; conflict: boolean }>>({});
  const [resolving, setResolving] = useState(false);
  const refresh = useCallback(async () => { setDevices(await localDb.devices.toArray()); }, []);
  const sync = useCallback(async (code: string, resolution?: 'local' | 'remote') => {
    try {
      const status = await syncDevice(game, code, resolution);
      if (!status) return;
      setSyncMessages(current => ({ ...current, [code]: { conflict: false, text: status === 'pending'
        ? 'Đang chờ cô xác nhận máy. Gửi mã máy cho cô qua Zalo nếu cần.'
        : status === 'newer' ? 'Có bản lưu mới. Về trang đầu để tải tiến trình trước khi học tiếp.' : 'Đã gửi tiến trình cho cô.' } }));
    } catch (error) {
      setSyncMessages(current => ({ ...current, [code]: { text: readableError(error), conflict: readableError(error).includes('máy khác') } }));
    }
    await refresh();
  }, [game, refresh]);
  useEffect(() => {
    const failed = () => setStorageError(true);
    window.addEventListener('nghe-storage-error', failed);
    return () => window.removeEventListener('nghe-storage-error', failed);
  }, []);
  useEffect(() => {
    if (document.body.classList.contains('chup')) return;
    let active = true;
    let timer: number | undefined;
    const lastCheck = new Map<string, number>();
    const tick = async (force = false) => {
      if (!supabase || !navigator.onLine) return;
      try {
        const remembered = await localDb.devices.toArray();
        for (const device of remembered) {
          if (!active) return;
          const elapsed = Date.now() - (lastCheck.get(device.localCode) || 0);
          if (force || device.status === 'pending' || elapsed >= 60000) {
            lastCheck.set(device.localCode, Date.now()); await sync(device.localCode);
          }
        }
      } catch { if (active) setStorageError(true); }
    };
    const progressChanged = () => { clearTimeout(timer); timer = window.setTimeout(() => void tick(true), 4000); };
    const selectedChanged = () => { void refresh(); progressChanged(); };
    const online = () => void tick(true);
    void refresh().catch(() => setStorageError(true)); void tick();
    const interval = window.setInterval(() => void tick(), 10000);
    window.addEventListener('nghe-progress-change', progressChanged);
    window.addEventListener('nghe-student-change', selectedChanged);
    window.addEventListener('online', online);
    return () => {
      active = false; clearTimeout(timer); clearInterval(interval);
      window.removeEventListener('nghe-progress-change', progressChanged);
      window.removeEventListener('nghe-student-change', selectedChanged);
      window.removeEventListener('online', online);
    };
  }, [refresh, sync]);
  const target = document.getElementById('cloud-settings');
  if (!target) return null;
  return <><EntryScreens game={game} devices={devices} onRefresh={refresh} />
  {createPortal(<section className="cloud-settings" aria-labelledby="cloud-title">
    <h3 id="cloud-title">☁️ Lưu và đồng bộ tiến độ</h3>
    <p>Tiến trình được lưu trên thiết bị khi ngoại tuyến. Sử dụng chức năng Sao lưu để tạo bản dự phòng.</p>
    {storageError && <p role="alert">Chưa lưu được bản dự phòng trên máy. Người lớn hãy bấm Sao lưu ra file để giữ tiến trình.</p>}
    {devices.map(device => <section key={device.studentId} className="device-sync">
      <h4>{device.avatar} {device.remoteCode} · {device.className}</h4>
      <p role="status">{syncMessages[device.localCode]?.text || (device.status === 'pending' ? `Máy ${device.checkCode} đang chờ cô xác nhận.` : 'Đang kiểm tra bản lưu…')}</p>
      <small>Lần gửi gần nhất: {device.lastSync ? new Date(device.lastSync).toLocaleString('vi-VN') : 'Chưa gửi'}</small>
      <div className="cloud-actions"><button className="nut-nho" disabled={resolving} onClick={() => void sync(device.localCode)}>Đồng bộ lại</button></div>
      {syncMessages[device.localCode]?.conflict && <div>
        <p>Chọn bản tiến trình cần tiếp tục học. App sẽ giữ bản dự phòng trước khi thay đổi; lịch sử đã ghi không bị xóa.</p>
        <div className="cloud-actions">{(['local', 'remote'] as const).map(choice => <button key={choice} className="nut-nho" disabled={resolving} onClick={() => {
          setResolving(true); void sync(device.localCode, choice).finally(() => setResolving(false));
        }}>{choice === 'local' ? 'Tiếp tục bản trên máy này' : 'Dùng bản trên mạng'}</button>)}</div>
      </div>}
    </section>)}
    <button className="nut-nho" onClick={() => window.dispatchEvent(new Event('nghe-open-teacher'))}>👩‍🏫 Mở Góc của cô</button>
  </section>, target)}</>;
}
