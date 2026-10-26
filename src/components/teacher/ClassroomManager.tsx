import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { readableError } from '../../cloud/student';
import { approveDevice, createClassroom, formatClassCode, getClassrooms, getClassRoster, issueMissingCodes, setClassLesson, type Classroom, type DeviceRequest, type RosterStudent } from '../../cloud/teacher';

export function ClassroomManager() {
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
      setMessage('Đã tạo lớp và mã cố định riêng cho từng học sinh.');
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
      <summary>Tạo lớp mới</summary>
      <form onSubmit={generate} className="cloud-form">
        <label>Tên lớp<input value={name} maxLength={80} onChange={e => setName(e.target.value)} required /></label>
        <div className="cloud-fields">
          <label>Bắt đầu từ bài<input type="number" min={1} max={50} value={startLesson} onChange={e => setStartLesson(Number(e.target.value))} required /></label>
          <label>Số học sinh<input type="number" min={1} max={40} value={count} onChange={e => setCount(Number(e.target.value))} required /></label>
        </div>
        <button className="nut nut-tim" disabled={busy}>{busy ? 'Đang tạo…' : 'Tạo lớp và cấp mã học sinh'}</button>
      </form>
    </details>
    {!!classes.length && <label className="cloud-label">Chọn lớp<select value={selectedId} disabled={busy} onChange={e => setSelectedId(e.target.value)}>{classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
    {selected && <>
      <div className="class-code"><span>Mã nhận diện lớp trong mã học sinh</span><strong>C{formatClassCode(selected.class_code).replaceAll(' ', '')}</strong>
        <p>Mỗi học sinh có một mã nhận diện riêng. Sao chép mã từ danh sách bên dưới để gửi phụ huynh. Mã được giữ nguyên trong suốt quá trình học.</p>
        {roster.some(student => !student.accessCode) && <button className="nut-nho" disabled={busy} onClick={() => void task(async () => {
          await issueMissingCodes(selected.id); await refreshRoster(); setMessage('Đã cấp mã còn thiếu. Các mã đã có được giữ nguyên.');
        })}>Cấp mã cho học sinh còn thiếu</button>}
      </div>
      <form className="cloud-form" onSubmit={event => { event.preventDefault(); void task(async () => {
        await setClassLesson(selected.id, lesson); await refreshClasses(); setMessage('Đã cập nhật bài học mặc định. Các mã đã cấp và vị trí học đã lưu không thay đổi.');
      }); }}>
        <label>Bài học mặc định của lớp<input type="number" min={1} max={50} value={lesson} onChange={e => setLesson(Number(e.target.value))} required /></label>
        <button className="nut-nho" disabled={busy}>Lưu bài học mặc định</button>
      </form>
      <h4>Thiết bị học sinh</h4>
      <p>Thiết bị sử dụng đúng mã học sinh được liên kết với hồ sơ tương ứng. Có thể ngắt kết nối thiết bị bị mất hoặc không còn sử dụng.</p>
      {!devices.some(device => device.status === 'pending') && <p>Không có yêu cầu kết nối đang chờ xác nhận.</p>}
      <ul className="device-list">{devices.filter(device => device.status !== 'revoked').map(device => {
        const student = roster.find(item => item.id === device.student_id);
        return <li key={device.id}>
          <strong>{student?.avatar} {student?.local_code}</strong> · mã máy <b>{device.check_code}</b>
          <span>{device.status === 'pending' ? 'Đang chờ' : 'Đã kết nối'}</span>
          {device.status === 'pending' && <button className="nut-nho" disabled={busy} onClick={() => void task(async () => {
            await approveDevice(device.id, 'approved'); await refreshRoster(); setMessage('Đã xác nhận kết nối thiết bị.');
          })}>Xác nhận thiết bị</button>}
          {revokeId === device.id ? <div className="cloud-actions">
            <button className="nut-nho" disabled={busy} onClick={() => void task(async () => { await approveDevice(device.id, 'revoked'); setRevokeId(''); await refreshRoster(); })}>Xác nhận ngắt kết nối</button>
            <button className="nut-nho" onClick={() => setRevokeId('')}>Hủy</button>
          </div> : <button className="nut-nho" disabled={busy} onClick={() => setRevokeId(device.id)}>{device.status === 'pending' ? 'Từ chối' : 'Ngắt kết nối'}</button>}
        </li>;
      })}</ul>
      <h4>Mã và tiến trình học sinh</h4>
      <div className="cloud-actions"><button className="nut-nho" disabled={busy} onClick={() => void task(refreshRoster)}>Làm mới kết quả</button><button className="nut-nho" onClick={exportCsv}>Tải báo cáo CSV</button></div>
      <div className="roster-scroll"><table className="cloud-roster"><thead><tr><th>Học sinh</th><th>Mã cô cấp (cố định)</th><th>Đang học</th><th>Lượt đọc</th><th>Phút học</th><th>Cần ôn</th><th>Lưu gần nhất</th></tr></thead><tbody>
        {roster.map(student => <tr key={student.id}><th>{student.avatar} {student.local_code}</th><td>{student.accessCode ? <>
          <details className="student-issued-code"><summary>Xem mã {student.local_code}</summary><code>{student.accessCode}</code></details>
          <button className="nut-nho" onClick={() => void task(async () => {
            await navigator.clipboard.writeText(student.accessCode!); setMessage(`Đã chép mã ${student.local_code}.`);
          })}>Chép mã {student.local_code}</button>
        </> : 'Chưa cấp'}</td><td>Bài {student.lesson || student.startLesson || selected.current_lesson}</td><td>{student.progress?.docTheo || 0}</td>
          <td>{Math.round(Object.values(student.progress?.phut || {}).reduce((a, b) => a + b, 0))}</td>
          <td>{Object.entries(student.progress?.muc || {}).filter(([, value]) => value.s > value.d).slice(0, 3).map(([key]) => key.replace(/^t:/, '')).join(', ') || '—'}</td>
          <td>{student.updatedAt ? new Date(student.updatedAt).toLocaleString('vi-VN') : 'Chưa gửi'}</td></tr>)}
      </tbody></table></div>
      <p>Thiết bị ngoại tuyến sẽ đồng bộ tiến độ khi có kết nối mạng. Công cụ trình chiếu và tổng hợp mã tiến trình nằm trong mục Công cụ dạy học.</p>
    </>}
    {message && <p role="status" className="cloud-message">{message}</p>}
  </div>;
}
