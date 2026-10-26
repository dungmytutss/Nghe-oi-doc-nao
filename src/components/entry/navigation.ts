export type Screen = 'choose' | 'code' | 'guest' | 'student' | 'teacher' | 'tools';
export const hashes: Record<Screen, string> = { choose: '#bat-dau', code: '#nhap-ma', guest: '#khach', student: '#hoc-sinh', teacher: '#goc-co', tools: '#cong-cu-co' };
export function readScreen(): Screen {
  const explicit = (Object.keys(hashes) as Screen[]).find(screen => hashes[screen] === location.hash);
  if (explicit) return explicit;
  if (location.hash.includes('type=recovery')) return 'teacher';
  return 'choose';
}
