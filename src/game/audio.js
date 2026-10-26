import audioFiles from '../data/audio.json';

/*GIONG-VIET-BAT*/
const GIONG_VIET = Object.fromEntries(Object.entries(audioFiles).map(([text, file]) => [text, import.meta.env.BASE_URL + "audio/" + file]));
let __amDang = null, __giongMay = null;
function __chuanGiong(t){ return String(t).normalize("NFC").replace(/\s+/g, " ").trim(); }
function __choDeNghe(t){
  const doi = [["π"," pi "],["cm³"," xăng-ti-mét khối"],["cm²"," xăng-ti-mét vuông"],["dm³"," đề-xi-mét khối"],["m³"," mét khối"],
    ["m²"," mét vuông"],["×"," nhân "],["÷"," chia "],["−"," trừ "],["≈"," xấp xỉ "],["="," bằng "],["+"," cộng "]];
  t = String(t).replace(/<[^>]+>/g, "");
  for (const [a, b] of doi) t = t.split(a).join(b);
  return __chuanGiong(t.replace(/(\d)\s*cm\b/g, "$1 xăng-ti-mét").replace(/(\d)\s*m\b/g, "$1 mét"));
}
function __timGiongMay(){ try { const ds = speechSynthesis.getVoices().filter(v => /^vi/i.test(v.lang));
  __giongMay = ds.find(v => /Natural|Online|HoaiMy|Hoài/i.test(v.name)) || ds[0] || null; } catch(e){} return __giongMay; }
try { if (window.speechSynthesis){ __timGiongMay(); speechSynthesis.addEventListener("voiceschanged", __timGiongMay); } } catch(e){}
function coGiongViet(chu){ return !!(GIONG_VIET[__chuanGiong(chu)] || __giongMay || __timGiongMay()); }
function dungGiong(){ try { if (__amDang){ __amDang.pause(); __amDang = null; } if (window.speechSynthesis) speechSynthesis.cancel(); } catch(e){} }
function __baoChuaCoGiong(){ try { if (document.getElementById("__baoGiong")) return; const d = document.createElement("div"); d.id = "__baoGiong";
  d.setAttribute("role", "status");
  d.textContent = "Máy chưa có giọng đọc tiếng Việt cho câu này. Mở bằng Microsoft Edge (có mạng) để nghe giọng Việt, hoặc cài thêm giọng Tiếng Việt: Cài đặt Windows → Thời gian và ngôn ngữ → Giọng nói.";
  d.style.cssText = "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);max-width:92vw;background:#1f2937;color:#fff;padding:12px 16px;border-radius:12px;font:15px/1.4 system-ui,sans-serif;z-index:99999;box-shadow:0 6px 20px rgba(0,0,0,.3)";
  document.body.appendChild(d); setTimeout(() => d.remove(), 7000); } catch(e){} }
function __docMay(chu, toc){
  if (!__giongMay){ __baoChuaCoGiong(); return; }   // KHÔNG có giọng Việt → báo, không đọc bằng giọng Anh
  const u = new SpeechSynthesisUtterance(chu); u.voice = __giongMay; u.lang = __giongMay.lang; u.rate = toc || 0.9; speechSynthesis.speak(u);
}
function docGiongViet(goc, chuMay, toc){
  dungGiong(); const k = __chuanGiong(goc);
  if (GIONG_VIET[k]){ try { __amDang = new Audio(GIONG_VIET[k]); const h = __amDang.play(); if (h && h.catch) h.catch(() => {}); return; } catch(e){} }
  try { if (!window.speechSynthesis){ __baoChuaCoGiong(); return; }
    const chu = chuMay || __choDeNghe(goc);
    if (!__giongMay && !__timGiongMay() && !speechSynthesis.getVoices().length){   // Chrome nạp danh sách giọng chậm
      setTimeout(() => { __timGiongMay(); __docMay(chu, toc); }, 700); return; }
    __docMay(chu, toc); } catch(e){}
}
/*GIONG-VIET-HET*/

export { GIONG_VIET, __amDang, coGiongViet, dungGiong, docGiongViet };
