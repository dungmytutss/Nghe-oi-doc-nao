# Proposed student and teacher flows

Status: proposal for review. Account, classroom, and invitation screens are not implemented yet.

## Student flow

1. Open the app. A returning student sees their animal, code, and today's lesson.
2. First use: choose a local student code and animal, just like the existing app. Start immediately without email or a password.
3. Follow **Nghe → Chơi → Đọc theo**. Keep the original games, recordings, adaptive review, praise, garden, and rest reminder.
4. Save every learning result locally. Show cloud status to the adult, without interrupting the child.
5. The teacher sends each family a personal student link or QR through Zalo. The parent opens it once; the app remembers the child's identity and animal. No student email, password, class code to type, or parent account is required.
6. On another phone, the family opens the same personal link. The teacher can resend it if lost. A local backup precedes any progress replacement; conflicting progress is never silently overwritten.
7. Offline practice continues. After pairing the device, queued results sync automatically when online; manual retry remains available to adults.
8. Siblings sharing a phone choose between remembered animal icons. A personal link grants access to only one child; the teacher can revoke and replace it.

## Teacher flow

1. Sign in through the adult area. A trusted administrator grants the teacher role; entering the old code `1a` does not grant database access.
2. Create a class, add student codes, set its current lesson, and generate a separate personal link/QR for each student.
3. Send each family its child's link through Zalo. Families open it once without registration. The teacher sees only students in their class; names are optional, and class-scoped codes/animals stay available.
4. Review class and student progress: recent practice, reading completions, common mistakes, and items to review. Show the last sync time so stale offline results are clear.
5. Select the class lesson, open the original TV mode, or export a report as CSV. Preserve manual **Gửi cô** code import for families who use offline practice.
6. Resend a lost link or replace a link shared accidentally. Archiving or moving students must retain their learning history through an explicit teacher-managed action.

## Access model

- Students use a child profile, not an adult account or shared classroom password.
- Parents only open the teacher's personal link and help add the app to the home screen. They do not need an account.
- Teachers manage classes, student records, and personal links and read their students' progress. They do not edit children's answers or other teachers' classes.
- Administrators provision teacher roles. Broad administrator access to learning data is not enabled by default.
- A database UUID identifies each student. `HS01` is a display code scoped to its teacher/class, never a login credential.
- Personal links require unguessable, revocable tokens exchanged for device credentials. Student UUIDs alone do not authorize database access. This pairing layer is not implemented by the foundational owner policies yet.

## Review decisions

- Revised for countryside families: teacher-managed personal links and remembered animal profiles; no parent login. Keep guest/offline practice available.
- Teacher role is assigned by a trusted administrator; children never share a teacher login.
- Recommended: a class lesson updates the default lesson while allowing the child to revisit earlier lessons.
- Classroom schema, secure personal-link pairing, and automatic cross-device conflict resolution remain to be implemented. The current foundational schema stores teacher-owned student rows; direct anonymous access to learning data stays disabled.
