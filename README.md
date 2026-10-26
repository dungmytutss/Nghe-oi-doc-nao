# Nghé ơi, đọc nào! 🐃
[![Kiểm tra & đăng app](https://github.com/dungmytutss/Nghe-oi-doc-nao/actions/workflows/pages.yml/badge.svg)](https://github.com/dungmytutss/Nghe-oi-doc-nao/actions/workflows/pages.yml)

*Mỗi ngày đọc một vần hay – Nghé vui, vườn đẹp, bé say học hành!*

Ứng dụng web rèn đọc âm vần cho học sinh lớp 1, bám SGK *Tiếng Việt 1 — Kết nối tri thức với cuộc sống* (bài 1–50).
Tác giả: cô **Từ Thị Mỹ Dung**, GV chủ nhiệm lớp 1A, Trường Tiểu học Bình Hòa (Gia Lai).

👉 **Dùng thử:** https://dungmytutss.github.io/Nghe-oi-doc-nao/
(thêm đuôi `#toi-31` để app mở sẵn bài 31, ví dụ https://dungmytutss.github.io/Nghe-oi-doc-nao/#toi-31)

## App làm gì

Mỗi tối khoảng 10 phút, có ông bà, cha mẹ ngồi cạnh, bé đi qua ba chặng:

| Chặng | Bé làm gì |
|---|---|
| 🎧 **Nghe** | Nghé đọc mẫu âm, vần, mô hình đánh vần (b – a – ba – huyền – bà), từ và câu của bài |
| 🚂 **Chơi** | Kéo toa tàu ghép âm đầu – vần – dấu thanh; nghe rồi chạm đúng chữ (phương án nhiễu là các cặp hay nhầm) |
| 📖 **Đọc theo** | Chữ to sáng dần theo tiếng nghé đọc, có nút «Nghe chậm»; bé đọc to theo, bấm «Con đọc xong» để được khen |

- 🌱 **Vườn của nghé:** âm vần nào bé làm đúng vững (5 lần) thì mọc một cây quê nhà — lúa, bắp, cà phê, hồ tiêu, dã quỳ…
- 🧑‍🏫 **Góc của cô:** chọn bài lớp đang học, dán các mã «Gửi cô» để xem bản đồ lỗi cả lớp, **chế độ ti vi** chữ to để cả lớp đọc theo.
- 🔁 **Cá nhân hoá:** âm vần bé hay sai quay lại nhiều hơn, ôn cách quãng; chặng Đọc theo ưu tiên từ, câu có tiếng bé hay nhầm.
- 🔊 **Giọng đọc mẫu** Hoài My (giọng Bắc) thu sẵn trong app — đọc chậm, rõ, theo cách đọc lớp 1 (bờ, ca, cờ, quờ…), máy nào cũng nghe giống nhau, không cần mạng.
- ⏰ Học quá 15 phút thì nghé nhắc bé nghỉ mắt.

## An toàn cho học sinh

- Không thu âm, không dùng micro, không chấm giọng đọc của bé. Bản chuyển đổi đang chuẩn bị đăng nhập người lớn và lưu tiến trình qua Supabase; hiện giao diện học vẫn dùng dữ liệu trên máy.
- Bé chỉ chọn **mã HS (HS01…HS40) và một con vật** — không có tên thật.
- Tiến độ lưu trong trình duyệt của chính máy đó. Dữ liệu chỉ rời máy khi người lớn bấm «Gửi cô» (tạo mã số liệu ngắn, không tên, để dán vào Zalo).
- Không xếp hạng, không so sánh các bé với nhau.

## Cài lên điện thoại

Mở link → menu trình duyệt → **«Thêm vào màn hình chính»** → có biểu tượng chú nghé. Mở lần đầu cần mạng, các lần sau dùng được cả khi mất mạng.

## Ghi công

- Giọng đọc: Microsoft Hoài My (vi-VN), thu sẵn.
- Ngữ liệu trích ngắn từ SGK *Tiếng Việt 1* (Kết nối tri thức với cuộc sống), phục vụ dạy học.

## Development (migration branch)

The app now builds with React, TypeScript, and Vite. The original teaching engine is retained in `src/game/engine.js`; it has not yet been rewritten in TypeScript. New storage, account integration, and sync modules use strict TypeScript. The original Vietnamese screens, CSS, lesson content, local progress key, and all 815 recordings are preserved.

```sh
npm ci
npm run dev
npm run check
npx playwright install chromium
npm run test:e2e
```

Use `npm run build` and `npm run preview` to test the production PWA. Development mode does not install a service worker. Production builds precache lesson/audio assets for offline practice. Close and reopen the app after an update to use the newly downloaded version.

Supabase credentials are optional for local practice. Copy `.env.example` to `.env.local` and follow [Supabase setup](docs/SUPABASE_SETUP.md). Never commit `.env.local`, database passwords, or secret/service-role keys.

Account, class, and invitation screens await review of the [student and teacher flow proposal](docs/USER_FLOWS.md). The cloud schema and sync functions are scaffolding, not an active end-to-end account feature yet.

GitHub Actions validates branch pushes. Only `main` deploys to GitHub Pages, using `VITE_BASE_PATH=/Nghe-oi-doc-nao/`. A separate daily database keepalive is prepared; it activates only after its migration, repository secrets, and default-branch workflow are in place.
