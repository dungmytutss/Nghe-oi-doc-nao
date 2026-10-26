# Proposed student and teacher flows

Status: proposal for review. Account, classroom, and invitation screens are not implemented yet.

## Student flow

1. Open the app. A returning student sees their animal, code, and today's lesson.
2. First use: choose a local student code and animal, just like the existing app. Start immediately without email or a password.
3. Follow **Nghe → Chơi → Đọc theo**. Keep the original games, recordings, adaptive review, praise, garden, and rest reminder.
4. Save every learning result locally. Show cloud status to the adult, without interrupting the child.
5. In **Dành cho người lớn**, a parent signs in once and explicitly links the selected local student profile to their account. Multiple children can share one adult account.
6. On a new device, the adult signs in, selects the child, and restores progress. A local backup precedes replacement; conflicting progress is never silently overwritten.
7. Offline practice continues. After linking, queued results sync automatically when online; manual retry remains available.
8. Joining a teacher's class is optional. An adult follows a class invitation link/code and confirms which child to share with that teacher.

## Teacher flow

1. Sign in through the adult area. A trusted administrator grants the teacher role; entering the old code `1a` does not grant database access.
2. Create a class, set its current lesson, and share a class invitation link/code with parents.
3. Parents link their child. The teacher sees only students connected to their class; names are optional, and class-scoped codes/animals stay available.
4. Review class and student progress: recent practice, reading completions, common mistakes, and items to review. Show the last sync time so stale offline results are clear.
5. Select the class lesson, open the original TV mode, or export a report as CSV. Preserve manual **Gửi cô** code import for families who use offline practice.
6. Remove a student from the class to end teacher access. Their family keeps the learning history.

## Access model

- Students use a child profile, not an adult account or shared classroom password.
- Parents manage their linked children's progress and teacher sharing.
- Teachers read progress for linked students and manage class settings. They do not edit children's answers or other families' data.
- Administrators provision teacher roles. Broad administrator access to learning data is not enabled by default.
- A database UUID identifies each student. `HS01` is a display code scoped to its account/class, never a login credential.

## Review decisions

- Recommended: optional parent login for cloud storage; keep guest/offline practice available.
- Recommended: parent approves class linking; teacher role is assigned by a trusted administrator.
- Recommended: a class lesson updates the default lesson while allowing the child to revisit earlier lessons.
- Classroom schema, pairing tokens, and automatic cross-device conflict resolution follow approval of this proposal.
