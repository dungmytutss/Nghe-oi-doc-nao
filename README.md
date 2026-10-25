# Nghé ơi, đọc nào! 🐃

[![Kiểm tra & đăng app](https://github.com/dungmytutss/Ngh-i---c-n-o/actions/workflows/pages.yml/badge.svg)](https://github.com/dungmytutss/Ngh-i---c-n-o/actions/workflows/pages.yml)

*Mỗi ngày đọc một vần hay – Nghé vui, vườn đẹp, bé say học hành!*

Ứng dụng web rèn đọc âm vần cho học sinh lớp 1, bám SGK *Tiếng Việt 1 — Kết nối tri thức với cuộc sống* (bài 1–50).
Tác giả: cô **Từ Thị Mỹ Dung**, GV chủ nhiệm lớp 1A, Trường Tiểu học Bình Hòa (Gia Lai).

👉 **Dùng thử:** https://dungmytutss.github.io/Ngh-i---c-n-o/
(thêm đuôi `#toi-31` để app mở sẵn bài 31)

> ✅ Bản nháp — cô duyệt nội dung từng bài trước khi gửi phụ huynh.

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

- **Không** máy chủ, **không** đăng nhập, **không** thu âm, **không** dùng micro, **không** chấm giọng đọc của bé.
- Bé chỉ chọn **mã HS (HS01…HS40) và một con vật** — không có tên thật.
- Tiến độ lưu trong trình duyệt của chính máy đó. Dữ liệu chỉ rời máy khi người lớn bấm «Gửi cô» (tạo mã số liệu ngắn, không tên, để dán vào Zalo).
- Không xếp hạng, không so sánh các bé với nhau.

## Cài lên điện thoại

Mở link → menu trình duyệt → **«Thêm vào màn hình chính»** → có biểu tượng chú nghé. Mở lần đầu cần mạng, các lần sau dùng được cả khi mất mạng.

## Cấu trúc kho

| Tệp | Là gì |
|---|---|
| `index.html` | Toàn bộ app trong một tệp: giao diện, hình vẽ SVG, ngữ liệu bài 1–50, giọng đọc thu sẵn |
| `manifest.webmanifest`, `icon-192.png`, `icon-512.png` | Khai báo để điện thoại cài app ra màn hình chính (PWA) |
| `sw.js` | Bộ nhớ đệm: dùng được khi mất mạng, tự nhận bản mới khi có mạng |
| `.nojekyll` | Báo GitHub Pages đăng nguyên trạng các tệp |
| `.github/workflows/pages.yml` | GitHub Actions: kiểm tra rồi đăng app lên GitHub Pages |
| `.github/scripts/kiem-tra.mjs` | Cửa kiểm tự động |

## Kiểm tra & đăng tự động (GitHub Actions)

Mỗi lần đẩy lên nhánh `main`, workflow **Kiểm tra & đăng app** chạy hai bước:

1. **Cửa kiểm** — đủ tệp; `manifest.webmanifest` đúng JSON; `sw.js` và mọi khối mã JavaScript trong `index.html` không lỗi cú pháp; mọi tệp trong bộ nhớ đệm đều có thật; không nạp tài nguyên từ ngoài, không gửi dữ liệu đi; không lọt số điện thoại, email, mã truy cập; `index.html` dưới 25 MB.
2. **Đăng GitHub Pages** — chỉ chạy khi cửa kiểm xanh; chỉ đăng đúng các tệp của app.

Pull request chỉ chạy cửa kiểm, không đăng.

**Bật một lần:** trên GitHub, vào **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Chạy cửa kiểm trên máy (cần Node.js 18 trở lên):

```bash
node .github/scripts/kiem-tra.mjs
```

Xem thử trên máy: mở thẳng `index.html` bằng trình duyệt (bộ nhớ đệm ngoại tuyến chỉ bật khi chạy qua `https`).

## Khi app có bản mới

1. Trong thư mục app gốc trên máy cô (không nằm trong kho), chạy `python xuat_github.py` để dựng lại thư mục này từ `Nghe oi doc nao.html`.
2. Trong thư mục này:

   ```bash
   git add -A
   git commit -m "Cập nhật app"
   git push
   ```

3. Chờ workflow xanh (1–2 phút). Điện thoại phụ huynh tự nhận bản mới khi mở app có mạng.

**Mỗi tuần lớp học bài mới:** gửi phụ huynh link có đuôi bài mới, ví dụ `…/Ngh-i---c-n-o/#toi-36`; hoặc sửa số `BAI_LOP` trong app rồi làm như trên.

## Lưu ý

- Kho để **công khai**: không đưa tên, ảnh, số điện thoại học sinh vào bất kỳ tệp nào.
- Không dán mã truy cập GitHub (token) vào tệp hay tin nhắn. Lỡ dán thì vào GitHub → Settings → Developer settings → Personal access tokens → xoá mã đó.

## Ghi công

- Giọng đọc: Microsoft Hoài My (vi-VN), thu sẵn.
- Ngữ liệu trích ngắn từ SGK *Tiếng Việt 1* (Kết nối tri thức với cuộc sống), phục vụ dạy học.
