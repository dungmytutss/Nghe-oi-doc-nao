// kiem-tra.mjs — cửa kiểm tự động cho app «Nghé ơi, đọc nào!» (chạy trên GitHub Actions)
//   node .github/scripts/kiem-tra.mjs
// Kiểm: đủ tệp · manifest đúng JSON · sw.js và mã JS trong index.html không lỗi cú pháp
//       · không gọi mạng ra ngoài · không lọt SĐT, email, mã truy cập vào kho công khai.
import { readFileSync, writeFileSync, existsSync, mkdtempSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

let loi = 0;
const dat = (m) => console.log("✅ " + m);
const hong = (m) => { loi++; console.log("::error::" + m); };

// 1. Đủ tệp
const TEP = ["index.html", "manifest.webmanifest", "sw.js", "icon-192.png", "icon-512.png", ".nojekyll"];
for (const t of TEP) existsSync(t) ? dat("có " + t) : hong("thiếu " + t);
if (loi) process.exit(1);

// 2. Manifest
try {
  const m = JSON.parse(readFileSync("manifest.webmanifest", "utf8"));
  for (const k of ["name", "short_name", "start_url", "icons"]) if (!m[k]) hong("manifest thiếu " + k);
  for (const ic of m.icons || []) if (!existsSync(ic.src)) hong("manifest trỏ tới icon không có: " + ic.src);
  dat("manifest đúng JSON");
} catch (e) { hong("manifest lỗi JSON: " + e.message); }

// 3. sw.js: cú pháp + mọi tệp trong bộ nhớ đệm đều có thật
const kiemCuPhap = (tep, ten) => {
  try { execFileSync(process.execPath, ["--check", tep], { stdio: "pipe" }); dat(ten + " không lỗi cú pháp"); }
  catch (e) { hong(ten + " lỗi cú pháp:\n" + e.stderr.toString().split("\n").slice(0, 6).join("\n")); }
};
kiemCuPhap("sw.js", "sw.js");
const sw = readFileSync("sw.js", "utf8");
const dsDem = JSON.parse((sw.match(/const TEP = (\[.*?\]);/) || [, "[]"])[1]);
for (const t of dsDem) if (t !== "./" && !existsSync(t)) hong("sw.js đệm tệp không có: " + t);

// 4. Mã JS trong index.html
const html = readFileSync("index.html", "utf8");
const tam = mkdtempSync(join(tmpdir(), "nghe-oi-"));
const re = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
let m, i = 0;
while ((m = re.exec(html))) {
  const loai = (m[1].match(/type="([^"]*)"/) || [, ""])[1];
  if (loai && !/javascript|module/.test(loai)) continue;
  i++;
  const f = join(tam, `khoi-${i}.${loai === "module" ? "mjs" : "js"}`);
  writeFileSync(f, m[2]);
  kiemCuPhap(f, `index.html khối mã ${i}`);
}
if (!i) hong("index.html không có khối mã nào");

// 5. Không gọi mạng ra ngoài, không lọt dữ liệu cá nhân / mã truy cập
const ma = html.replace(/data:[a-z0-9.+\/-]+;base64,[A-Za-z0-9+\/=]+/gi, "");   // bỏ phần âm thanh, hình nhúng
const timThay = (re) => [...new Set(ma.match(re) || [])];
const ngoai = timThay(/<(?:script|link|img|iframe)[^>]+(?:src|href)="https?:\/\/[^"]+"/gi);
ngoai.length ? hong("nạp tài nguyên từ ngoài: " + ngoai.slice(0, 3).join(" · ")) : dat("không nạp tài nguyên từ ngoài");
const goi = timThay(/\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket)\s*\(/g);
goi.length ? hong("có lệnh gửi dữ liệu đi: " + goi.join(", ")) : dat("không gửi dữ liệu đi đâu");
const sdt = timThay(/(?<![\d.])(?:\+84|0)(?:3|5|7|8|9)\d{8}(?!\d)/g);
sdt.length ? hong("có dạng số điện thoại: " + sdt.length + " chỗ") : dat("không có số điện thoại");
const email = timThay(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z.]{2,}/g).filter((e) => !/\.(png|svg|js)$/i.test(e));
email.length ? hong("có địa chỉ email: " + email.length + " chỗ") : dat("không có email");
const khoa = timThay(/(?:ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{60,}|AIza[0-9A-Za-z_-]{35}|sk-[A-Za-z0-9_-]{30,})/g);
khoa.length ? hong("có dạng mã truy cập (token/khoá API)") : dat("không có mã truy cập");

// 6. Dung lượng (GitHub chặn tệp > 100 MB; app nên dưới 25 MB để điện thoại tải nhanh)
const mb = statSync("index.html").size / 1048576;
mb > 25 ? hong(`index.html nặng ${mb.toFixed(1)} MB (> 25 MB)`) : dat(`index.html ${mb.toFixed(1)} MB`);

console.log(loi ? `\n❌ ${loi} lỗi` : "\n🟢 XANH — đăng được");
process.exit(loi ? 1 : 0);
