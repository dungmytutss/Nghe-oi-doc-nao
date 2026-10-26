import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../cloud/client';
import type { GameBridge } from '../cloud/types';

// Account and classroom screens will follow the reviewed student/teacher proposal.
export function CloudSettings({ game }: { game: GameBridge }) {
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    const failed = () => setStorageError(true);
    window.addEventListener('nghe-storage-error', failed);
    return () => window.removeEventListener('nghe-storage-error', failed);
  }, []);
  const target = document.getElementById('cloud-settings');
  if (!target) return null;
  return createPortal(<section className="cloud-settings" aria-labelledby="cloud-title">
    <h3 id="cloud-title">☁️ Lưu tiến trình trên mạng</h3>
    <p>{supabase
      ? 'Đã cấu hình kết nối. Chức năng tài khoản và đồng bộ đang được chuẩn bị.'
      : 'Hiện đang lưu tiến trình trên máy này. Chưa bật đồng bộ trên mạng.'}</p>
    <p>Con vẫn học bình thường khi không có mạng. Người lớn có thể dùng nút Sao lưu bên dưới.</p>
    {storageError && <p role="alert">Chưa lưu được bản dự phòng trên máy. Người lớn hãy bấm Sao lưu ra file để giữ tiến trình.</p>}
    <small>Mã đang chọn: {game.selectedCode()}</small>
  </section>, target);
}
