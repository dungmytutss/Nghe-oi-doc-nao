export function parseStudentCode(value: string) {
  const code = value.replace(/\s/g, '').toUpperCase();
  const match = code.match(/^NGHE1-SB-C(\d{6})-(HS(?:0[1-9]|[1-3]\d|40))-B(0[1-9]|[1-4]\d|50)-([\dA-F]{32})$/);
  if (!match) return null;
  return { code, app: 'Nghé ơi, đọc nào!', storage: 'Supabase', classRef: match[1], student: match[2], startLesson: Number(match[3]) };
}
