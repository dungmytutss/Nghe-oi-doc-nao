# Proposed student and teacher flows

Status: implemented on the migration branch. The classroom upgrade SQL must be applied before cloud classroom functions work. Parents use a six-digit class code, rather than personal links.

## Student flow

1. Open the app. A returning student sees their animal, code, and today's lesson.
2. First use: choose a local student code and animal, just like the existing app. Start immediately without email or a password.
3. Follow **Nghe → Chơi → Đọc theo**. Keep the original games, recordings, adaptive review, praise, garden, and rest reminder.
4. Save every learning result locally. Show cloud status to the adult, without interrupting the child.
5. The teacher sends the regular app website and a six-digit class code (for example, `642891`) through Zalo. The parent opens the website, taps **Nhập mã lớp**, enters the code once, and chooses the child's assigned student code and animal. No student email, password, or parent account is required.
6. The child can practise immediately while the teacher confirms the first device. The app shows a short machine-check code that the teacher can compare with the family through Zalo. Until approval, it cannot read or write the child's cloud history.
7. After approval, queued results sync automatically when online. The app remembers the child; subsequent visits go directly to **Học bài hôm nay**. Offline practice continues, with manual retry available to adults.
8. Siblings sharing a phone choose between remembered animal icons. Another phone repeats the class-code entry and receives its own teacher-approved device credential. Conflicting progress is backed up and requires an explicit choice in the adult area.

## Teacher flow

1. Sign in through the adult area. A trusted administrator grants the teacher role; entering the old code `1a` does not grant database access.
2. Enter a class name, starting lesson (1–50), and student count (1–40). **Tạo lớp và mã lớp** creates the roster and one six-digit class code.
3. Copy the app website and class code to send through Zalo. Tell each family their assigned student code/animal. Confirm incoming devices after checking with the family; parents do not register accounts.
4. Review class and student progress: recent practice, reading completions, common mistakes, and items to review. Show the last sync time so stale offline results are clear.
5. Select the class lesson, open the original TV mode, or export a report as CSV. Preserve manual **Gửi cô** code import for families who use offline practice.
6. Revoke a wrong or lost device. This immediately prevents its cloud access while retaining the child's learning history. Moving/archiving classes is outside the current generator feature.

## Access model

- Students use a child profile, not an adult account or shared classroom password.
- Parents enter the class code once, choose their child's assigned code/animal, and help add the app to the home screen. They do not need an account.
- Teachers manage their classes and device approvals and read their students' progress. They do not edit children's answers or other teachers' classes.
- Administrators provision teacher roles. Broad administrator access to learning data is not enabled by default.
- A database UUID identifies each student. `HS01` is a display code scoped to its teacher/class, never a login credential.
- Class codes only reveal the code/animal roster and permit an enrollment request. They never authorize history access. Approved devices receive a separate random credential; only its SHA-256 digest is stored in the database. Credentials expire after a year and can be revoked earlier.

## Review decisions

- Revised for countryside families: teacher-generated six-digit class codes and remembered animal profiles; no parent login. Keep guest/offline practice available.
- Teacher role is assigned by a trusted administrator; children never share a teacher login.
- Recommended: a class lesson updates the default lesson while allowing the child to revisit earlier lessons.
- Classroom schema, teacher-approved pairing, automatic retry, and recovery snapshots are implemented. Conflicts between modified copies require an adult choice; the app does not guess which copy to overwrite. Direct anonymous table access to learning data stays disabled.
