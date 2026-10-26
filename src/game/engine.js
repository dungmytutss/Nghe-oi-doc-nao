// Preserved teaching engine. New account/storage code lives in strict TypeScript.
import { GIONG_VIET, __amDang, coGiongViet, dungGiong, docGiongViet } from './audio';
import DU_LIEU from '../data/lessons.json';
import LOI from '../data/phrases.json';
import { progressSchema } from '../cloud/types';

export function initializeGame(callbacks = {}) {


/* =====================================================================
   DỮ LIỆU — ghep_du_lieu.py ghi đè phần giữa hai dấu dưới đây. Đừng sửa tay.
   ===================================================================== */

/*CAU-DOC-BAT*/const CAU_DOC = ["Con đọc tốt quá!", "Chào con! Nghé ơi, đọc nào!", "Con chạm vào chữ để nghe nghé đọc nhé!", "Con nghe nghé đọc rồi ghép toa tàu nhé!", "Con nghe nghé đọc rồi chạm vào đúng chữ nhé!", "Con nghe nghé đọc nhé!", "Giờ con đọc theo nghé nhé!", "Đúng rồi! Con giỏi quá!", "Chưa đúng rồi, con nghe lại nhé!", "Hôm nay con học được mười phút rồi. Giỏi quá!", "Con học lâu rồi. Mình nghỉ mắt một chút nhé!", "Con làm xong rồi! Mình sang chặng sau nhé!", "Cả lớp mình cùng đọc nào!", "Cả lớp đọc giỏi quá!", "a", "á", "ớ", "bờ", "cờ", "chờ", "dờ", "đờ", "e", "ê", "gờ", "di", "hờ", "i", "ca", "khờ", "lờ", "mờ", "nờ", "ngờ", "nhờ", "o", "ô", "ơ", "pờ", "phờ", "quờ", "rờ", "sờ", "tờ", "thờ", "trờ", "u", "ư", "vờ", "xờ", "không dấu", "dấu huyền", "dấu sắc", "dấu hỏi", "dấu ngã", "dấu nặng", "bờ, a, ba", "ba", "bờ, a, ba, huyền, bà", "bà", "ba ba", "A, bà.", "cờ, a, ca", "cờ, a, ca, sắc, cá", "cá", "cà", "A, cá.", "bờ, e, be, sắc, bé", "bé", "bờ, ê, bê, sắc, bế", "bế", "bè", "Bà bế bé.", "be", "ba bà", "be bé", "cá bé", "bè cá", "bế bé", "bờ, o, bo, huyền, bò", "bò", "cờ, o, co, hỏi, cỏ", "cỏ", "bó", "bỏ", "cò", "có", "Bê có cỏ.", "bờ, ô, bô, sắc, bố", "bố", "bờ, ô, bô, nặng, bộ", "bộ", "bổ", "cô", "cổ", "cộ", "cô bé", "cổ cò", "Bố bê bể cá.", "dờ, e, de, hỏi, dẻ", "dẻ", "đờ, a, đa", "đa", "da", "dế", "đá", "đò", "đổ", "đá dế", "đa đa", "ô đỏ", "Bé có ô đỏ.", "bờ, ơ, bơ, huyền, bờ", "dờ, ơ, dơ, ngã, dỡ", "dỡ", "bở", "cỡ", "đỡ", "bờ đê", "cá cờ", "đỡ bé", "Bố đỡ bé.", "do", "đo", "dô", "đô", "dơ", "đơ", "bó cỏ", "đỡ bà", "cờ đỏ", "đỗ đỏ", "dỗ bé", "Bờ đê có dế.", "Bà có đỗ đỏ.", "ca, i, ki", "ki", "ca, i, ki, huyền, kì", "kì", "kè", "kẻ", "kệ", "kí", "kĩ", "bí đỏ", "kẻ ô", "đi đò", "kì đà", "Kì đà bò ở kẽ đá.", "hờ, ô, hô, huyền, hồ", "hồ", "lờ, e, le", "le", "hé", "ho", "hổ", "li", "lọ", "lỡ", "lá đỏ", "bờ hồ", "cá hố", "le le", "Bé bị ho. Bà đã có lá hẹ.", "đờ, u, đu, hỏi, đủ", "đủ", "lờ, ư, lư, huyền, lừ", "lừ", "dù", "hũ", "củ", "dự", "lữ", "đu đủ", "hổ dữ", "Cá hổ là cá dữ.", "chờ, u, chu, sắc, chú", "chú", "khờ, i, khi, hỏi, khỉ", "khỉ", "chè", "chỉ", "chợ", "khế", "kho", "khô", "lá khô", "chú khỉ", "chợ cá", "Chị có cá kho khế.", "ke", "kê", "he", "hê", "hi", "hu", "hư", "lê", "lu", "lư", "che", "chê", "chi", "chu", "chư", "khe", "khê", "khi", "khu", "khư", "chú hề", "che ô", "cá dữ", "lá hẹ", "Chị cho bé cá cờ.", "Dì Kha cho Hà đi chợ.", "mờ, e, me, nặng, mẹ", "mẹ", "nờ, ơ, nơ", "nơ", "má", "mỡ", "na", "nề", "nở", "cá mè", "lá me", "nơ đỏ", "ca nô", "Bố mẹ cho Hà đi ca nô.", "gờ, a, ga, huyền, gà", "gà", "di, o, gio, hỏi, giỏ", "giỏ", "ga", "gỗ", "gụ", "giá", "giò", "giỗ", "gà gô", "đồ gỗ", "giá đỗ", "cụ già", "Bà che gió cho ba chú gà.", "gờ, e, ghe, sắc, ghé", "ghé", "nhờ, a, nha, huyền, nhà", "nhà", "ghẹ", "ghế", "ghi", "nhẹ", "nhỏ", "ghế đá", "ghẹ đỏ", "nhà gỗ", "lá nho", "Mẹ nhờ Hà bê ghế nhỏ.", "ngờ, o, ngo, ngã, ngõ", "ngõ", "ngờ, e, nghe, sắc, nghé", "nghé", "ngã", "ngủ", "ngự", "nghe", "nghĩ", "ngã ba", "ngõ nhỏ", "củ nghệ", "nghỉ hè", "Nghé đã no cỏ. Nghé ngủ ở bờ đê.", "me", "mê", "mu", "ne", "nê", "nu", "gu", "nho", "nhi", "như", "ngo", "ngư", "nghi", "nụ cà", "nhà ga", "ngủ mơ", "bỡ ngỡ", "nho nhỏ", "ghế gỗ", "Mẹ ghé nhà bà.", "Nhà bà ở ngõ nhỏ.", "rờ, a, ra", "ra", "sờ, e, se, hỏi, sẻ", "sẻ", "rạ", "rế", "rổ", "sả", "sẽ", "sò", "rổ rá", "cá rô", "su su", "chữ số", "Chợ có gà ri, cá rô, su su.", "Chợ có cả rổ rá.", "tờ, ô, tô", "tô", "trờ, e, tre", "tre", "tá", "tạ", "tẻ", "trê", "trò", "trổ", "ô tô", "sư tử", "cá trê", "tre ngà", "Hà tả hồ cá.", "Hồ to, có cá mè, cá trê, cá rô.", "ia", "thờ, u, thu", "thu", "chờ, ia, chia", "chia", "thẻ", "thọ", "thợ", "đĩa", "mía", "thìa", "thủ đô", "lá thư", "thìa đĩa", "lá tía tô", "Bé chia thìa, chia đĩa cho cả nhà.", "ua", "ưa", "mờ, ua, mua, sắc, múa", "múa", "đờ, ưa, đưa", "đưa", "cua", "đũa", "rùa", "cửa", "dứa", "nhựa", "cà chua", "múa ô", "dưa lê", "cửa sổ", "Mẹ đi chợ mua cá, mua cua.", "ri", "ru", "rư", "si", "su", "sư", "ti", "tu", "tư", "tri", "tru", "trư", "thi", "thư", "tia", "tua", "tưa", "thia", "thua", "thưa", "củ sả", "lưa thưa", "rễ tre", "lá mía", "mùa thu", "khế chua", "tổ cò", "Mùa hè, nhà bà có dừa, có dưa lê.", "Mùa thu, nhà bà có na, có thị.", "phờ, ô, phô, sắc, phố", "phố", "quờ, ê, quê", "quê", "phà", "phí", "phở", "quạ", "quế", "pha trà", "phố cổ", "quê nhà", "quả khế", "Bà cho bé quà quê.", "vờ, e, ve, ngã, vẽ", "vẽ", "xờ, e, xe", "xe", "võ", "vở", "vua", "xỉa", "xứ", "xưa", "vở vẽ", "vỉa hè", "xe lu", "thị xã", "Nghỉ hè, bố mẹ cho Hà về quê.", "quờ, i, quy, sắc, quý", "quý", "quy", "quỳ", "quỹ", "quỵ", "ý", "y tá", "dã quỳ", "đá quý", "Hà chú ý nghe dì kể.", "kế", "ghe", "ngô", "ngừ", "nghỉ", "chữ kí", "cá ngừ", "cư", "kề", "kỉ", "kẽ", "cọ", "gõ", "ghì", "gù", "gừ", "ngà", "nghề", "nghệ", "k đứng trước i, e, ê — c đứng trước a, o, ô, ơ, u, ư", "gh đứng trước i, e, ê — g đứng trước a, o, ô, ơ, u, ư", "ngh đứng trước i, e, ê — ng đứng trước a, o, ô, ơ, u, ư", "pha", "phe", "phê", "phơ", "qua", "que", "quơ", "va", "ve", "vê", "vơ", "xa", "xê", "xơ", "qua phà", "cổ vũ", "xa xa", "xứ sở", "Xa nhà, bé nhớ mẹ.", "Xa quê, bé nhớ bà.", "an", "ăn", "ân", "bờ, an, ban, nặng, bạn", "bạn", "bản", "nhãn", "gắn", "lặn", "bận", "gần", "bạn thân", "khăn rằn", "quả mận", "Đàn gà cứ tha thẩn gần chân mẹ.", "Đã có mẹ che chắn, cả đàn chả sợ gì lũ quạ dữ.", "on", "ôn", "ơn", "cờ, on, con", "con", "giòn", "ngon", "bốn", "nhộn", "gọn", "lớn", "nón lá", "con chồn", "sơn ca", "Ve vẻ vè ve", "Vè bốn chú lợn", "Nhởn nhơ nô giỡn", "Ăn ngủ vô tư.", "Hẳn họ nhà “Trư”", "Là to tròn thế.", "Ve vè nghe kể", "Bốn chú lợn con.", "en", "ên", "in", "un", "mờ, en, men, huyền, mèn", "mèn", "khèn", "sen", "nến", "nghển", "chín", "mịn", "cún", "vun", "ngọn nến", "đèn pin", "cún con", "Con gì tên có chữ \"ba\"", "Ăn cua ăn cá, nhìn qua ngỡ rùa?", "Con gì quen vẻ già nua", "Bốn chân ngắn ngủn, thỏ thua chả ngờ?", "am", "ăm", "âm", "lờ, am, lam, huyền, làm", "làm", "cam", "khám", "ẵm", "cằm", "đậm", "nhẩm", "quả cam", "tăm tre", "củ sâm", "Mùa hè, ve râm ran, sen nở thắm.", "Lũ trẻ nô đùa trên thảm cỏ ven hồ.", "củ sắn", "tấm gỗ", "khôn lớn", "bàn chân", "mưa phùn", "bến đò", "ngọn cỏ", "trạm y tế", "chăm chỉ", "Nhìn rùa, thỏ chê: \"Quả là chậm như rùa.\".", "Rùa ôn tồn: \"Ta thi nhé.\".", "Thỏ hớn hở tham gia.", "om", "ôm", "ơm", "xờ, om, xom, sắc, xóm", "xóm", "khóm", "vòm", "nộm", "tôm", "bờm", "rơm", "đom đóm", "chó đốm", "mâm cơm", "Hôm qua, cô Mơ ở xóm Hạ đến thăm nhà Hà.", "Cô cho Hà giỏ cam.", "Hà chọn quả cam to phần bố.", "em", "êm", "im", "um", "đờ, êm, đêm, sắc, đếm", "đếm", "hẻm", "kem", "mềm", "nếm", "mỉm", "tím", "chụm", "mũm", "tem thư", "thềm nhà", "tủm tỉm", "Chim ri cần cù tìm cỏ khô về làm tổ.", "Đêm qua, nó bị ốm.", "Chim sẻ và chim sơn ca đến thăm, đem cho nó túm rơm.", "ai", "ay", "ây", "hờ, ai, hai", "hai", "bài", "lái", "nảy", "tay", "đậy", "lẫy", "chùm vải", "máy cày", "đám mây", "Nai con nhìn thấy con gì bé nhỏ, thân đầy gai nhọn trên bãi cỏ.", "Nó chạy về nhà, hổn hển kể cho mẹ nghe.", "Nai mẹ tủm tỉm: \"Bạn nhím đấy, con ạ\".", "oi", "ôi", "ơi", "vờ, oi, voi", "voi", "chòi", "hỏi", "mỗi", "xôi", "đợi", "mới", "chim bói cá", "thổi còi", "đồ chơi", "Mẹ ơi, mạ lớn lên gọi là lúa.", "Bê lớn lên gọi là bò.", "Còn con lớn lên thì gọi là gì ạ?", "nồm", "kẽm", "nêm", "sim", "chùm", "tai", "hãy", "đấy", "hội", "khơi", "chói lọi", "cày cấy", "chúm chím", "sớm tối", "ngõ hẻm", "gió nồm", "lom khom", "êm đềm", "bãi bồi", "bơi lội", "Nhím con ra bãi cỏ tìm cái ăn.", "Nó phấn chấn khi thấy vô số quả chín thơm ngon.", "Nhím vội chạy về gọi bạn chồn.", "ui", "ưi", "tờ, ui, tui, sắc, túi", "túi", "bùi", "mũi", "sủi", "cửi", "gửi", "ngửi", "dãy núi", "bụi cỏ", "gửi thư", "Lan gửi thư cho Hà kể về quê Lan.", "Ở đó, có nhà sàn nằm ven đồi.", "Mùa này, chim ca rộn rã, sim nở rộ tím cả núi đồi.", "ao", "eo", "lờ, eo, leo, ngã, lẽo", "lẽo", "chào", "dao", "sáo", "dẻo", "đẽo", "kẹo", "ngôi sao", "quả táo", "cái kẹo", "ao bèo", "Trên cây cao, đàn chào mào bay đi, bay lại.", "Mấy chú sáo đen vui ca véo von.", "Còn chim ri vẫn chăm chỉ.", "au", "âu", "êu", "sờ, au, sau", "sau", "cau", "tàu", "bậu", "gấu", "khều", "rêu", "rau củ", "con trâu", "chú tễu", "Nhà dì Tư ở quê có cây cau, giàn trầu.", "Sau nhà có rau cải, rau dền và cả dưa hấu.", "Gần nhà dì có cây cầu tre nhỏ.", "iu", "ưu", "hờ, ưu, hưu", "hưu", "dịu", "địu", "xíu", "mưu", "lựu", "cái rìu", "cái địu", "quả lựu", "con cừu", "Bà đã nghỉ hưu.", "Ngày ngày, bà đi chợ, nấu ăn và chăm lo cho con cháu.", "Mỗi lần đưa bé đi dạo, bà hay kể về ngày xưa.", "củi", "rau", "câu", "sưu", "khâu vá", "gửi quà", "kéo co", "cây cau", "kêu gọi", "vui vẻ", "chịu khó", "mưu trí", "Nghỉ hè, nhà Hà đi Tam Đảo.", "Khi tán cây, ngọn cỏ còn thiu thiu ngủ, Hà đã dậy ngắm mây mù.", "Đến trưa, trời như vào thu.", "ac", "ăc", "âc", "thờ, ac, thac, sắc, thác", "thác", "lạc", "nhạc", "mặc", "nhắc", "gấc", "giấc", "bác sĩ", "mắc áo", "quả gấc", "Nếu lên Tây Bắc, bạn hãy đến Sa Pa.", "Vào mùa hè, mỗi ngày ở đây như có bốn mùa.", "Sa Pa có Thác Bạc, có Cầu Mây, có các bản Tả Van, Tả Phìn, Sín Chải.", "oc", "ôc", "uc", "ưc", "gờ, oc, goc, sắc, góc", "góc", "học", "sóc", "cốc", "lộc", "chục", "cúc", "đức", "mực", "con sóc", "cái cốc", "máy xúc", "con mực", "Đi học về, Hà thấy mấy khóm cúc đã nở rực rỡ.", "Hà hái cúc, cắm vào cốc rồi để ngay ngắn trên bàn học.", "Mẹ tấm tắc khen Hà khéo tay.", "at", "ăt", "ât", "hờ, at, hat, sắc, hát", "hát", "bát", "lạt", "sắt", "gặt", "đất", "gật", "bãi cát", "mặt trời", "bật lửa", "Hè đến, nhà Nam đi nghỉ mát ở Cát Bà.", "Mẹ và Nam bỏ áo bơi, bàn chải, khăn mặt vào ba lô.", "Nam rất vui khi đi chơi xa với cả nhà.", "ot", "ôt", "ơt", "ngờ, ot, ngot, sắc, ngót", "ngót", "ngọt", "vót", "cột", "tốt", "thớt", "vợt", "quả nhót", "lá lốt", "quả ớt", "Sớm nay thức dậy, Nam chợt thấy một chú chim sâu.", "Chim hớn hở như chào Nam.", "Nó nhảy nhót một hồi rồi bay qua bay lại, tìm bắt sâu bọ cho cây.", "lọ mực", "cột mốc", "hạt thóc", "xúc xắc", "gót chân", "đôi mắt", "lác đác", "giấc mơ", "Gà mẹ dẫn đàn con đi ăn.", "Chốc chốc, tìm thấy mồi, gà mẹ \"tục... tục...\" gọi con.", "Đàn gà con chạy lại, chen chúc nhau ăn rồi rúc vào bên mẹ."];/*CAU-DOC-HET*/
/* Lời app đọc + tên âm lớp 1 (bảng PHAT_AM). ghep_du_lieu.py đọc khối này để biết câu cần thu giọng. JSON chuẩn. */
/* Bài lớp 1A đang học — bài mở ra khi bấm «Học bài hôm nay» (nếu link không có đuôi #toi-…). Cả 50 bài vẫn chọn được ở «Chọn bài khác». */
/*BAI-LOP-BAT*/const BAI_LOP = 30;/*BAI-LOP-HET*/


/* =====================================================================
   TIỆN ÍCH
   ===================================================================== */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const nfc = s => String(s == null ? "" : s).normalize("NFC");
const uniq = a => Array.from(new Set(a));
function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let rand = Math.random;
function tron(a){ const b = a.slice(); for (let i = b.length - 1; i > 0; i--){ const j = Math.floor(rand() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t; } return b; }
function homNay(){ const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function soNgay(){ const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
function bao(chu, ms){ const b = $("#bao"); b.textContent = chu; b.hidden = false; clearTimeout(bao._t); bao._t = setTimeout(() => { b.hidden = true; }, ms || 3200); }
function nhay(el){ if (!el) return; el.classList.remove("nhay"); void el.offsetWidth; el.classList.add("nhay"); }
function rung(el){ if (!el) return; el.classList.remove("rung"); void el.offsetWidth; el.classList.add("rung"); }

/* =====================================================================
   TIẾNG VIỆT: tách tiếng (âm đầu + vần + dấu), ghép lại, so khớp lời nói
   ===================================================================== */
const DAU_MA = {"̀": "huyền", "́": "sắc", "̉": "hỏi", "̃": "ngã", "̣": "nặng"};
const MA_DAU = {"huyền": "̀", "sắc": "́", "hỏi": "̉", "ngã": "̃", "nặng": "̣"};
const THU_TU_DAU = ["", "huyền", "sắc", "hỏi", "ngã", "nặng"];
const AM_DAU_DS = ["ngh", "ng", "gh", "gi", "ch", "kh", "nh", "ph", "th", "tr", "qu", "b", "c", "d", "đ", "g", "h", "k", "l", "m", "n", "p", "r", "s", "t", "v", "x"];
const NGUYEN_AM = "aăâeêioôơuưy";
function tach(tieng){
  const t = nfc(tieng).toLowerCase();
  let dau = "", g = "";
  for (const ch of t.normalize("NFD")){ if (DAU_MA[ch]) dau = DAU_MA[ch]; else g += ch; }
  g = g.normalize("NFC");
  if (g === "gi") return {am: "gi", van: "i", dau, goc: g};
  let am = "";
  for (const a of AM_DAU_DS){ if (g.startsWith(a) && g.length > a.length){ am = a; break; } }
  let van = g.slice(am.length);
  if (am === "gi" && van && !NGUYEN_AM.includes(van[0])) van = "i" + van;   // gìn = gi + in
  return {am, van, dau, goc: g};
}
function viTriDau(van){
  const c = Array.from(van);
  const nguyen = c.map((x, i) => NGUYEN_AM.includes(x) ? i : -1).filter(i => i >= 0);
  if (!nguyen.length) return -1;
  const co = nguyen.filter(i => "ăâêôơư".includes(c[i]));
  if (co.length) return co[co.length - 1];
  if (nguyen.length === 1) return nguyen[0];
  if (!NGUYEN_AM.includes(c[c.length - 1])) return nguyen[nguyen.length - 1];
  if (nguyen.length >= 3) return nguyen[1];
  return nguyen[0];
}
function ghep(am, van, dau){
  let goc, lech;
  if (am === "gi" && van.startsWith("i")){ goc = "g" + van; lech = 1; } else { goc = am + van; lech = Array.from(am).length; }
  if (!dau) return goc.normalize("NFC");
  const vt = viTriDau(van);
  if (vt < 0) return goc;
  const c = Array.from(goc); c[lech + vt] = c[lech + vt] + MA_DAU[dau];
  return c.join("").normalize("NFC");
}
function chuanNoi(s){
  return nfc(s).toLowerCase().replace(/[^\p{L}\p{M}\s]/gu, " ").split(/\s+/).filter(Boolean);
}

/* ---------- cặp hay nhầm ---------- */
const CAP_AM = [["b","d"],["d","đ"],["l","n"],["ch","tr"],["s","x"],["r","d"],["r","gi"],["d","gi"],["c","k"],["g","gh"],["ng","ngh"],["h","kh"],["t","th"],["n","nh"]];
const NHOM_NGUYEN_AM = [["o","ô","ơ"],["u","ư"],["e","ê"],["a","ă","â"],["i","y"]];
const CAP_VAN = [["ua","ưa"],["ia","ua"],["ai","ay"],["ay","ây"],["ao","au"],["au","âu"],["eo","êu"],["iu","ưu"],["ui","ưi"],["oi","ôi"],["ôi","ơi"],["an","am"],["ăn","ăm"],["ân","âm"],["en","em"],["ên","êm"],["in","im"],["un","um"],["on","om"],["ôn","ôm"],["ơn","ơm"],["ac","at"],["ăc","ăt"],["âc","ât"],["oc","ot"],["ôc","ôt"]];
const CUNG_TIENG = new Set(["am:c/k", "am:g/gh", "am:ng/ngh", "am:d/gi", "van:i/y"]);   // nghe giống hệt nhau
function bienTheVan(v){
  const ra = new Set(), c = Array.from(v);
  c.forEach((x, i) => NHOM_NGUYEN_AM.forEach(g => { if (g.includes(x)) g.forEach(o => { if (o !== x){ const n = c.slice(); n[i] = o; ra.add(n.join("")); } }); }));
  CAP_VAN.forEach(([p, q]) => { if (v === p) ra.add(q); if (v === q) ra.add(p); });
  ra.delete(v); return Array.from(ra);
}
function nhanLoi(k, a, b){
  let x = [a, b];
  if (k === "dau"){ x.sort((p, q) => THU_TU_DAU.indexOf(p) - THU_TU_DAU.indexOf(q)); x = x.map(d => d || "ngang"); }
  else x.sort((p, q) => p.localeCompare(q, "vi"));
  return k + ":" + x.join("/");
}
function hienLoi(key){ const i = key.indexOf(":"); const k = key.slice(0, i), l = key.slice(i + 1); return k === "dau" ? "dấu " + l : l; }
const MAU_LOI = {am: "#2f7bf5", van: "#ff7a1a", dau: "#9b51e0"};
function phanLoai(dich, chon){
  const a = tach(dich), b = tach(chon), khac = [];
  if (a.am !== b.am) khac.push(["am", a.am || "∅", b.am || "∅"]);
  if (a.van !== b.van) khac.push(["van", a.van, b.van]);
  if (a.dau !== b.dau) khac.push(["dau", a.dau, b.dau]);
  return khac.length === 1 ? nhanLoi(...khac[0]) : null;
}

/* =====================================================================
   NGỮ LIỆU
   ===================================================================== */
const DS_BAI = (DU_LIEU.bai || []).slice().sort((a, b) => a.bai - b.bai);
const SO_BAI = DS_BAI.map(b => b.bai);
const BAI_MAX = SO_BAI.length ? SO_BAI[SO_BAI.length - 1] : 1;
const BAI_DAU = SO_BAI.length ? SO_BAI[0] : 1;
function layBai(n){ return DS_BAI.find(b => b.bai === n) || DS_BAI[0] || {bai: 1, ten: "Chưa có ngữ liệu", am: [], dau: [], mau: [], tieng: [], tu: [], cau: []}; }
function baiDen(n){ return DS_BAI.filter(b => b.bai <= n); }
function kep(n){ n = parseInt(n, 10) || BAI_MAX; if (n > BAI_MAX) n = BAI_MAX; if (n < BAI_DAU) n = BAI_DAU; while (!SO_BAI.includes(n) && n > BAI_DAU) n--; return n; }
function baiKe(n, buoc, tran){ const i = SO_BAI.indexOf(n); const j = Math.max(0, Math.min(SO_BAI.length - 1, i + buoc)); const m = SO_BAI[j] || n; return tran && m > tran ? n : m; }
const HINH = {};
DS_BAI.forEach(b => (b.tu || []).forEach(t => { if (t.hinh && !HINH[nfc(t.chu)]) HINH[nfc(t.chu)] = t.hinh; }));
function phat(a){ return LOI.phat_am[a] || a; }
function docVan(v){ return Array.from(nfc(v)).length === 1 ? phat(v) : nfc(v); }
function danhVan(m){   // «bờ, a, ba, huyền, bà» — trùng cách ghep_du_lieu.py viết
  const am = nfc(m.am || ""), van = nfc(m.van || ""), p = [];
  if (am) p.push(phat(am));
  p.push(docVan(van));
  if (am) p.push(am === "gi" && van.startsWith("i") ? "g" + van : am + van);
  if (m.dau){ p.push(m.dau); p.push(nfc(m.tieng)); }
  return p.join(", ");
}
const _hoc = {};
function hocToi(n){
  if (_hoc[n]) return _hoc[n];
  const am = new Set(), dau = new Set([""]), tieng = new Set();
  baiDen(n).forEach(b => {
    (b.am || []).forEach(x => am.add(nfc(x)));
    (b.dau || []).forEach(x => dau.add(nfc(x)));
    (b.tieng || []).concat((b.mau || []).map(m => m.tieng)).forEach(t => tieng.add(nfc(t).toLowerCase()));
    (b.tu || []).forEach(w => chuanNoi(w.chu).forEach(t => tieng.add(t)));
  });
  const amDau = new Set(Array.from(am).filter(x => AM_DAU_DS.includes(x)));
  const van = new Set(Array.from(am).filter(x => !AM_DAU_DS.includes(x)));
  return (_hoc[n] = {am, amDau, van, dau, tieng});
}
function mucCuaBai(b){
  return {
    t: uniq((b.mau || []).map(m => nfc(m.tieng)).concat((b.tieng || []).map(nfc))),
    w: uniq((b.tu || []).map(x => nfc(x.chu))),
    c: uniq((b.cau || []).map(nfc).filter(c => chuanNoi(c).length >= 2))
  };
}
function phuongAnNhieu(t, n, so, laNghe){
  const hoc = hocToi(n), p = tach(t), ds = [];
  const them = (chu, nhan) => {
    chu = nfc(chu);
    if (!chu || chu === t || ds.some(x => x.chu === chu)) return;
    if (laNghe && nhan && CUNG_TIENG.has(nhan) && !(n >= 29 && /^am:(c\/k|g\/gh|ng\/ngh)$/.test(nhan))) return;
    ds.push({chu, nhan});
  };
  const dau = [], amD = [], van = [];
  hoc.dau.forEach(d => { if (d !== p.dau && p.van) dau.push([ghep(p.am, p.van, d), nhanLoi("dau", p.dau, d)]); });
  CAP_AM.forEach(([a, b]) => { const o = p.am === a ? b : p.am === b ? a : null; if (o && hoc.amDau.has(o)) amD.push([ghep(o, p.van, p.dau), nhanLoi("am", p.am, o)]); });
  bienTheVan(p.van).forEach(v => { if (hoc.van.has(v)) van.push([ghep(p.am, v, p.dau), nhanLoi("van", p.van, v)]); });
  const ba = [tron(amD), tron(van), tron(dau)];
  for (let vong = 0; ds.length < so && vong < 8; vong++) ba.forEach(l => { if (ds.length < so && l[vong]) them(l[vong][0], l[vong][1]); });
  for (const x of tron(Array.from(hoc.tieng))){ if (ds.length >= so) break; if (chuanNoi(x).length === 1) them(x, phanLoai(t, x)); }
  return ds;
}
function khayTau(t, n){
  const hoc = hocToi(n), p = tach(t);
  const banAm = tron(CAP_AM.filter(c => c.includes(p.am)).flat().filter(x => x !== p.am && hoc.amDau.has(x)));
  const am = uniq([p.am].concat(banAm, tron(Array.from(hoc.amDau)))).slice(0, 3);
  const van = uniq([p.van].concat(tron(bienTheVan(p.van).filter(v => hoc.van.has(v))), tron(Array.from(hoc.van)))).slice(0, 3);
  return {am: tron(am), van: tron(van), dau: THU_TU_DAU.filter(d => hoc.dau.has(d))};
}
function ghepDuoc(t, n){ const hoc = hocToi(n), p = tach(t); return !!p.am && hoc.amDau.has(p.am) && hoc.van.has(p.van) && hoc.dau.has(p.dau) && ghep(p.am, p.van, p.dau) === nfc(t).toLowerCase(); }

/* =====================================================================
   LƯU TRONG TRÌNH DUYỆT (máy này) — mọi lệnh bọc try/catch
   ===================================================================== */
const KHO_KHOA = "nghe-oi-doc-nao.v1";
function khoMoi(){ return {caiDat: {}, hs: {}}; }
function docKho(){ try { const k = JSON.parse(localStorage.getItem(KHO_KHOA)); return k && k.hs ? k : khoMoi(); } catch (e){ return khoMoi(); } }
let KHO = docKho();
let CHUP = false, HASH = {};
function luu(){ if (CHUP) return; callbacks.onSave?.(JSON.parse(JSON.stringify(KHO))); try { localStorage.setItem(KHO_KHOA, JSON.stringify(KHO)); } catch (e){} }
function hsMoi(conVat){ return {conVat: conVat || "🐰", muc: {}, am: {}, loi: {}, loiCT: [], phut: {}, daDoc: {}, docTheo: 0}; }
function layHS(ma){ if (!KHO.hs[ma]) KHO.hs[ma] = hsMoi(conVatCua(ma)); const h = KHO.hs[ma]; ["muc", "am", "loi", "phut", "daDoc"].forEach(k => { if (!h[k]) h[k] = {}; }); if (!h.loiCT) h.loiCT = []; return h; }

/* =====================================================================
   TRẠNG THÁI
   ===================================================================== */
const S = {ma: null, hs: null, bai: 1, baiToi: 1, man: "dau", tro: "tau", conVatChon: "🐰",
  tau: null, cham: null, doc: null, tv: null, phienGiay: 0, daNhac10: false, daNhac15: false, lanCuoi: Date.now(), coMo: false, cayVuaLon: null};
const CON_VAT_MA = ["🐰", "🐱", "🐶", "🐥", "🐸", "🐯", "🐼", "🐨", "🐵", "🦊", "🐻", "🐷", "🐮", "🐭", "🐹", "🦁", "🐔", "🐧", "🦉", "🦆",
  "🐢", "🐟", "🐬", "🐳", "🦋", "🐝", "🐞", "🐌", "🦀", "🐙", "🦒", "🦓", "🐘", "🦏", "🐪", "🦔", "🦜", "🦚", "🐊", "🦩"];   // HS01 → 🐰 … HS40 → 🦩
function conVatCua(ma){ const h = KHO.hs[ma]; return (h && h.conVat) || CON_VAT_MA[(parseInt(String(ma).slice(2), 10) || 1) - 1] || "🐰"; }

/* =====================================================================
   GIỌNG ĐỌC (qua khối giọng Việt chuẩn — giong_viet.py chen) + ÂM THANH
   ===================================================================== */
let __hangDoc = 0;
function dangDoc(){
  try { if (typeof __amDang !== "undefined" && __amDang && !__amDang.paused && !__amDang.ended) return true; } catch (e){}
  try { return !!(window.speechSynthesis && speechSynthesis.speaking); } catch (e){ return false; }
}
function docMot(chu, toc){
  if (CHUP || !chu) return;
  try { if (typeof docGiongViet === "function") docGiongViet(chu, null, toc ? .7 : undefined); } catch (e){}
  try { if (toc && typeof __amDang !== "undefined" && __amDang) __amDang.playbackRate = toc; } catch (e){}   // 🐢 nghe chậm
}
function docLienTiep(ds, toc){
  const ma = ++__hangDoc; let i = 0;
  const tiep = () => { if (ma !== __hangDoc || i >= ds.length) return; docMot(ds[i++], toc); if (i < ds.length) setTimeout(cho, 450); };
  const cho = () => { if (ma !== __hangDoc) return; if (dangDoc()) setTimeout(cho, 200); else setTimeout(tiep, 250); };
  tiep(); return ma;
}
/* chữ sáng dần theo tiếng nghé đọc (theo thời lượng âm thanh đã thu; không có thì ước nhịp 0,6 giây/tiếng) */
function karaoke(ma, els, xong){
  const n = els.length, bd = performance.now(); let het = false;
  const don = () => els.forEach(x => x.classList.remove("dang-doc", "da-doc", "sang"));
  const ket = () => { if (het) return; het = true; don(); if (xong) xong(); };
  const lap = () => {
    if (ma !== __hangDoc){ don(); return; }
    let a = null; try { a = typeof __amDang !== "undefined" ? __amDang : null; } catch (e){}
    const t = (performance.now() - bd) / 1000; let i;
    if (a && isFinite(a.duration) && a.duration > 0){ if (a.ended){ ket(); return; } i = Math.min(n - 1, Math.floor(a.currentTime / a.duration * n)); }
    else if (dangDoc()) i = Math.min(n - 1, Math.floor(t / .6));
    else if (t > 1.2){ ket(); return; }
    else i = 0;
    els.forEach((x, k) => { x.classList.toggle("dang-doc", k === i); x.classList.toggle("da-doc", k < i); });
    if (t > 40){ ket(); return; }
    setTimeout(lap, 60);
  };
  setTimeout(lap, 60);   // hẹn giờ (không dùng requestAnimationFrame: trình duyệt dừng nó khi trang bị che)
}
function noi(chu){ docLienTiep([chu]); }
let AC = null;
function layAC(){ if (!AC){ const A = window.AudioContext || window.webkitAudioContext; AC = new A(); } if (AC.state === "suspended") AC.resume().catch(() => {}); return AC; }
function tieng(ds){ if (CHUP) return; try { const ac = layAC(), t = ac.currentTime;
  ds.forEach(([f, d, dai, kieu, to]) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = kieu || "sine"; o.frequency.setValueAtTime(f, t + d);
    g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(to || .3, t + d + .015); g.gain.exponentialRampToValueAtTime(0.0001, t + d + dai);
    o.connect(g); g.connect(ac.destination); o.start(t + d); o.stop(t + d + dai + .05); }); } catch (e){} }
const ting = () => tieng([[1318.5, 0, .5], [1760, .12, .7]]);
const bup = () => tieng([[260, 0, .25, "triangle", .25], [180, .12, .3, "triangle", .2]]);
const tuTu = () => tieng([[392, 0, .25, "square", .08], [392, .35, .4, "square", .08]]);

/* ---------- pháo giấy ---------- */
function itChuyenDong(){ try { return document.body.classList.contains("it-cd") || matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e){ return false; } }
function phaoGiay(){
  if (itChuyenDong() && !CHUP) return;
  const c = $("#phaoGiay"); let g;
  try { g = c.getContext("2d"); } catch (e){ return; }
  const dpr = window.devicePixelRatio || 1, W = innerWidth, H = innerHeight;
  c.width = W * dpr; c.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const mau = ["#ff5fa2", "#ffc93c", "#20c4a2", "#8c6cff", "#3fa7ff", "#ff9f43", "#5ee08f"];
  const ds = [];
  for (let i = 0; i < 160; i++) ds.push({x: W / 2 + (rand() - .5) * W * .3, y: H * .35, vx: (rand() - .5) * 18, vy: -rand() * 16 - 4, m: mau[i % mau.length], s: 6 + rand() * 8, r: rand() * 6, vr: (rand() - .5) * .4, h: rand() < .3});
  const ve = () => { g.clearRect(0, 0, W, H); ds.forEach(p => { g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.m;
    if (p.h){ g.beginPath(); g.arc(0, 0, p.s / 2, 0, 7); g.fill(); } else g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); }); };
  const buoc = () => ds.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .45; p.vx *= .985; p.r += p.vr; });
  if (CHUP){ ds.forEach(p => { p.x = rand() * W; p.y = rand() * H * .75; }); ve(); return; }
  const bd = performance.now();
  const lap = now => { buoc(); ve(); if (now - bd < 2600) requestAnimationFrame(lap); else g.clearRect(0, 0, W, H); };
  requestAnimationFrame(lap);
}

/* =====================================================================
   HÌNH VẼ SVG TỰ VẼ: chú nghé (5 biểu cảm), dấu thanh, đầu máy tàu, cây quê
   ===================================================================== */
function sao(x, y, r, mau){ let d = ""; for (let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; d += (i ? "L" : "M") + (x + rr * Math.cos(a)).toFixed(1) + " " + (y + rr * Math.sin(a)).toFixed(1); } return `<path d="${d}Z" fill="${mau || "#ffc93c"}" stroke="#fff" stroke-width="2"/>`; }
function matNghe(bc){
  const mo = (x, dx, dy) => `<ellipse cx="${x}" cy="90" rx="12.5" ry="13.5" fill="#fff"/><circle cx="${x + dx}" cy="${92 + dy}" r="8.6" fill="#2b2350"/><circle cx="${x + dx + 3}" cy="${88 + dy}" r="3.3" fill="#fff"/><circle cx="${x + dx - 3}" cy="${95 + dy}" r="1.5" fill="#fff"/>`;
  if (bc === "khen") return `<path d="M62 92 Q74 76 86 92" stroke="#2b2350" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M114 92 Q126 76 138 92" stroke="#2b2350" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  if (bc === "ngu") return `<path d="M63 90 Q74 98 85 90" stroke="#2b2350" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M115 90 Q126 98 137 90" stroke="#2b2350" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  if (bc === "nghe") return `<g>${mo(74, 3, -3)}${mo(126, 3, -3)}</g>`;
  if (bc === "dong-vien") return `<g class="mat-chop">${mo(74, 0, 1)}${mo(126, 0, 1)}</g><path d="M62 72 Q73 66 84 71" stroke="#5b6482" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M116 71 Q127 66 138 72" stroke="#5b6482" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  return `<g class="mat-chop">${mo(74, 1, 0)}${mo(126, -1, 0)}</g>`;
}
function miengNghe(bc){
  if (bc === "khen") return `<path d="M85 131 Q100 154 115 131 Z" fill="#c2475a"/><path d="M92 141 Q100 149 108 141 Q100 137 92 141Z" fill="#ff8fa0"/>`;
  if (bc === "nghe") return `<ellipse cx="100" cy="138" rx="5.5" ry="6.5" fill="#c2475a"/>`;
  if (bc === "ngu") return `<path d="M94 137 Q100 140 106 137" stroke="#8a4b45" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  return `<path d="M88 133 Q100 143 112 133" stroke="#8a4b45" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
}
function tayNghe(bc){
  const tay = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#8792b0" stroke-width="20" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="9" fill="#4a4f6a"/>`;
  if (bc === "khen") return tay(66, 156, 38, 118) + tay(134, 156, 162, 118);
  if (bc === "nghe") return tay(64, 158, 56, 190) + tay(136, 154, 166, 112);
  if (bc === "dong-vien") return tay(64, 156, 86, 170) + tay(136, 156, 114, 170) + `<path d="M100 186 C88 176 84 164 92 160 C96 158 100 162 100 165 C100 162 104 158 108 160 C116 164 112 176 100 186Z" fill="#ff5a6e" stroke="#fff" stroke-width="2"/>`;
  return tay(64, 156, 54, 190) + tay(136, 156, 146, 190);
}
function veNghe(bc){
  bc = bc || "vui";
  const taiPhai = bc === "nghe" ? `<g transform="rotate(-38 160 80)"><ellipse cx="164" cy="80" rx="29" ry="13" fill="#8792b0"/><ellipse cx="166" cy="80" rx="19" ry="7.5" fill="#ffb7c5"/></g>` : `<g transform="rotate(18 160 88)"><ellipse cx="160" cy="88" rx="24" ry="12" fill="#8792b0"/><ellipse cx="158" cy="88" rx="15" ry="6.5" fill="#ffb7c5"/></g>`;
  const them = {
    khen: sao(28, 46, 13) + sao(176, 34, 10, "#ff9fd0") + sao(184, 100, 8, "#7fe0ff"),
    nghe: `<g stroke="#ff5fa2" stroke-width="4" fill="none" stroke-linecap="round"><path d="M186 60 Q194 72 186 84"/><path d="M194 52 Q206 72 194 92"/></g>`,
    ngu: `<text x="150" y="40" font-size="24" font-weight="900" fill="#8c6cff" font-family="Arial">z</text><text x="168" y="24" font-size="30" font-weight="900" fill="#8c6cff" font-family="Arial">Z</text>`,
    "dong-vien": sao(32, 52, 8, "#ffd23f")
  }[bc] || "";
  return `<svg viewBox="0 0 210 232" role="img" aria-label="Chú nghé">
  <ellipse cx="100" cy="222" rx="62" ry="8" fill="rgba(40,30,90,.16)"/>
  <path d="M146 176 q22 -6 20 -30" stroke="#727d9c" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="166" cy="144" r="7" fill="#4a4f6a"/>
  <ellipse cx="100" cy="174" rx="50" ry="40" fill="url(#gThan)"/>
  <ellipse cx="100" cy="181" rx="30" ry="25" fill="#d6dcea"/>
  <rect x="70" y="190" width="22" height="30" rx="11" fill="#7d88a7"/><rect x="108" y="190" width="22" height="30" rx="11" fill="#7d88a7"/>
  <rect x="70" y="210" width="22" height="11" rx="5.5" fill="#4a4f6a"/><rect x="108" y="210" width="22" height="11" rx="5.5" fill="#4a4f6a"/>
  <path d="M56 142 Q100 164 144 142 L136 156 Q100 174 64 156 Z" fill="#ff5a6e"/><path d="M90 160 L110 160 L100 180 Z" fill="#ff5a6e"/>
  <circle cx="76" cy="152" r="2.6" fill="#fff"/><circle cx="100" cy="162" r="2.6" fill="#fff"/><circle cx="124" cy="152" r="2.6" fill="#fff"/>
  <path d="M58 58 Q38 52 36 28 Q50 42 72 46 Z" fill="#f6e7bf" stroke="#d8c38f" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M142 58 Q162 52 164 28 Q150 42 128 46 Z" fill="#f6e7bf" stroke="#d8c38f" stroke-width="2.5" stroke-linejoin="round"/>
  <g transform="rotate(-18 40 88)"><ellipse cx="40" cy="88" rx="24" ry="12" fill="#8792b0"/><ellipse cx="42" cy="88" rx="15" ry="6.5" fill="#ffb7c5"/></g>
  ${taiPhai}
  <ellipse cx="100" cy="96" rx="64" ry="54" fill="url(#gDau)"/>
  <path d="M84 48 q5 -16 15 -5 q8 -13 16 5 q-15 -7 -31 0z" fill="#5b6482"/>
  <ellipse cx="100" cy="123" rx="40" ry="26" fill="#f1d5cb"/>
  <ellipse cx="87" cy="118" rx="4.6" ry="3.3" fill="#b07a70"/><ellipse cx="113" cy="118" rx="4.6" ry="3.3" fill="#b07a70"/>
  <ellipse cx="54" cy="112" rx="10" ry="6.5" fill="#ff8fa8" opacity=".6"/><ellipse cx="146" cy="112" rx="10" ry="6.5" fill="#ff8fa8" opacity=".6"/>
  ${matNghe(bc)}${miengNghe(bc)}${tayNghe(bc)}${them}
</svg>`;
}
function veDauThanh(d){
  const n = {
    "": `<circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" stroke-width="3.5" stroke-dasharray="5 4"/>`,
    "huyền": `<path d="M13 9 L27 31" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>`,
    "sắc": `<path d="M27 9 L13 31" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>`,
    "hỏi": `<path d="M13 13 Q14 5 21 5 Q29 6 28 13 Q27 19 20 20 L20 30" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`,
    "ngã": `<path d="M7 23 Q13 11 20 19 Q27 28 33 16" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round"/>`,
    "nặng": `<circle cx="20" cy="21" r="7" fill="currentColor"/>`
  }[d] || "";
  return `<svg viewBox="0 0 40 40" aria-label="${esc(LOI.dau_ten[d] || "")}">${n}</svg>`;
}
function veDauMay(){
  return `<svg viewBox="0 0 170 130" aria-hidden="true">
  <g fill="#fff" opacity=".9"><circle class="khoi1" cx="120" cy="22" r="11"/><circle cx="136" cy="12" r="8"/><circle cx="104" cy="10" r="6"/></g>
  <rect x="106" y="30" width="22" height="34" rx="4" fill="#4b3f6b"/><rect x="100" y="26" width="34" height="10" rx="5" fill="#2f2747"/>
  <rect x="8" y="22" width="70" height="78" rx="14" fill="url(#gTau)"/>
  <rect x="18" y="32" width="50" height="40" rx="10" fill="#bfe8ff"/>
  <g transform="translate(19 30) scale(.24)"><ellipse cx="100" cy="96" rx="64" ry="54" fill="url(#gDau)"/>
    <path d="M58 58 Q38 52 36 28 Q50 42 72 46 Z" fill="#f6e7bf"/><path d="M142 58 Q162 52 164 28 Q150 42 128 46 Z" fill="#f6e7bf"/>
    <ellipse cx="100" cy="123" rx="40" ry="26" fill="#f1d5cb"/><circle cx="74" cy="92" r="9" fill="#2b2350"/><circle cx="126" cy="92" r="9" fill="#2b2350"/>
    <circle cx="77" cy="88" r="3.5" fill="#fff"/><circle cx="129" cy="88" r="3.5" fill="#fff"/><path d="M88 133 Q100 143 112 133" stroke="#8a4b45" stroke-width="5" fill="none"/></g>
  <rect x="70" y="56" width="80" height="44" rx="16" fill="url(#gTau)"/>
  <circle cx="150" cy="70" r="9" fill="#ffe57f" stroke="#fff" stroke-width="3"/>
  <path d="M150 96 L168 112 L140 112Z" fill="#4b3f6b"/>
  <rect x="2" y="96" width="150" height="10" rx="5" fill="#4b3f6b"/>
  <g fill="#3b3550" stroke="#ddd" stroke-width="4"><circle cx="34" cy="112" r="15"/><circle cx="82" cy="114" r="12"/><circle cx="120" cy="114" r="12"/></g>
  <text x="44" y="94" text-anchor="middle" font-size="12" font-weight="900" fill="#fff" font-family="Arial">1A</text>
</svg>`;
}
const LOAI_CAY = [["lua", "lúa"], ["bap", "bắp"], ["caphe", "cà phê"], ["hotieu", "hồ tiêu"], ["daquy", "dã quỳ"], ["chuoi", "chuối"], ["mia", "mía"], ["bido", "bí đỏ"]];
function hoaQuy(x, y, r){ let s = ""; for (let i = 0; i < 12; i++) s += `<ellipse cx="${x}" cy="${y - r * .7}" rx="${r * .28}" ry="${r * .62}" fill="#ffcc00" transform="rotate(${i * 30} ${x} ${y})"/>`; return s + `<circle cx="${x}" cy="${y}" r="${r * .42}" fill="#b5651d"/>`; }
function cayDay(loai, qua){
  let s = "";
  if (loai === "lua"){
    for (let i = -3; i <= 3; i++) s += `<path d="M50 108 Q${50 + i * 4} 70 ${50 + i * 11} ${30 + Math.abs(i) * 8}" stroke="${i % 2 ? "#5cb85c" : "#46a046"}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    if (qua) [-2, 0, 2].forEach(i => { const x = 50 + i * 11, y = 30 + Math.abs(i) * 8; s += `<path d="M${x} ${y} q12 -2 14 16" stroke="#d9a520" stroke-width="3" fill="none"/>`; for (let k = 0; k < 5; k++) s += `<ellipse cx="${x + 3 + k * 2.6}" cy="${y + 1 + k * 3.2}" rx="2.6" ry="4" fill="#f2c94c"/>`; });
  } else if (loai === "bap"){
    s += `<rect x="47" y="24" width="6" height="86" rx="3" fill="#62b346"/>`;
    [[80, -1], [62, 1], [46, -1]].forEach(([y, h]) => s += `<path d="M50 ${y} Q${50 + h * 26} ${y - 16} ${50 + h * 38} ${y - 2} Q${50 + h * 22} ${y - 6} 50 ${y + 8}Z" fill="#4fa83a"/>`);
    s += `<path d="M50 24 l-8 -14 M50 24 l0 -16 M50 24 l8 -14" stroke="#c8a24a" stroke-width="2.5" stroke-linecap="round"/>`;
    if (qua) s += `<ellipse cx="60" cy="66" rx="8" ry="17" fill="#ffd23f"/><path d="M54 56h12M54 62h12M54 68h12M54 74h12" stroke="#e8b100" stroke-width="1.5"/><path d="M52 82 Q50 60 60 46 Q56 66 62 84Z" fill="#7cc35a"/><path d="M68 82 Q72 62 62 48 Q66 66 58 84Z" fill="#6ab34a"/>`;
  } else if (loai === "caphe"){
    s += `<path d="M50 110 L50 40 M50 80 L30 62 M50 70 L72 52 M50 56 L36 40" stroke="#7a5230" stroke-width="4" stroke-linecap="round"/>`;
    [[30, 58], [24, 66], [36, 50], [72, 48], [78, 58], [64, 46], [50, 34], [40, 36], [60, 36], [44, 72], [58, 64]].forEach(([x, y], i) => s += `<ellipse cx="${x}" cy="${y}" rx="9" ry="5" fill="${i % 2 ? "#2f8f4e" : "#3aa35b"}" transform="rotate(${i * 33} ${x} ${y})"/>`);
    if (qua) [[38, 64], [42, 60], [64, 58], [68, 62], [54, 46], [30, 48], [47, 82]].forEach(([x, y]) => s += `<circle cx="${x}" cy="${y}" r="3.6" fill="#d62f3a"/><circle cx="${x - 1}" cy="${y - 1}" r="1" fill="#ff9aa0"/>`);
  } else if (loai === "hotieu"){
    s += `<rect x="45" y="12" width="10" height="98" rx="4" fill="#a0703c"/>`;
    for (let i = 0; i < 6; i++){ const y = 24 + i * 14, x = i % 2 ? 62 : 38; s += `<ellipse cx="${x}" cy="${y}" rx="10" ry="7" fill="${i % 2 ? "#3aa35b" : "#2f8f4e"}"/>`; if (qua && i < 5) for (let k = 0; k < 4; k++) s += `<circle cx="${x + (i % 2 ? 4 : -4)}" cy="${y + 7 + k * 4}" r="2.4" fill="${k < 2 ? "#e53935" : "#8bc34a"}"/>`; }
  } else if (loai === "daquy"){
    s += `<path d="M50 110 Q48 70 50 40 M50 80 Q36 66 32 56 M50 74 Q64 62 70 52" stroke="#4f9a3a" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="40" cy="92" rx="10" ry="5" fill="#4fa83a" transform="rotate(-30 40 92)"/><ellipse cx="60" cy="88" rx="10" ry="5" fill="#4fa83a" transform="rotate(30 60 88)"/>`;
    s += qua ? hoaQuy(50, 36, 15) + hoaQuy(30, 54, 11) + hoaQuy(71, 50, 11) : `<circle cx="50" cy="38" r="7" fill="#7cc35a"/>`;
  } else if (loai === "chuoi"){
    s += `<path d="M44 110 L46 50 L56 50 L58 110Z" fill="#8bbf5a"/>`;
    [[-40, 30, 40], [40, 70, 40], [-15, 40, 26], [15, 60, 26]].forEach(([r, x, y]) => s += `<ellipse cx="${x}" cy="${y}" rx="28" ry="9" fill="#58b947" transform="rotate(${r} ${x} ${y})"/><path d="M${x - 22} ${y} L${x + 22} ${y}" stroke="#3f9f3a" stroke-width="1.5" transform="rotate(${r} ${x} ${y})"/>`);
    if (qua) s += `<g fill="#ffd84a" stroke="#c9a400" stroke-width="1">${[0, 1, 2, 3].map(i => `<path d="M${58 + i * 3} ${60 + i * 6} q10 2 12 -6 q-4 10 -12 10z"/>`).join("")}</g><ellipse cx="66" cy="92" rx="5" ry="8" fill="#8e3b6e"/>`;
  } else if (loai === "mia"){
    [[38, 20], [50, 10], [62, 24]].forEach(([x, y]) => { s += `<rect x="${x - 4}" y="${y}" width="8" height="${110 - y}" rx="3" fill="#8e5aa8"/>`; for (let k = y + 16; k < 106; k += 16) s += `<path d="M${x - 4} ${k}h8" stroke="#5e3473" stroke-width="2"/>`; s += `<path d="M${x} ${y + 4} Q${x - 18} ${y - 4} ${x - 26} ${y + 10} M${x} ${y + 4} Q${x + 18} ${y - 6} ${x + 26} ${y + 6}" stroke="#58b947" stroke-width="3.5" fill="none" stroke-linecap="round"/>`; });
    if (!qua) s = s.replace(/#8e5aa8/g, "#9fcf6a");
  } else {
    s += `<path d="M20 104 Q36 92 50 100 T84 98" stroke="#4f9a3a" stroke-width="3" fill="none"/>`;
    [[26, 92], [46, 88], [70, 90], [84, 86]].forEach(([x, y]) => s += `<circle cx="${x}" cy="${y}" r="10" fill="#4caf50"/><circle cx="${x}" cy="${y}" r="5" fill="#66c35a"/>`);
    if (qua) s += `<g><ellipse cx="50" cy="94" rx="20" ry="14" fill="#ff8c1a"/><ellipse cx="50" cy="94" rx="9" ry="14" fill="#ffa040"/><path d="M50 81 q2 -8 8 -9" stroke="#5a8f2e" stroke-width="3" fill="none"/></g>`;
  }
  return s;
}
function veCay(loai, giai){
  const dat = `<ellipse cx="50" cy="110" rx="32" ry="7.5" fill="#a8754a"/><ellipse cx="50" cy="108" rx="24" ry="4.5" fill="#bf8a5a"/>`;
  let than;
  if (giai <= 0) than = `<ellipse cx="50" cy="104" rx="5.5" ry="4.2" fill="#7a4e2d"/><path d="M50 101 q2 -5 5 -6" stroke="#6fc04e" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  else if (giai === 1) than = `<path d="M50 108 L50 82" stroke="#5cb85c" stroke-width="4" stroke-linecap="round"/><ellipse cx="41" cy="82" rx="10" ry="5.5" fill="#6fc04e" transform="rotate(-25 41 82)"/><ellipse cx="59" cy="80" rx="10" ry="5.5" fill="#5cb85c" transform="rotate(25 59 80)"/>`;
  else if (giai === 2) than = `<g transform="translate(50 110) scale(.68) translate(-50 -110)">${cayDay(loai, false)}</g>`;
  else than = cayDay(loai, true) + sao(86, 18, 7, "#ffd23f");
  return `<svg viewBox="0 0 100 120" aria-hidden="true">${dat}${than}</svg>`;
}
function hinhTu(chu, lop){
  const h = HINH[nfc(chu)];
  if (h) return `<span class="hinh ${lop || ""}">${esc(h)}</span>`;
  let n = 0; for (const c of chu) n = (n * 31 + c.codePointAt(0)) % 360;
  return `<span class="hinh the-mau ${lop || ""}" style="--h:${n}">${esc(Array.from(chu)[0] || "")}</span>`;
}

/* =====================================================================
   AI CÁ NHÂN HOÁ: ô Leitner (lặp cách quãng) cho từng mục, từng mã HS
   ===================================================================== */
const KHOANG = [0, 0, 1, 2, 4, 8];   // ô 1..5 → số ngày tới lần ôn sau
function capNhatMuc(key, dung){
  if (!S.hs) return;
  const r = S.hs.muc[key] || {b: 1, d: 0, s: 0, h: 0};
  r.pb = r.b;
  if (dung){ r.d++; r.b = Math.min(5, r.b + 1); } else { r.s++; r.b = 1; }
  r.h = soNgay() + KHOANG[r.b]; S.hs.muc[key] = r; ghiHoatDong(key, dung); luu();
}
function capNhatAm(chu, dung){
  if (!S.hs) return; const hoc = hocToi(S.baiToi); S.cayVuaLon = null;
  chuanNoi(chu).forEach(t => { const p = tach(t); [p.am, p.van].forEach(x => { if (x && hoc.am.has(x)){ const cu = S.hs.am[x] || 0; S.hs.am[x] = Math.max(0, Math.min(9, cu + (dung ? 1 : -1))); if (dung && !S.cayVuaLon) S.cayVuaLon = x; } }); });
  luu();
}
function ghiLoi(dich, chon, nhan){
  if (!S.hs) return;
  if (nhan){ S.hs.loi[nhan] = (S.hs.loi[nhan] || 0) + 1; }
  S.hs.loiCT.push({d: dich, c: chon, l: nhan || "khác", n: homNay()}); if (S.hs.loiCT.length > 40) S.hs.loiCT.shift();
  luu();
}
function diemUuTien(key){ const r = S.hs && S.hs.muc[key]; if (!r) return 1.5 + rand(); return (r.h <= soNgay() ? 3 : 0) + r.s * 1.5 - r.d * .3 + (5 - r.b) + rand(); }
function mucOn(n, loai, so){
  const ds = []; baiDen(n - 1).forEach(b => mucCuaBai(b)[loai].forEach(c => ds.push(c)));
  return uniq(ds).map(c => [c, diemUuTien(loai + ":" + c)]).sort((a, b) => b[1] - a[1]).slice(0, so).map(x => x[0]);
}
function chonTheoUuTien(ds, loai, so){ return ds.map(c => [c, diemUuTien(loai + ":" + c)]).sort((a, b) => b[1] - a[1]).slice(0, so).map(x => x[0]); }
function cayVung(){ return S.hs ? Object.values(S.hs.am).filter(v => v >= 5).length : 0; }

/* =====================================================================
   ĐIỀU HƯỚNG
   ===================================================================== */
const MAN = {dau: "man-dau", nghe: "man-nghe", tau: "man-choi", cham: "man-choi", doc: "man-doc", vuon: "man-vuon", co: "man-co", tivi: "man-tivi"};
const MAN_HOC = ["nghe", "tau", "cham", "doc", "vuon"];
function chonHSMacDinh(){ if (S.hs) return; const ma = KHO.caiDat.hsCuoi || "HS01"; S.ma = ma; S.hs = layHS(ma); }
function diToi(ten){
  if (!MAN[ten]) ten = "dau";
  if (MAN_HOC.includes(ten)) chonHSMacDinh();
  S.man = ten;
  HOP.forEach(x => dongHop(x));
  $$(".man").forEach(m => m.classList.remove("hien"));
  $("#" + MAN[ten]).classList.add("hien");
  document.body.dataset.man = ten;
  document.body.classList.toggle("tivi", ten === "tivi");
  $("#thanh").hidden = !MAN_HOC.includes(ten);
  $$("#thanh .chang [data-di]").forEach(b => b.classList.toggle("dang", b.dataset.di === ten || (ten === "cham" && b.dataset.di === "tau")));
  if (MAN_HOC.includes(ten)) veThanh();
  if (ten === "dau") veTrangDau();
  else if (ten === "nghe") veNgheMan();
  else if (ten === "tau" || ten === "cham"){ S.tro = ten; veChoi(); }
  else if (ten === "doc") veDocMan();
  else if (ten === "vuon") veVuon();
  else if (ten === "co") veCo();
  else if (ten === "tivi") veTivi();
  if (!CHUP) try { window.scrollTo(0, 0); } catch (e){}
}
function nhanMaHS(code){ return KHO.caiDat.nhanHS?.[code] || code; }
function veThanh(){ $("#tbConVat").textContent = S.hs ? S.hs.conVat : "🐰"; $("#tbMa").textContent = nhanMaHS(S.ma) || ""; }
function capNhatDongHo(){}
function doiBai(buoc){ const m = baiKe(S.bai, buoc, S.baiToi); if (m === S.bai){ bao(buoc > 0 ? "Bài sau con chưa học tới — cô sẽ mở dần nhé!" : "Đây là bài đầu rồi."); return; } S.bai = m; if (!CHUP){ KHO.caiDat.viTriHS = {...KHO.caiDat.viTriHS, [S.ma]: m}; luu(); } S.tau = S.cham = S.doc = null; diToi(S.man); }

/* =====================================================================
   GIỌNG CỦA NGHÉ — giọng Hoài My (thu sẵn, sửa theo «LOI CAN SUA» của cô). Giọng mặc định nhúng sẵn trong file (khối giọng Việt chuẩn);
   giọng kia là gói giong/<id>.js, chỉ tải khi chọn (có khi mở bằng đường link hoặc thư mục giong/ nằm cạnh file).
   ===================================================================== */
const GIONG_DS = [{id: "hoai-my", ten: "Hoài My", vung: "giọng Bắc"}];   // cô chốt 23/10/2026: một giọng Hoài My như bản đầu
const GIONG_MAC_DINH = "hoai-my";
const GOI_GIONG = {};
let GIONG_GOC = null;
S.giong = GIONG_MAC_DINH;
window.__nhanGiong = (id, du) => { GOI_GIONG[id] = du; };
function tenGiong(id){ const g = GIONG_DS.find(x => x.id === id); return g ? g.ten : id; }
function apGiong(id){
  if (typeof GIONG_VIET === "undefined") return false;
  if (!GIONG_GOC) GIONG_GOC = Object.assign({}, GIONG_VIET);
  const goi = id === GIONG_MAC_DINH ? {} : GOI_GIONG[id];
  if (!goi) return false;
  Object.keys(GIONG_VIET).forEach(k => delete GIONG_VIET[k]);
  Object.assign(GIONG_VIET, GIONG_GOC, goi);   // câu nào gói thiếu thì dùng giọng mặc định
  S.giong = id; return true;
}
function veGiong(){
  const nut = g => `<button class="chon-giong" data-khong-bam data-giong="${g.id}" aria-pressed="${g.id === S.giong}"><span class="loa" aria-hidden="true">🔊</span><span>${esc(g.ten)}<small>${esc(g.vung)}</small></span></button>`;
  ["#luoiGiong", "#coLuoiGiong"].forEach(sel => { const o = $(sel); if (o) o.innerHTML = GIONG_DS.map(nut).join(""); });
}
function chonGiong(id, ngheThu){
  const xong = () => { if (!CHUP){ KHO.caiDat.giong = id; luu(); } veGiong(); if (ngheThu) noi(LOI.cau.chao); };
  if (apGiong(id)){ xong(); return; }
  if (CHUP) return;
  bao("Nghé đang tải giọng " + tenGiong(id) + "…", 8000);
  const sc = document.createElement("script"); sc.src = "giong/" + id + ".js";
  sc.onload = () => { if (apGiong(id)){ bao("🔊 Đã chuyển sang giọng " + tenGiong(id) + "."); xong(); } else veGiong(); };
  sc.onerror = () => { bao("Máy này mới có giọng " + tenGiong(GIONG_MAC_DINH) + ". Mở app bằng đường link của cô để có thêm giọng " + tenGiong(id) + " nhé.", 6000); veGiong(); };
  document.head.appendChild(sc);
}
document.addEventListener("click", e => { const g = e.target.closest("[data-giong]"); if (g) chonGiong(g.dataset.giong, true); });

/* =====================================================================
   TRANG ĐẦU
   ===================================================================== */
function veTrangDau(){
  $("#ngheDau").innerHTML = veNghe("vui");
  const sel = $("#chonMa");
  sel.value = S.ma || KHO.caiDat.hsCuoi || "HS01";
  if (!CHUP && (KHO.caiDat.viTriHS?.[sel.value] || KHO.caiDat.baiTheoHS?.[sel.value])) S.baiToi = KHO.caiDat.viTriHS?.[sel.value] || KHO.caiDat.baiTheoHS[sel.value];
  S.conVatChon = conVatCua(sel.value);
  const quen = CHUP || !!KHO.caiDat.hsCuoi;
  $("#dauQuen").hidden = !quen; $("#dauMoi").hidden = quen;
  $("#dauMa").textContent = nhanMaHS(sel.value); $("#dauConVat").textContent = S.conVatChon;
  const hsNay = KHO.hs[sel.value], coHoc = hsNay && (hsNay.docTheo || Object.keys(hsNay.muc || {}).length);
  const lauChua = !hsNay || !hsNay.lanGui || (Date.now() - new Date(hsNay.lanGui + "T00:00:00").getTime()) / 864e5 >= 7;
  $("#dauNhacGui").hidden = CHUP || !quen || !coHoc || !lauChua;
  veConVat(""); veBaiDau(); veGiong();
  if (!CHUP) callbacks.onStudentChange?.(sel.value);
}
function moNguoiLon(){ veBaiDau(); veGiong(); moHop("#hopNguoiLon"); }
function veConVat(chon){
  let o = "";
  for (let i = 1; i <= 40; i++){ const ma = "HS" + String(i).padStart(2, "0"); o += `<button class="o-ma" data-ma="${ma}" aria-pressed="${ma === chon}" aria-label="Mã ${ma}"><span>${conVatCua(ma)}</span>${ma}</button>`; }
  $("#luoiMa").innerHTML = o;
  const nut = $("#dauXong"); nut.disabled = !chon; nut.textContent = chon ? "✅ Con là " + chon + " " + conVatCua(chon) : "✅ Chọn mã của con";
}
function tenNgan(b){ return (b.am || []).length ? b.am.join(", ") : b.ten.replace(/^Ôn tập.*/, "Ôn tập").replace(/^Luyện tập chính tả.*/, "Chính tả"); }
function veBaiDau(){
  const b = layBai(S.baiToi);
  if ($("#dauBaiNay")) $("#dauBaiNay").textContent = "Bài " + b.bai + " · " + b.ten;
  const sel = $("#nlBai");
  if (sel){ if (!sel.options.length) sel.innerHTML = DS_BAI.map(x => `<option value="${x.bai}">Bài ${x.bai} · ${esc(x.ten)}</option>`).join(""); sel.value = String(S.baiToi); }
}
function moChonBai(){
  const tran = S.baiTran || S.baiToi;
  $("#luoiBai").innerHTML = DS_BAI.filter(b => b.bai <= tran).reverse().map(b => `<button class="o-bai ${b.bai === S.baiToi ? "nay" : ""}" data-bai="${b.bai}"><b>Bài ${b.bai}</b>${esc(tenNgan(b))}</button>`).join("");
  moHop("#hopChonBai");
}
function vaoHoc(dich, baiChon){
  const ma = $("#chonMa").value || "HS01";
  S.ma = ma; S.hs = CHUP ? (S.hs || hsMoi()) : layHS(ma); S.hs.conVat = S.conVatChon || S.hs.conVat;
  if (!CHUP){ KHO.caiDat.hsCuoi = ma; luu(); }
  S.bai = baiChon || S.baiToi; S.tau = S.cham = S.doc = null; S.phienGiay = 0; S.daNhac10 = S.daNhac15 = false;
  if (!CHUP){ KHO.caiDat.viTriHS = {...KHO.caiDat.viTriHS, [ma]: S.bai}; luu(); }
  diToi(dich || "nghe");
  if (!dich || dich === "nghe") docLienTiep([LOI.cau.chao, LOI.cau.nghe_bai]);
}

/* =====================================================================
   CHẶNG 1 — NGHE
   ===================================================================== */
function oAm(a){ const laDau = AM_DAU_DS.includes(a); return `<button class="o-am ${laDau ? "am-dau" : "van"}" data-noi="${esc(phat(a))}" aria-label="Âm ${esc(a)}">${esc(a)}</button>`; }
function oDauThanh(d){ return `<button class="o-am dau" data-noi="${esc(LOI.dau_ten[d])}">${veDauThanh(d)}<span>${esc(LOI.dau_ten[d])}</span></button>`; }
function moHinh(m, i){
  const am = nfc(m.am || ""), van = nfc(m.van || ""), goc = am === "gi" && van.startsWith("i") ? "g" + van : am + van;
  let s = `<div class="mo-hinh" data-mh="${i}">`;
  if (am) s += `<span class="o o-am-dau" data-phan="0">${esc(am)}</span><span class="dau-phep">+</span>`;
  s += `<span class="o o-van" data-phan="${am ? 1 : 0}">${esc(van)}</span>`;
  if (am) s += `<span class="dau-phep">→</span><span class="o o-tieng ${m.dau ? "" : "cuoi"}" data-phan="2">${esc(goc)}</span>`;
  if (m.dau) s += `<span class="dau-phep">+</span><span class="o o-dau" data-phan="${am ? 3 : 1}">${veDauThanh(m.dau)}</span><span class="dau-phep">→</span><span class="o o-tieng cuoi" data-phan="${am ? 4 : 2}">${esc(nfc(m.tieng))}</span>`;
  return s + `<button class="nut-loa" data-danh-van="${i}" aria-label="Nghe đánh vần">🔊</button></div>`;
}
function sangDanhVan(el, m){ if (!el) return; karaoke(docLienTiep([danhVan(m)]), $$(".o", el)); }
function veNgheMan(){
  const b = layBai(S.bai), m = mucCuaBai(b);
  $("#ngheNghe").innerHTML = veNghe("vui");
  $("#ngheTen").textContent = "Bài " + b.bai + " · " + b.ten;
  let trai = "", phai = "";
  if ((b.am || []).length || (b.dau || []).length) trai += `<div class="khoi"><h3>✨ Âm, vần mới</h3><div class="hang-am">${(b.am || []).map(oAm).join("")}${(b.dau || []).map(oDauThanh).join("")}</div></div>`;
  if ((b.mau || []).length) trai += `<div class="khoi"><h3>🧩 Ghép tiếng — bấm 🔊 nghe đánh vần</h3>${b.mau.map(moHinh).join("")}</div>`;
  if ((b.luat || []).length) trai += `<div class="khoi"><h3>📏 Luật chính tả</h3>${b.luat.map(l => `<div class="luat">${esc(l)}</div>`).join("")}</div>`;
  if ((b.cap || []).length) trai += `<div class="khoi"><h3>👯 Cặp tiếng</h3><div class="cap-ct">${b.cap.map(c => `<button data-noi="${esc(c[0])}">${esc(c[0])}</button><button data-noi="${esc(c[1])}">${esc(c[1])}</button>`).join("")}</div></div>`;
  if (m.t.length) trai += `<div class="khoi"><h3>🔤 Tiếng</h3><div class="luoi-tieng">${m.t.map(t => `<button class="chip" data-noi="${esc(t)}">${esc(t)}</button>`).join("")}</div></div>`;
  if (m.w.length) phai += `<div class="khoi"><h3>🖼️ Từ có tranh</h3><div class="luoi-tu">${m.w.map(w => `<button class="the-tu" data-noi="${esc(w)}">${hinhTu(w)}<b>${esc(w)}</b></button>`).join("")}</div></div>`;
  if ((b.cau || []).length) phai += `<div class="khoi"><h3>📖 Câu</h3>${b.cau.map(c => `<button class="the-cau" data-noi="${esc(c)}"><span>🔊</span><span>${esc(c)}</span></button>`).join("")}</div>`;
  if (!phai) phai = `<div class="khoi"><h3>📖 Đọc</h3><p class="goi-y">Bài này luyện âm. Con chạm vào chữ bên trái để nghe nghé đọc nhé!</p><div style="width:160px;margin:auto">${veNghe("khen")}</div></div>`;
  $("#ngheTrai").innerHTML = trai || `<p class="goi-y">Bài ôn — con đọc các tiếng, từ, câu bên cạnh nhé.</p>`;
  $("#nghePhai").innerHTML = phai;
  $$("#ngheTrai [data-danh-van]").forEach(n => n.addEventListener("click", () => sangDanhVan(n.parentElement, b.mau[+n.dataset.danhVan])));
}

/* =====================================================================
   CHẶNG 2 — CHƠI: Đoàn tàu ghép vần
   ===================================================================== */
function veChoi(){
  $("#ngheChoi").innerHTML = veNghe(S.tro === "tau" ? "vui" : "nghe");
  $("#troTau").hidden = S.tro !== "tau"; $("#troCham").hidden = S.tro !== "cham";
  if (S.tro === "tau"){ $("#choiLoi").textContent = "Nghe nghé đọc rồi ghép toa tàu nhé!"; if (!S.tau || S.tau.bai !== S.bai) batDauTau(); else veTau(); }
  else { $("#choiLoi").textContent = "Nghe nghé đọc rồi chạm đúng chữ nhé!"; if (!S.cham || S.cham.bai !== S.bai) batDauCham(); else veCham(); }
}
function batDauTau(){
  const n = S.bai, b = layBai(n), moi = mucCuaBai(b).t.filter(t => ghepDuoc(t, n));
  let ds = chonTheoUuTien(moi, "t", 3);
  const on = []; baiDen(n - 1).forEach(x => mucCuaBai(x).t.forEach(t => { if (ghepDuoc(t, n)) on.push(t); }));
  ds = uniq(ds.concat(chonTheoUuTien(uniq(on), "t", 5 - ds.length)));
  if (CHUP){ const c = moi.find(t => tach(t).dau) || moi[0]; if (c) ds = uniq([c].concat(ds)); }
  S.tau = {bai: n, ds: ds.slice(0, 5), i: 0, kq: [], dat: {}, xong: false, laiLan: {}};
  veTau(); if (!CHUP) setTimeout(() => S.tau && S.tau.ds.length && docLienTiep([LOI.cau.ghep_tau, S.tau.ds[S.tau.i]]), 350);
}
function tauHienTai(){ return S.tau && S.tau.ds[S.tau.i]; }
function veTau(){
  const T = S.tau, t = tauHienTai();
  $("#dauMay").innerHTML = veDauMay();
  $("#tauTien").innerHTML = T.ds.map((x, k) => `<i class="${T.kq[k] || (k === T.i ? "dang" : "")}"></i>`).join("");
  const dt = $("#doanTau"); dt.classList.remove("chay");
  $("#tauTiep").classList.toggle("tiep-an", !!t && !T.xong); $("#tauTiep").classList.remove("goi-bam");
  $("#bienTau").hidden = true; $("#tauLoiGiai").textContent = ""; $("#tauLoiGiai").className = "loi-giai";
  if (!t){ $("#tauDe").textContent = "Bài này chưa có tiếng để ghép toa — con sang trò chạm chữ nhé!"; ["#khayAm", "#khayVan", "#khayDau"].forEach(s => $(s).innerHTML = ""); ["am", "van", "dau"].forEach(k => $("#toa" + hoa(k)).innerHTML = ""); return; }
  $("#tauDe").textContent = "Nghé đọc một tiếng. Con kéo (hoặc chạm) toa âm đầu, vần, dấu để ghép nhé!";
  if (!T.khay || T.khayCua !== t){ T.khay = khayTau(t, T.bai); T.khayCua = t; T.dat = {}; }
  if (CHUP && T.i === 0 && !T.datChup){ const p = tach(t); T.dat = {am: p.am, van: p.van}; T.datChup = true; }
  const the = (loai, gt) => `<button class="the-ghep" data-loai="${loai}" data-gt="${esc(gt)}" aria-label="${loai === "dau" ? esc(LOI.dau_ten[gt]) : esc(gt)}">${loai === "dau" ? veDauThanh(gt) : esc(gt)}</button>`;
  $("#khayAm").innerHTML = T.khay.am.map(x => the("am", x)).join("");
  $("#khayVan").innerHTML = T.khay.van.map(x => the("van", x)).join("");
  $("#khayDau").innerHTML = T.khay.dau.map(x => the("dau", x)).join("");
  veToa();
  if (CHUP && T.datChup){ const p = tach(t); $$("#khayDau .the-ghep").forEach(b => { if (b.dataset.gt === p.dau) b.classList.add("goi-y"); }); $(".toa[data-loai=dau]").classList.add("cho-tha"); }
}
function hoa(k){ return k[0].toUpperCase() + k.slice(1); }
function veToa(){
  const T = S.tau;
  ["am", "van", "dau"].forEach(k => { const v = T.dat[k]; $("#toa" + hoa(k)).innerHTML = v === undefined ? "" : (k === "dau" ? veDauThanh(v) : esc(v)); });
  $$(".the-ghep").forEach(b => b.classList.toggle("da-dat", T.dat[b.dataset.loai] === b.dataset.gt));
}
function datToa(loai, gt){
  const T = S.tau; if (!T || T.xong || !tauHienTai()) return;
  T.dat[loai] = gt; veToa(); nhay($(".toa[data-loai=" + loai + "]"));
  noi(loai === "dau" ? LOI.dau_ten[gt] : loai === "am" ? phat(gt) : docVan(gt));
  clearTimeout(T.hen); if (["am", "van", "dau"].every(k => T.dat[k] !== undefined)) T.hen = setTimeout(kiemTau, 650);   // chỉ chấm một lượt
}
function kiemTau(){
  const T = S.tau, t = tauHienTai(); if (!t || T.xong || ["am", "van", "dau"].some(k => T.dat[k] === undefined)) return;
  const p = tach(t), sai = ["am", "van", "dau"].filter(k => T.dat[k] !== p[k]);
  const lg = $("#tauLoiGiai");
  if (!sai.length){
    T.xong = true; if (!T.kq[T.i]) T.kq[T.i] = "dung";
    capNhatMuc("t:" + t, true); capNhatAm(t, true);
    $("#bienTau").textContent = t; $("#bienTau").hidden = false;
    lg.className = "loi-giai dung"; lg.textContent = "🎉 Đúng rồi! " + danhVanTau(p, t);
    $("#ngheChoi").innerHTML = veNghe("khen"); ting(); tuTu(); phaoGiay();
    docLienTiep([LOI.cau.dung_roi, t]);
    setTimeout(() => $("#doanTau").classList.add("chay"), 900);
    $("#tauTiep").classList.remove("tiep-an"); $("#tauTiep").classList.add("goi-bam");
  } else {
    T.kq[T.i] = "sai"; T.lanSai = (T.lanSai || 0) + 1; capNhatMuc("t:" + t, false); capNhatAm(t, false);
    const k = sai[0], nhan = sai.length === 1 ? nhanLoi(k, k === "dau" ? p[k] : (p[k] || "∅"), k === "dau" ? T.dat[k] : (T.dat[k] || "∅")) : null;
    ghiLoi(t, ghep(T.dat.am, T.dat.van, T.dat.dau), nhan);
    const ten = {am: "Toa âm đầu", van: "Toa vần", dau: "Toa dấu"};
    lg.className = "loi-giai sai"; lg.textContent = "🤔 " + sai.map(x => ten[x]).join(", ") + " chưa đúng. Con nghe lại nhé!";
    if (T.lanSai >= 2){ setTimeout(() => $$(".the-ghep").forEach(b => b.classList.toggle("goi-y", p[b.dataset.loai] === b.dataset.gt)), 500); lg.textContent += " 💡 Nghé gợi ý: chọn các thẻ sáng vàng nhé."; }
    sai.forEach(x => { rung($(".toa[data-loai=" + x + "]")); delete T.dat[x]; });
    setTimeout(veToa, 480);
    $("#ngheChoi").innerHTML = veNghe("dong-vien"); bup();
    docLienTiep([LOI.cau.thu_lai, t]);
  }
  $("#tauTien").innerHTML = T.ds.map((x, k) => `<i class="${T.kq[k] || (k === T.i ? "dang" : "")}"></i>`).join("");
}
function danhVanTau(p, t){ return (p.am ? p.am + " + " : "") + p.van + (p.dau ? " + " + LOI.dau_ten[p.dau] : "") + " → " + t; }
function tauTiep(){
  const T = S.tau; if (!T) return;
  if (T.i >= T.ds.length - 1){ T.i = T.ds.length; noi(LOI.cau.xong_chang); diToi("cham"); return; }
  T.i++; T.xong = false; T.lanSai = 0; $("#ngheChoi").innerHTML = veNghe("vui");
  const dt = $("#doanTau"); dt.classList.add("ve"); dt.classList.remove("chay");
  veTau(); void dt.offsetWidth; dt.classList.remove("ve");
  noi(tauHienTai());
}
/* kéo thả toa (chuột / tay) — chạm một cái cũng đặt được */
(function(){
  let keo = null;
  document.addEventListener("pointerdown", e => {
    const b = e.target.closest(".the-ghep"); if (!b) return;
    keo = {b, x: e.clientX, y: e.clientY, bong: null, di: false};
  });
  document.addEventListener("pointermove", e => {
    if (!keo) return;
    if (!keo.di && Math.hypot(e.clientX - keo.x, e.clientY - keo.y) > 10){ keo.di = true; keo.bong = keo.b.cloneNode(true); keo.bong.classList.add("bong-keo"); document.body.appendChild(keo.bong); $(".toa[data-loai=" + keo.b.dataset.loai + "]").classList.add("cho-tha"); }
    if (keo.di){ keo.bong.style.left = e.clientX + "px"; keo.bong.style.top = e.clientY + "px"; }
  });
  document.addEventListener("pointerup", e => {
    if (!keo) return; const k = keo; keo = null;
    $$(".toa.cho-tha").forEach(t => t.classList.remove("cho-tha"));
    if (k.bong) k.bong.remove();
    if (!k.di) return;   // chạm thường → sự kiện click lo
    const duoi = document.elementFromPoint(e.clientX, e.clientY), toa = duoi && duoi.closest(".toa");
    if (toa && toa.dataset.loai === k.b.dataset.loai){ k.b.dataset.keoXong = "1"; datToa(k.b.dataset.loai, k.b.dataset.gt); }
  });
  document.addEventListener("pointercancel", () => { if (keo && keo.bong) keo.bong.remove(); keo = null; });
})();

/* =====================================================================
   CHẶNG 2 — CHƠI: Nghe nghé đọc, chạm đúng chữ (phương án nhiễu = cặp hay nhầm)
   ===================================================================== */
function batDauCham(){
  const n = S.bai, moi = mucCuaBai(layBai(n)).t;
  let ds = chonTheoUuTien(moi, "t", 4);
  ds = uniq(ds.concat(mucOn(n, "t", 6 - ds.length)));
  if (ds.length < 6) ds = uniq(ds.concat(tron(moi))).slice(0, 6);
  S.cham = {bai: n, ds: ds.slice(0, 6), i: 0, kq: [], lc: null, xong: false, chen: {}};
  veCham(); if (!CHUP) setTimeout(() => chamHienTai() && docLienTiep([LOI.cau.cham_chu, chamHienTai()]), 350);
}
function chamHienTai(){ return S.cham && S.cham.ds[S.cham.i]; }
function veCham(){
  const C = S.cham, t = chamHienTai();
  $("#chamTien").innerHTML = C.ds.map((x, k) => `<i class="${C.kq[k] || (k === C.i ? "dang" : "")}"></i>`).join("");
  $("#chamLoiGiai").textContent = ""; $("#chamLoiGiai").className = "loi-giai";
  $("#chamTiep").classList.toggle("tiep-an", !!t && !C.xong); $("#chamTiep").classList.remove("goi-bam");
  if (!t){ $("#chamLuaChon").innerHTML = ""; $("#chamDe").textContent = "Bài này chưa có tiếng để chơi — con sang Đọc to nhé!"; return; }
  if (!C.lc || C.lcCua !== t){ C.lc = tron([{chu: t, nhan: null}].concat(phuongAnNhieu(t, C.bai, 3, true))); C.lcCua = t; }
  const mau = ["#cc2f6b", "#2477cc", "#b06d00", "#6d4fe0"];
  $("#chamLuaChon").innerHTML = C.lc.map((o, k) => `<button class="qua-bong" style="--m:${mau[k % 4]}" data-chon="${k}">${esc(o.chu)}</button>`).join("");
  $("#chamDe").textContent = C.lc.length < 2 ? "Con nghe nghé đọc rồi chạm vào quả bóng nhé!" : "Con nghe nghé đọc rồi chạm vào quả bóng có đúng chữ nhé!";
}
function chonCham(k){
  const C = S.cham, t = chamHienTai(); if (!t || C.xong) return;
  const o = C.lc[k], nut = $$("#chamLuaChon .qua-bong")[k], lg = $("#chamLoiGiai");
  if (o.chu === t){
    C.xong = true; if (!C.kq[C.i]) C.kq[C.i] = "dung"; nut.classList.add("dung");
    capNhatMuc("t:" + t, true); capNhatAm(t, true);
    lg.className = "loi-giai dung"; lg.textContent = "🎉 Đúng rồi! «" + t + "»";
    $("#ngheChoi").innerHTML = veNghe("khen"); ting(); phaoGiay(); docLienTiep([LOI.cau.dung_roi, t]);
    $("#chamTiep").classList.remove("tiep-an"); $("#chamTiep").classList.add("goi-bam");
  } else {
    C.kq[C.i] = "sai"; nut.classList.add("sai"); C.lanSai = (C.lanSai || 0) + 1;
    if (C.lanSai >= 2) setTimeout(() => $$("#chamLuaChon .qua-bong").forEach((b, j) => { if (C.lc[j].chu === t) b.style.boxShadow = "0 0 0 8px #ffd23f, 0 12px 20px rgba(0,0,0,.12)"; }), 500);
    capNhatMuc("t:" + t, false); capNhatAm(t, false);
    const nhan = o.nhan || phanLoai(t, o.chu); ghiLoi(t, o.chu, nhan);
    if (!C.chen[t] && C.ds.length < 9){ C.chen[t] = 1; C.ds.splice(Math.min(C.ds.length, C.i + 3), 0, t); }   // mục sai quay lại sau 2 lượt
    lg.className = "loi-giai sai";
    lg.textContent = "🤔 Chưa đúng. " + (nhan ? "Hai chữ khác nhau ở " + (nhan.startsWith("dau") ? "dấu thanh" : nhan.startsWith("am") ? "âm đầu" : "vần") + " (" + hienLoi(nhan) + "). " : "") + "Con nghe lại nhé!";
    $("#ngheChoi").innerHTML = veNghe("dong-vien"); bup(); docLienTiep([LOI.cau.thu_lai, t]);
  }
  $("#chamTien").innerHTML = C.ds.map((x, j) => `<i class="${C.kq[j] || (j === C.i ? "dang" : "")}"></i>`).join("");
}
function chamTiep(){
  const C = S.cham; if (!C) return;
  if (C.i >= C.ds.length - 1){ noi(LOI.cau.xong_chang); diToi("doc"); return; }
  C.i++; C.xong = false; C.lanSai = 0; $("#ngheChoi").innerHTML = veNghe("nghe"); veCham(); noi(chamHienTai());
}

/* =====================================================================
   CHẶNG 3 — ĐỌC THEO NGHÉ: nghé đọc mẫu chuẩn (chữ sáng theo tiếng đọc) → con đọc to theo → «Con đọc xong»
   KHÔNG chấm giọng con (cô chốt 19/10/2026: nhiều con đọc giọng quê, chấm theo chuẩn dễ làm con nản). Không thu âm.
   AI cá nhân hoá vẫn chọn mục: ưu tiên từ, câu có tiếng con hay nhầm khi chơi, và mục con ít đọc.
   ===================================================================== */
function diemDoc(chu){
  const hs = S.hs; let d = rand() * 1.5; if (!hs) return d;
  chuanNoi(chu).forEach(t => { const r = hs.muc["t:" + t]; if (r) d += r.s * 1.2 + (r.h <= soNgay() ? .5 : 0); });
  return d - Math.min(3, ((hs.daDoc || {})[chu] || 0) * .5);
}
function chonDoc(ds, so){ return ds.map(c => [c, diemDoc(c)]).sort((a, b) => b[1] - a[1]).slice(0, so).map(x => x[0]); }
function onDoc(n, loai, so){ const ds = []; baiDen(n - 1).forEach(b => mucCuaBai(b)[loai].forEach(c => ds.push(c))); return chonDoc(uniq(ds), so); }
function batDauDoc(){
  const n = S.bai, b = layBai(n), m = mucCuaBai(b);
  let ds = (b.am || []).map(a => ({l: "a", chu: nfc(a), noi: phat(nfc(a))}))
    .concat((b.mau || []).map(x => ({l: "m", m: x, chu: nfc(x.tieng), noi: danhVan(x)})))
    .concat(chonDoc(m.t, 2).map(c => ({l: "t", chu: c, noi: c})))
    .concat(chonDoc(m.w, 2).map(c => ({l: "w", chu: c, noi: c})))
    .concat(chonDoc(m.c, 1).map(c => ({l: "c", chu: c, noi: c})))
    .concat(onDoc(n, "t", 1).map(c => ({l: "t", chu: c, noi: c, on: true})))
    .concat(onDoc(n, "w", 1).map(c => ({l: "w", chu: c, noi: c, on: true})))
    .concat(onDoc(n, "c", 1).map(c => ({l: "c", chu: c, noi: c, on: true})));
  if (CHUP){ const x = HASH.cau ? m.c[0] : m.w[0], l = HASH.cau ? "c" : "w"; if (x) ds = [{l, chu: x, noi: x}].concat(ds.filter(y => y.chu !== x)); }
  S.doc = {bai: n, ds, i: 0, kq: [], daNhac: false};
}
function docHienTai(){ return S.doc && S.doc.ds[S.doc.i]; }
const TEN_LOAI = {a: "Âm, vần", m: "Đánh vần", t: "Tiếng", w: "Từ", c: "Câu"};
function chuDocHtml(m){
  if (m.l === "m") return moHinh(m.m, 0).replace(/<button[^>]*data-danh-van[^>]*>.*?<\/button>/, "");
  if (m.l === "a") return `<span class="tu-doc" style="color:${AM_DAU_DS.includes(m.chu) ? "var(--am)" : "var(--van)"}">${esc(m.chu)}</span>`;
  return m.chu.split(/\s+/).map(w => `<span class="tu-doc">${esc(w)}</span>`).join(" ");
}
function veTienDoc(){ const D = S.doc; $("#docTien").innerHTML = D.ds.map((x, k) => `<i class="${D.kq[k] || (k === D.i ? "dang" : "")}"></i>`).join(""); }
function datBuoc(k){
  $("#docXong").classList.toggle("goi-bam", k >= 2);
  $("#docLoi").textContent = k === 1 ? "Con nghe nghé đọc nhé!" : "Giờ con đọc to theo nghé, rồi bấm «Con đọc xong» nhé!";
  $("#ngheDoc").innerHTML = veNghe(k === 1 ? "vui" : "nghe");
}
function veDocMan(){
  if (!S.doc || S.doc.bai !== S.bai) batDauDoc();
  const D = S.doc, m = docHienTai(), b = layBai(S.bai);
  $("#docTen").textContent = "Bài " + b.bai + " · " + b.ten;
  veTienDoc();
  ["#docMau", "#docXong"].forEach(x => $(x).hidden = !m); $("#docTiep").classList.toggle("tiep-an", !!m);
  if (!m){
    $("#ngheDoc").innerHTML = veNghe("khen"); $("#docLoi").textContent = "Con đọc theo nghé xong cả bài rồi. Giỏi quá!";
    $("#docLoai").textContent = "Xong"; $("#docHinh").innerHTML = `<div style="width:170px">${veNghe("khen")}</div>`;
    $("#docChu").className = "chu-doc cau"; $("#docChu").textContent = "Con đọc xong rồi! Sang vườn xem cây nhé 🌱";
    return;
  }
  $("#docLoai").textContent = TEN_LOAI[m.l] + (m.on ? " · ôn lại" : "");
  $("#docHinh").innerHTML = m.l === "w" ? hinhTu(m.chu) : "";
  $("#docChu").className = "chu-doc " + ({w: "tu", c: "cau", m: "mh"}[m.l] || "");
  $("#docChu").innerHTML = chuDocHtml(m);
  datBuoc(1);
  if (CHUP){ if (HASH.cau){ const t = $$("#docChu .tu-doc"); t.slice(0, 3).forEach(x => x.classList.add("da-doc")); if (t[3]) t[3].classList.add("dang-doc"); } else datBuoc(2); return; }
  setTimeout(() => { if (docHienTai() === m && S.man === "doc") ngheMau(); }, 450);
}
function ngheMau(toc){
  const D = S.doc, m = docHienTai(); if (!m) return;
  datBuoc(1);
  const ma = docLienTiep([m.noi], toc);
  karaoke(ma, m.l === "m" ? $$("#docChu .o") : $$("#docChu .tu-doc"), () => {
    if (docHienTai() !== m) return; datBuoc(2);
    if (!D.daNhac){ D.daNhac = true; noi(LOI.cau.doc_theo); }
  });
}
function docXong(){
  const D = S.doc, m = docHienTai(); if (!m) return;
  D.kq[D.i] = "dung";
  if (S.hs && !CHUP){ ghiHoatDong(m.chu, null); S.hs.docTheo = (S.hs.docTheo || 0) + 1; S.hs.daDoc[m.chu] = (S.hs.daDoc[m.chu] || 0) + 1; luu(); }
  veTienDoc();
  phanHoi({chu: m.chu, sao: S.hs ? S.hs.docTheo || 1 : 1, sau: docTiep, lai: () => ngheMau()});
}
function docTiep(){ dongPhanHoi(); const D = S.doc; if (!D) return; if (!docHienTai()){ diToi("vuon"); return; } D.i++; veDocMan(); }

/* ---------- lời khen (dùng chung Đọc theo và ti vi) — chỉ khen, không chê ---------- */
function phanHoi(o){
  const ph = $("#phanHoi"); ph.className = "phu dung";
  $("#phNghe").innerHTML = veNghe("khen");
  const loi = o.tivi ? LOI.cau.ca_lop_gioi : LOI.cau.khen;
  $("#phChu").textContent = loi;
  $("#phPhu").innerHTML = `<p><span class="mau-doc dung">${esc(o.chu)}</span></p><p>⭐ ${o.tivi ? "Cả lớp có <b>" + o.sao + "</b> ngôi sao rồi!" : "Con có <b>" + o.sao + "</b> ngôi sao đọc theo rồi!"}</p>`;
  $("#phNut").innerHTML = `<button class="nut nut-xanh nut-lon" id="phTiep" data-chinh>Tiếp ▶</button>`;
  $("#phTiep").onclick = () => { dongPhanHoi(); if (o.sau) o.sau(); };
  moHop("#phanHoi");
  ting(); phaoGiay(); noi(loi);
}
function dongPhanHoi(){ dongHop("#phanHoi"); }
const HOP = ["#phanHoi", "#hopGuiCo", "#hopNghi", "#hopChep", "#hopNguoiLon", "#hopChonBai", "#hopCai"];
let __truocHop = null;
function moHop(sel){
  const h = $(sel); if (h.hidden && !HOP.some(x => !$(x).hidden)) __truocHop = document.activeElement;
  h.hidden = false;
  setTimeout(() => { if (h.hidden) return; const n = h.querySelector("[data-chinh]:not([hidden])") || $$("button,textarea,input", h).find(x => x.offsetParent !== null);
    try { if (n) n.focus({preventScroll: true}); } catch (e){} }, 40);
}
function dongHop(sel){
  const h = $(sel); if (h.hidden) return; h.hidden = true;
  if (!HOP.some(x => !$(x).hidden) && __truocHop && document.contains(__truocHop)){ try { __truocHop.focus({preventScroll: true}); } catch (e){} }
}
document.addEventListener("keydown", e => {
  const mo = HOP.map(x => $(x)).find(h => !h.hidden);
  if (mo){
    if (e.key === "Escape"){ e.preventDefault(); if (mo.id === "hopNghi") $("#nghiXong").click(); else dongHop("#" + mo.id); return; }
    if (e.key === "Tab"){
      const ds = $$("button,textarea,input,select,a[href]", mo).filter(x => !x.disabled && x.offsetParent !== null); if (!ds.length) return;
      const i = ds.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0){ e.preventDefault(); ds[ds.length - 1].focus(); }
      else if (!e.shiftKey && (i === ds.length - 1 || i < 0)){ e.preventDefault(); ds[0].focus(); }
    }
    return;
  }
  // phím tắt chế độ ti vi: ← → chuyển chữ · N nghe mẫu · K khen cả lớp
  if (S.man === "tivi" && !e.altKey && !e.ctrlKey && !e.metaKey){
    const k = e.key.toLowerCase();
    if (k === "arrowright"){ e.preventDefault(); tvBuoc(1); }
    else if (k === "arrowleft"){ e.preventDefault(); tvBuoc(-1); }
    else if (k === "n"){ e.preventDefault(); tvMau(); }
    else if (k === "k"){ e.preventDefault(); tvXong(); }
  }
});


/* =====================================================================
   VƯỜN CỦA NGHÉ
   ===================================================================== */
function veVuon(){
  const hs = S.hs; const hoc = hocToi(S.baiToi); const ds = Array.from(hoc.am);
  let vung = 0, lon = 0;
  $("#luoiCay").innerHTML = ds.map((a, i) => {
    const v = hs.am[a] || 0, giai = v >= 5 ? 3 : v >= 3 ? 2 : v >= 1 ? 1 : 0; if (giai === 3) vung++; else if (giai) lon++;
    const [loai, ten] = LOAI_CAY[i % LOAI_CAY.length];
    return `<button class="o-vuon g${giai}" data-noi="${esc(phat(a))}" title="${esc(ten)} — ${["hạt", "nảy mầm", "cây non", "cây vững"][giai]}">${veCay(loai, giai)}<span class="nhan-am ${AM_DAU_DS.includes(a) ? "am-dau" : "van"}">${esc(a)}</span></button>`;
  }).join("");
  const ngay = Object.keys(hs.phut || {}).filter(k => hs.phut[k] > 0).length;
  $("#vuonSo").innerHTML = `<span class="o-so">🌳 <b>${vung}</b> cây vững</span><span class="o-so">📅 <b>${ngay}</b> ngày con đã học</span>`;
  $("#vuonTieuDe").textContent = S.doc && !docHienTai() ? "🎉 Hôm nay con học xong rồi!" : "🌱 Vườn của con";
  $("#ngheVuon").innerHTML = veNghe(vung ? "khen" : "vui");
}

/* =====================================================================
   GỬI CÔ — mã ngắn (nén JSON thống kê) · SAO LƯU / NHẬP
   ===================================================================== */
function b64u(u8){ let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function tuB64u(s){ s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
async function nen(chu){
  const u = new TextEncoder().encode(chu);
  try { if (window.CompressionStream){ const s = new Blob([u]).stream().pipeThrough(new CompressionStream("deflate-raw")); return "Z" + b64u(new Uint8Array(await new Response(s).arrayBuffer())); } } catch (e){}
  return "J" + b64u(u);
}
async function giaiNen(ma){
  const u = tuB64u(ma.slice(1));
  if (ma[0] === "Z"){ const s = new Blob([u]).stream().pipeThrough(new DecompressionStream("deflate-raw")); return new TextDecoder().decode(await new Response(s).arrayBuffer()); }
  return new TextDecoder().decode(u);
}
function thongKe(ma, hs){
  const ngay = Object.keys(hs.phut || {}).sort().slice(-14).map(k => [k.slice(5), Math.round(hs.phut[k] * 10) / 10]);
  let d = 0, s = 0; Object.values(hs.muc).forEach(r => { d += r.d; s += r.s; });
  const yeu = Object.entries(hs.muc).filter(([, r]) => r.s > 0).sort((a, b) => (b[1].s - b[1].d / 3) - (a[1].s - a[1].d / 3)).slice(0, 8).map(([k, r]) => [k, r.d, r.s]);
  return {v: 1, m: ma, t: S.baiToi, n: ngay, d, s, l: hs.loi, y: yeu, g: Object.values(hs.am).filter(v => v >= 5).length, r: hs.docTheo || 0, b: goiTienTrinh(hs)};
}
/* Tiến trình của bé gói gọn trong mã «Gửi cô» — tin Zalo gửi cô chính là bản lưu. Máy bị xoá dữ liệu thì dán lại mã để khôi phục.
   (Giải pháp tạm; sau ngày 25/10 chuyển dần sang cơ sở dữ liệu.) */
function goiTienTrinh(hs){
  const p = {}; Object.keys(hs.phut || {}).sort().slice(-60).forEach(k => { p[k] = hs.phut[k]; });
  return {cv: hs.conVat, m: Object.entries(hs.muc || {}).map(([k, r]) => [k, r.b, r.d, r.s, r.h]), a: hs.am || {}, l: hs.loi || {}, p, r: hs.docTheo || 0, dd: hs.daDoc || {}};
}
function moTienTrinh(o){
  const b = o.b; if (!b) return null;
  const muc = {}; (b.m || []).forEach(x => { muc[x[0]] = {b: x[1], d: x[2], s: x[3], h: x[4]}; });
  return {conVat: b.cv || conVatCua(o.m), muc, am: b.a || {}, loi: b.l || {}, loiCT: [], phut: b.p || {}, daDoc: b.dd || {}, docTheo: b.r || 0, lanGui: homNay()};
}
async function taoMaGuiCo(){
  const khach = S.ma === 'KHACH', ma = khach ? 'KHACH' : nhanMaHS(S.ma);
  const bai = KHO.caiDat.viTriHS?.[S.ma] || S.baiToi;
  const dau = khach ? 'NGHE1-LOCAL-KHACH-B' + String(bai).padStart(2, '0') + '-' : 'NGHE1-' + ma + '-';
  const duLieu = thongKe(ma, S.hs); if (khach) duLieu.t = bai;
  return dau + await nen(JSON.stringify(duLieu));
}
function moGuiCo(){
  $("#guiTieuDe").textContent = S.ma === 'KHACH' ? '📋 Mã tiến trình khách' : '📨 Gửi kết quả cho giáo viên';
  chonHSMacDinh(); $("#guiNghe").innerHTML = veNghe("khen"); $("#guiMa").value = "Đang tạo mã…"; moHop("#hopGuiCo");
  taoMaGuiCo().then(m => { $("#guiMa").value = m; if (S.hs && !CHUP){ S.hs.lanGui = homNay(); luu(); } }).catch(() => { $("#guiMa").value = "Máy chưa tạo được mã — bấm Sao lưu ra file rồi gửi file cho cô nhé."; });
}
function chepMa(){
  const o = $("#guiMa"); const xong = () => bao("📋 Đã chép mã — dán vào Zalo gửi cô nhé!");
  const cu = () => { try { o.select(); document.execCommand("copy"); xong(); } catch (e){ bao("Con nhờ người lớn giữ ngón tay vào ô mã để chép nhé."); } };
  try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(o.value).then(xong).catch(cu); else cu(); } catch (e){ cu(); }
}
function taiFile(ten, noiDung, kieu){
  try { const b = new Blob([noiDung], {type: kieu}); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = ten; document.body.appendChild(a); a.click();
    setTimeout(() => { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e){} }, 1500); } catch (e){ bao("Máy này chưa tải file được."); }
}
function moChep(tieuDe, loi, noiDung, nhap){
  $("#chepTieuDe").textContent = tieuDe; $("#chepLoi").textContent = loi;
  const o = $("#chepNoiDung"); o.value = noiDung || ""; o.readOnly = !nhap; o.placeholder = nhap ? "Dán mã NGHE1-… hoặc nội dung sao lưu vào đây" : "";
  $("#chepNutXuat").hidden = !!nhap; $("#chepNutNhap").hidden = !nhap; $("#chepHoanTac").hidden = true;
  $("#chepNut").toggleAttribute("data-chinh", !nhap); o.toggleAttribute("data-chinh", !!nhap); moHop("#hopChep");
}
function saoLuu(){
  const duLieu = S.ma === 'KHACH' ? {caiDat: {hsCuoi: 'KHACH', baiToi: KHO.caiDat.viTriHS?.KHACH || S.baiToi}, hs: {KHACH: layHS('KHACH')}} : KHO;
  const noiDung = JSON.stringify(duLieu);
  taiFile("nghe-oi-doc-nao-sao-luu-" + homNay() + ".json", noiDung, "application/json");
  moChep("💾 Sao lưu", "Máy đã thử tải file sao lưu. Nếu không thấy file (khi mở app qua đường link), người lớn bấm «Chép nội dung» rồi dán vào Zalo «Cloud của tôi» để giữ. Đổi máy thì bấm «Nhập lại» và dán vào.", noiDung, false);
}
const NHAP = {cho: null, truoc: null, bai: null};
let nhapKhach = false;
function nhapFile(){ NHAP.cho = null; NHAP.bai = null; moChep("📂 Khôi phục tiến trình", "Dán mã tiến trình đã xuất hoặc chọn tệp sao lưu. Hệ thống sẽ yêu cầu xác nhận trước khi thay thế tiến trình hiện có.", "", true); $("#chepNhap").textContent = "✅ Nhập nội dung đã dán"; }
function nhapNoiDung(chu){
  if (/NGHE1-(?:LOCAL-KHACH-B\d{2}|HS\d{2}|KHACH)-/.test(chu || "")){
    docMaLop(chu).then(r => {
      const hs = {}; r.ds.forEach(o => { const h = moTienTrinh(o); if (h) hs[o.m] = h; });
      if (nhapKhach && r.ds.length === 1 && Number.isInteger(r.ds[0].t) && r.ds[0].t >= 1 && r.ds[0].t <= 50) NHAP.bai = r.ds[0].t;
      if (!Object.keys(hs).length){ $("#chepLoi").textContent = "⚠️ Mã này là mã cũ, chưa mang tiến trình của con. Cô hoặc người lớn trong nhà dán mã gửi cô gần nhất (từ ngày 23/10/2026) nhé."; return; }
      nhapNoiDung(JSON.stringify({hs}));
    }).catch(() => { $("#chepLoi").textContent = "⚠️ Máy chưa đọc được mã này. Kiểm tra đã chép đủ mã chưa rồi dán lại."; });
    return;
  }
  let k; try { k = JSON.parse(chu); if (!k || !k.hs) throw new Error("x"); } catch (x){ $("#chepLoi").textContent = "⚠️ Nội dung này không phải bản sao lưu của «Nghé ơi, đọc nào!». Cô hoặc người lớn trong nhà kiểm tra đã chép đủ chưa (bắt đầu bằng {\"caiDat\"…) rồi dán lại."; return; }
  if (nhapKhach){
    const ds = Object.values(k.hs);
    if (ds.length !== 1){ $("#chepLoi").textContent = "Mỗi khách chỉ có một tiến trình. Hãy dùng mã tiến trình của một bạn."; return; }
    if (!progressSchema.safeParse(ds[0]).success){ $("#chepLoi").textContent = "Mã tiến trình không hợp lệ hoặc bị thiếu dữ liệu. Kiểm tra lại bản sao lưu."; return; }
    k.hs = {KHACH: ds[0]}; delete k.caiDat;
  }
  const ma = Object.keys(k.hs), coDuLieu = h => h && (Object.keys(h.muc || {}).length || h.docTheo || Object.keys(h.phut || {}).length), trung = ma.filter(m => coDuLieu(KHO.hs[m]));
  if (trung.length && NHAP.cho !== chu){
    NHAP.cho = chu;
    $("#chepLoi").textContent = "Bản sao lưu có dữ liệu của " + ma.length + " mã HS. Dữ liệu đang có trên máy này của " + trung.join(", ") + " sẽ bị thay. Bấm «Đồng ý nhập» để tiếp tục, hoặc «Đóng» để thôi.";
    $("#chepNhap").textContent = "✅ Đồng ý nhập"; return;
  }
  NHAP.truoc = JSON.stringify(KHO); NHAP.cho = null;
  Object.assign(KHO.hs, k.hs); KHO.caiDat = Object.assign({}, k.caiDat || {}, KHO.caiDat);
  if (nhapKhach && NHAP.bai){ KHO.caiDat.viTriHS = {...KHO.caiDat.viTriHS, KHACH: NHAP.bai}; KHO.caiDat.baiTheoHS = {...KHO.caiDat.baiTheoHS, KHACH: NHAP.bai}; if (S.ma === 'KHACH') S.baiToi = NHAP.bai; }
  if (!KHO.caiDat.hsCuoi && ma.length === 1) KHO.caiDat.hsCuoi = ma[0];
  luu(); S.hs = S.ma ? layHS(S.ma) : null; if (S.man === "dau") veTrangDau();
  $("#chepLoi").textContent = "✅ Đã nhập dữ liệu của " + ma.length + " mã HS. Nếu nhập nhầm, bấm «Hoàn tác lần nhập vừa rồi».";
  $("#chepNhap").textContent = "✅ Nhập nội dung đã dán"; $("#chepHoanTac").hidden = false; $("#chepNoiDung").value = "";
  if (S.man === "vuon") veVuon();
}
function hoanTacNhap(){
  if (!NHAP.truoc) return;
  try { KHO = JSON.parse(NHAP.truoc); } catch (e){ return; }
  NHAP.truoc = null; luu(); S.hs = S.ma ? layHS(S.ma) : null; $("#chepHoanTac").hidden = true;
  $("#chepLoi").textContent = "↩️ Đã trả dữ liệu trên máy này về như trước khi nhập."; if (S.man === "vuon") veVuon();
}
$("#chonFile").addEventListener("change", e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => nhapNoiDung(r.result);
  r.readAsText(f);
});

/* =====================================================================
   GÓC CỦA CÔ — chọn bài, máy nghe, ti vi, bản đồ lỗi cả lớp
   ===================================================================== */
const MA_MO_CO = "1a";   // mã mở đơn giản (KHÔNG phải bảo mật) — chỉ để bé khỏi bấm nhầm
let LOP = [];
function veCo(){
  $("#ngheKhoa").innerHTML = veNghe("vui");
  $("#coKhoa").hidden = S.coMo; $("#coNoiDung").hidden = !S.coMo;
  if (!S.coMo) return;
  const sel = $("#coBai");
  sel.innerHTML = DS_BAI.map(b => `<option value="${b.bai}">Bài ${b.bai} · ${esc(b.ten)}</option>`).join("");
  sel.value = String(KHO.caiDat.baiToi || S.baiToi);
  $("#coItCD").checked = !!KHO.caiDat.itCD; veGiong();
  $("#coLink").textContent = "#toi-" + sel.value;
  if (LOP.length) veBanDo();
}
function moCo(){ if (($("#coMa").value || "").trim().toLowerCase() === MA_MO_CO){ S.coMo = true; $("#coBao").textContent = ""; veCo(); } else $("#coBao").textContent = "Mã chưa đúng ạ."; }
async function docMaLop(chu){
  const ra = {}, loi = [];
  const ds = (chu.match(/NGHE1-(?:LOCAL-KHACH-B\d{2}|HS\d{2}|KHACH)-[ZJ][A-Za-z0-9_-]+/g) || []);
  for (const m of ds){ try { const local = m.match(/^NGHE1-LOCAL-KHACH-B\d{2}-(.*)$/); const i = m.indexOf("-", 6); const o = JSON.parse(await giaiNen(local ? local[1] : m.slice(i + 1))); if (o && o.m){ o.__goc = m; ra[o.m] = o; } } catch (e){ loi.push(m.slice(0, 16)); } }
  return {ds: Object.values(ra).sort((a, b) => a.m.localeCompare(b.m)), loi};
}
function veBanDo(){
  const kq = $("#coKetQua");
  if (!LOP.length){ kq.innerHTML = `<p class="goi-y">Chưa có mã nào. Dán mã phụ huynh gửi rồi bấm «Xem bản đồ lỗi».</p>`; return; }
  const tong = {}, phut = LOP.map(o => (o.n || []).reduce((s, x) => s + x[1], 0));
  LOP.forEach(o => Object.entries(o.l || {}).forEach(([k, v]) => tong[k] = (tong[k] || 0) + v));
  const top = Object.entries(tong).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const ngayLuyen = LOP.reduce((s, o) => s + (o.n || []).filter(x => x[1] > 0).length, 0);
  const r = LOP.reduce((t, o) => t + (o.r || 0), 0);
  const tongPhut = phut.reduce((a, b) => a + b, 0);
  kq.innerHTML = `<div class="kpi"><div><b>${LOP.length}</b><span>em đã gửi mã</span></div><div><b>${Math.round(tongPhut)}</b><span>phút luyện (≤ 14 ngày)</span></div>
    <div><b>${ngayLuyen ? (tongPhut / ngayLuyen).toFixed(1) : 0}</b><span>phút / em / ngày luyện</span></div><div><b>${r}</b><span>lượt đọc theo nghé</span></div></div>
    <div class="bieu-do-khung"><div><b>Cặp hay nhầm của cả lớp (số lần)</b>
      <div class="chu-giai-loi"><span><i style="background:${MAU_LOI.am}"></i>Âm đầu</span><span><i style="background:${MAU_LOI.van}"></i>Vần</span><span><i style="background:${MAU_LOI.dau}"></i>Dấu thanh</span></div>
      <canvas class="bieu-do" id="coBieuDo" aria-label="Biểu đồ cột các cặp hay nhầm"></canvas></div>
    <div class="bang-cuon"><table><thead><tr><th>Mã HS</th><th>Học tới</th><th>Phút</th><th>Ngày</th><th>Đọc theo</th><th>Chơi đúng/sai</th><th>🌳</th><th>Hay nhầm</th><th>Cần ôn</th><th>Khôi phục</th></tr></thead><tbody>
    ${LOP.map((o, i) => { const l = Object.entries(o.l || {}).sort((a, b) => b[1] - a[1]).slice(0, 2);
      return `<tr><td><b>${esc(o.m)}</b></td><td>Bài ${esc(o.t)}</td><td>${Math.round(phut[i])}</td><td>${(o.n || []).filter(x => x[1] > 0).length}</td><td>${o.r || 0}</td><td>${o.d || 0}/${o.s || 0}</td><td>${o.g || 0}</td>
      <td>${l.map(([k, v]) => `<span class="nhan-loi" style="background:${MAU_LOI[k.split(":")[0]] || "#999"}">${esc(hienLoi(k))} ×${v}</span>`).join("") || "—"}</td>
      <td>${(o.y || []).slice(0, 3).map(y => esc(String(y[0]).slice(2))).join(", ") || "—"}</td>
      <td>${o.__goc && o.b ? `<button class="nut-nho" data-chep-ma="${i}" title="Chép mã để gửi lại phụ huynh khôi phục tiến trình">📋 Chép</button>` : "—"}</td></tr>`; }).join("")}
    </tbody></table></div></div>`;
  veBieuDo($("#coBieuDo"), top);
}
function veBieuDo(cv, du){
  let g; try { g = cv.getContext("2d"); } catch (e){ return; }
  const dpr = window.devicePixelRatio || 1, w = cv.clientWidth || 520, h = Math.max(150, du.length * 30 + 16);
  cv.style.height = h + "px"; cv.width = w * dpr; cv.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
  if (!du.length){ g.fillStyle = "#615a80"; g.font = "700 15px Segoe UI, Arial"; g.fillText("Chưa có lỗi nào được ghi lại.", 10, 30); return; }
  const max = Math.max(...du.map(x => x[1])), trai = 118, phai = 42;
  du.forEach(([k, n], i) => {
    const y = 8 + i * 30, bw = Math.max(4, (w - trai - phai) * n / max);
    g.fillStyle = MAU_LOI[k.split(":")[0]] || "#888";
    g.beginPath(); if (g.roundRect) g.roundRect(trai, y, bw, 22, 8); else g.rect(trai, y, bw, 22); g.fill();
    g.fillStyle = "#2b2350"; g.font = "800 15px Segoe UI, Arial"; g.textAlign = "right"; g.fillText(hienLoi(k), trai - 10, y + 16);
    g.textAlign = "left"; g.fillText(String(n), trai + bw + 6, y + 16);
  });
}
function xuatCsv(){
  if (!LOP.length){ bao("Chưa có dữ liệu — cô dán mã rồi bấm «Xem bản đồ lỗi» trước nhé."); return; }
  const dong = [["ma_hs", "hoc_toi_bai", "phut_14_ngay", "so_ngay_luyen", "luot_doc_theo", "choi_dung", "choi_sai", "cay_vung", "cap_hay_nham", "muc_can_on"]];
  LOP.forEach(o => dong.push([o.m, o.t, Math.round((o.n || []).reduce((s, x) => s + x[1], 0)), (o.n || []).filter(x => x[1] > 0).length, o.r || 0, o.d || 0, o.s || 0, o.g || 0,
    Object.entries(o.l || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => hienLoi(k) + " x" + v).join("; "), (o.y || []).map(y => String(y[0]).slice(2)).join("; ")]));
  const csv = dong.map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(",")).join("\r\n");
  taiFile("ban-do-loi-lop-1A-" + homNay() + ".csv", "\uFEFF" + csv, "text/csv;charset=utf-8");
  moChep("⬇️ Bảng CSV", "Máy đã thử tải file CSV. Nếu không thấy file (khi mở app qua đường link), cô bấm «Chép nội dung» rồi dán vào Excel hoặc Google Trang tính.", csv, false);
}
function mauLop(){   // DỮ LIỆU THỬ cho ảnh chụp (không phải học sinh thật)
  const r = mulberry32(19), cap = ["am:b/d", "dau:hỏi/ngã", "am:l/n", "am:s/x", "am:ch/tr", "van:o/ô", "van:u/ư", "dau:huyền/sắc", "am:d/r", "van:e/ê", "am:d/đ", "van:ua/ưa"];
  const nang = [9, 8, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1.5], muc = ["t:bố", "t:dế", "w:lá đỏ", "t:nở", "w:cá rô", "t:sẻ", "w:chợ cá", "c:Bà bế bé.", "t:trê", "w:đi đò"];
  const ds = [];
  for (let i = 1; i <= 14; i++){
    const l = {}; cap.forEach((k, j) => { const v = Math.floor(r() * nang[j] * .8); if (v) l[k] = v; });
    const n = []; for (let k = 6; k >= 0; k--) if (r() > .2) n.push(["10-" + String(19 - k).padStart(2, "0"), Math.round((5 + r() * 9) * 10) / 10]);
    ds.push({v: 1, m: "HS" + String(i).padStart(2, "0"), t: 21, n, d: 40 + Math.floor(r() * 80), s: 6 + Math.floor(r() * 26), l, y: tron(muc).slice(0, 3).map(x => [x, 2, 3]), g: 3 + Math.floor(r() * 12), r: 20 + Math.floor(r() * 60)});
  }
  return ds;
}

/* =====================================================================
   CHẾ ĐỘ TI VI — chữ rất to, cô chấm bằng nút (không ghi dữ liệu từng em)
   ===================================================================== */
function batDauTivi(){
  const b = layBai(S.bai), m = mucCuaBai(b), ds = [];
  (b.am || []).forEach(a => ds.push({l: "a", chu: a, noi: phat(a)}));
  (b.mau || []).forEach(x => ds.push({l: "m", m: x, chu: x.tieng, noi: danhVan(x)}));
  m.t.forEach(t => ds.push({l: "t", chu: t, noi: t}));
  m.w.forEach(w => ds.push({l: "w", chu: w, noi: w}));
  m.c.forEach(c => ds.push({l: "c", chu: c, noi: c}));
  S.tv = {bai: S.bai, ds, i: CHUP ? Math.max(0, ds.findIndex(x => x.l === "w")) : 0, sao: CHUP ? 7 : 0, kq: []};
  if (CHUP) S.tv.kq = ds.map((x, k) => k < S.tv.i ? "dung" : "");
}
function chuMau(chu){ const p = tach(chu); if (!p.am) return `<span class="van">${esc(chu)}</span>`; const n = Array.from(nfc(chu)); const a = Array.from(p.am === "gi" && p.van.startsWith("i") ? "g" : p.am).length; return `<span class="am-dau">${esc(n.slice(0, a).join(""))}</span><span class="van">${esc(n.slice(a).join(""))}</span>`; }
function veTivi(){
  if (!S.tv || S.tv.bai !== S.bai) batDauTivi();
  const T = S.tv, x = T.ds[T.i], b = layBai(S.bai);
  $("#ngheTv").innerHTML = veNghe("vui"); $("#tvTen").textContent = "📺 Bài " + b.bai + " · " + b.ten; $("#tvBai").textContent = "Bài " + S.bai;
  $("#tvSao").textContent = "⭐ " + T.sao;
  $("#tvTien").innerHTML = T.ds.map((y, k) => `<i class="${T.kq[k] || (k === T.i ? "dang" : "")}"></i>`).join("");
  if (!x){ $("#tvThe").innerHTML = `<p class="goi-y">Bài này chưa có ngữ liệu.</p>`; return; }
  let s = `<span class="loai-muc">${{a: "Âm, vần", m: "Ghép tiếng", t: "Tiếng", w: "Từ", c: "Câu"}[x.l]}</span>`;
  if (x.l === "a") s += `<div class="tv-chu" style="color:${AM_DAU_DS.includes(x.chu) ? "var(--am)" : "var(--van)"}"><span class="tu-doc">${esc(x.chu)}</span></div>`;
  else if (x.l === "m") s += moHinh(x.m, 0).replace(/<button[^>]*data-danh-van[^>]*>.*?<\/button>/, "");
  else if (x.l === "w") s += hinhTu(x.chu) + `<div class="tv-chu tu">${x.chu.split(" ").map(w => `<span class="tu-doc">${chuMau(w)}</span>`).join(" ")}</div>`;
  else if (x.l === "c") s += `<div class="tv-chu cau">${x.chu.split(/\s+/).map(w => `<span class="tu-doc">${esc(w)}</span>`).join(" ")}</div>`;
  else s += `<div class="tv-chu"><span class="tu-doc">${chuMau(x.chu)}</span></div>`;
  $("#tvThe").innerHTML = s;
  $("#tvLoi").textContent = LOI.cau.ca_lop;
}
function tvBuoc(k){ const T = S.tv; if (!T) return; T.i = Math.max(0, Math.min(T.ds.length - 1, T.i + k)); veTivi(); }
function tvMau(){ const x = S.tv && S.tv.ds[S.tv.i]; if (!x) return; karaoke(docLienTiep([x.noi]), x.l === "m" ? $$("#tvThe .o") : $$("#tvThe .tu-doc")); }
function tvXong(){
  const T = S.tv, x = T && T.ds[T.i]; if (!x) return;
  T.kq[T.i] = "dung"; T.sao++;
  phanHoi({chu: x.chu, tivi: true, sao: T.sao, sau: () => { if (T.i < T.ds.length - 1) tvBuoc(1); else veTivi(); }, lai: tvMau});
}

/* =====================================================================
   THỜI GIAN HỌC — ~10 phút mỗi buổi, 15 phút nghé nhắc nghỉ mắt
   ===================================================================== */
function moNghi(){ $("#nghiNghe").innerHTML = veNghe("ngu"); moHop("#hopNghi"); noi(LOI.cau.nghi_mat); }
["pointerdown", "keydown"].forEach(ev => document.addEventListener(ev, () => { S.lanCuoi = Date.now(); }, true));
setInterval(() => {
  if (CHUP || !S.hs || document.hidden || !MAN_HOC.includes(S.man) || Date.now() - S.lanCuoi > 90000) return;
  S.phienGiay += 10; const d = homNay(); S.hs.phut[d] = Math.round(((S.hs.phut[d] || 0) + 10 / 60) * 100) / 100; luu(); capNhatDongHo();
  if (S.phienGiay >= 600 && !S.daNhac10){ S.daNhac10 = true; bao("🎉 " + LOI.cau.du_muoi_phut, 5000); noi(LOI.cau.du_muoi_phut); }
  if (S.phienGiay >= 900 && !S.daNhac15){ S.daNhac15 = true; moNghi(); }
}, 10000);

/* =====================================================================
   GẮN NÚT
   ===================================================================== */
document.addEventListener("click", e => {
  const n = e.target.closest("[data-noi]"); if (n){ noi(n.dataset.noi); nhay(n); }
  const d = e.target.closest("[data-di]"); if (d){ if (d.dataset.di === 'co' && !CHUP && callbacks.onTeacherOpen){ HOP.forEach(x => dongHop(x)); callbacks.onTeacherOpen(); return; } diToi(d.dataset.di); return; }
  const om = e.target.closest("[data-ma]"); if (om){ $("#chonMa").value = om.dataset.ma; S.conVatChon = conVatCua(om.dataset.ma); veConVat(om.dataset.ma); noi(LOI.cau.chao); return; }
  const g = e.target.closest(".the-ghep"); if (g){ if (g.dataset.keoXong){ delete g.dataset.keoXong; return; } datToa(g.dataset.loai, g.dataset.gt); return; }
  const ot = e.target.closest(".o-toa"); if (ot && S.tau && !S.tau.xong && S.tau.dat[ot.dataset.loai] !== undefined){ delete S.tau.dat[ot.dataset.loai]; veToa(); return; }
  const qb = e.target.closest("[data-chon]"); if (qb){ chonCham(+qb.dataset.chon); return; }
});
$("#nlBai").onchange = () => { const n = +$("#nlBai").value; S.baiToi = n; if (!CHUP){ KHO.caiDat.baiToi = n; luu(); } veBaiDau(); bao("✅ Con học tới bài " + n + "."); };
$("#dauChonBai").onclick = moChonBai;
$("#cbDong").onclick = () => dongHop("#hopChonBai");
$("#luoiBai").addEventListener("click", e => { const o = e.target.closest("[data-bai]"); if (o){ dongHop("#hopChonBai"); vaoHoc("nghe", +o.dataset.bai); } });
$("#batDau").onclick = () => vaoHoc("nghe");
$("#dauVuon").onclick = () => vaoHoc("vuon");
$("#dauNhacGui").onclick = () => { S.ma = $("#chonMa").value; S.hs = layHS(S.ma); moGuiCo(); };
$("#dauDoiBan").onclick = () => { $("#dauQuen").hidden = true; $("#dauMoi").hidden = false; veConVat(""); };
$("#dauXong").onclick = () => { const ma = $("#chonMa").value || "HS01"; if (!CHUP){ const h = layHS(ma); h.conVat = conVatCua(ma); KHO.caiDat.hsCuoi = ma; luu(); } S.ma = ma; S.hs = null; veTrangDau(); noi(LOI.cau.chao); };
$("#moNguoiLon").onclick = moNguoiLon;
$("#nlDong").onclick = () => dongHop("#hopNguoiLon");
$("#nlGuiCo").onclick = () => { dongHop("#hopNguoiLon"); S.ma = $("#chonMa").value || S.ma; S.hs = layHS(S.ma); moGuiCo(); };
$("#nlSaoLuu").onclick = () => { dongHop("#hopNguoiLon"); saoLuu(); };
$("#nlNhap").onclick = () => { dongHop("#hopNguoiLon"); nhapKhach = S.ma === 'KHACH'; nhapFile(); };
$("#guiChep").onclick = chepMa;
$("#guiSaoLuu").onclick = saoLuu;
$("#guiDong").onclick = () => dongHop("#hopGuiCo");
$("#coItCD").onchange = () => { KHO.caiDat.itCD = $("#coItCD").checked; luu(); document.body.classList.toggle("it-cd", !!KHO.caiDat.itCD); };
$("#coSaoLuu").onclick = saoLuu; $("#coNhap").onclick = nhapFile;
$("#chepNut").onclick = () => { const o = $("#chepNoiDung"); const xong = () => bao("📋 Đã chép.");
  const cu = () => { try { o.select(); document.execCommand("copy"); xong(); } catch (e){ bao("Giữ ngón tay vào ô nội dung để chép nhé."); } };
  try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(o.value).then(xong).catch(cu); else cu(); } catch (e){ cu(); } };
$("#chepDong").onclick = $("#chepDong2").onclick = () => dongHop("#hopChep");
$("#chepNhap").onclick = () => nhapNoiDung($("#chepNoiDung").value);
$("#chepHoanTac").onclick = hoanTacNhap;
$("#chepChonFile").onclick = () => { const f = $("#chonFile"); f.value = ""; f.click(); };
$("#tauNghe").onclick = () => { const t = tauHienTai(); if (t) noi(t); };
$("#tauTiep").onclick = tauTiep;
$("#chamNghe").onclick = () => { const t = chamHienTai(); if (t) noi(t); };
$("#chamTiep").onclick = chamTiep;
$("#docMau").onclick = () => ngheMau();
$("#docXong").onclick = docXong;
$("#docTiep").onclick = docTiep;
$("#nghiXong").onclick = () => { dongHop("#hopNghi"); S.phienGiay = 0; S.daNhac15 = false; };
$("#coMo").onclick = moCo;
/* Nút ✕ ở góc mọi hộp. Hộp khen và hộp nghỉ mắt: ✕ làm như nút chính để bài học không bị dừng giữa chừng */
HOP.forEach(sel => {
  const x = document.createElement("button");
  x.type = "button"; x.className = "nut-x"; x.textContent = "✕"; x.setAttribute("aria-label", "Đóng");
  x.onclick = () => { if (sel === "#phanHoi" && $("#phTiep")) $("#phTiep").click(); else if (sel === "#hopNghi") $("#nghiXong").click(); else dongHop(sel); };
  $(sel + " .hop").prepend(x);
});
/* Cài app ra màn hình chính: chỉ có ở bản web (https + manifest); bản file gửi Zalo không cài được nên ẩn nút */
let __moiCai = null;
const daCai = () => { try { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch (e){ return false; } };
const coTheCai = () => window.isSecureContext && /^https?:$/.test(location.protocol) && !!document.querySelector('link[rel="manifest"]') && !daCai();
function veNutCai(){ const co = coTheCai(); $("#nutCai").hidden = !co; $("#nlCaiMuc").hidden = !co; }
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); __moiCai = e; veNutCai(); });
window.addEventListener("appinstalled", () => { __moiCai = null; veNutCai(); dongHop("#hopCai"); bao("🐃 Đã cài app! Tìm biểu tượng chú nghé trên màn hình điện thoại."); });
async function moCai(){
  if (__moiCai){ const m = __moiCai; __moiCai = null; try { m.prompt(); await m.userChoice; } catch (e){} veNutCai(); return; }
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const trongApp = /Zalo|FBAN|FBAV|FB_IAB|Messenger|Instagram|Line\//i.test(ua);
  $("#caiHuongDan").innerHTML = trongApp
    ? `<p>Link đang mở <b>bên trong Zalo / Facebook</b> nên chưa cài được.</p><ol class="buoc-cai"><li>Bấm nút <b>⋯</b> hoặc <b>⋮</b> ở góc trên bên phải.</li><li>Chọn <b>«Mở bằng trình duyệt»</b> (Chrome hoặc Safari).</li><li>Bấm lại nút <b>«📲 Cài app vào điện thoại»</b>.</li></ol>`
    : ios
    ? `<ol class="buoc-cai"><li>Mở link này bằng <b>Safari</b>.</li><li>Bấm nút <b>Chia sẻ</b> (ô vuông có mũi tên lên ⬆️) ở thanh dưới màn hình.</li><li>Kéo xuống, chọn <b>«Thêm vào MH chính»</b> → bấm <b>«Thêm»</b>.</li></ol>`
    : `<ol class="buoc-cai"><li>Mở link này bằng <b>Chrome</b>.</li><li>Bấm nút <b>⋮</b> (ba chấm) ở góc trên bên phải.</li><li>Chọn <b>«Thêm vào màn hình chính»</b> hoặc <b>«Cài đặt ứng dụng»</b> → bấm <b>«Cài đặt»</b>.</li></ol>`;
  moHop("#hopCai");
}
$("#nutCai").onclick = $("#nlCai").onclick = moCai;
$("#caiDong").onclick = () => dongHop("#hopCai");
veNutCai();
$("#coMa").addEventListener("keydown", e => { if (e.key === "Enter") moCo(); });
$("#coBai").onchange = () => { KHO.caiDat.baiToi = +$("#coBai").value; S.baiToi = KHO.caiDat.baiToi; luu(); $("#coLink").textContent = "#toi-" + $("#coBai").value; bao("✅ Lớp học tới bài " + $("#coBai").value); };
$("#coTivi").onclick = () => { S.bai = +$("#coBai").value || S.baiToi; S.tv = null; diToi("tivi"); };
$("#coXem").onclick = () => { docMaLop($("#coDan").value).then(r => { LOP = r.ds; veBanDo(); bao(r.ds.length ? "✅ Đọc được " + r.ds.length + " mã" + (r.loi.length ? ", " + r.loi.length + " mã lỗi" : "") : "Chưa thấy mã nào bắt đầu bằng NGHE1-"); }).catch(() => bao("Máy chưa đọc được mã.")); };
$("#coCsv").onclick = xuatCsv;
$("#coKetQua").addEventListener("click", e => { const b = e.target.closest("[data-chep-ma]"); if (!b) return; const ma = LOP[+b.dataset.chepMa].__goc;
  const xong = () => bao("📋 Đã chép mã khôi phục của " + LOP[+b.dataset.chepMa].m + " — gửi lại cho phụ huynh qua Zalo.");
  try { navigator.clipboard.writeText(ma).then(xong).catch(() => moChep("📋 Mã khôi phục", "Chép mã dưới đây gửi lại phụ huynh.", ma, false)); } catch (x){ moChep("📋 Mã khôi phục", "Chép mã dưới đây gửi lại phụ huynh.", ma, false); } });
$("#tvTruoc").onclick = () => tvBuoc(-1); $("#tvSau").onclick = () => tvBuoc(1);
$("#tvMau").onclick = tvMau;
$("#tvDung").onclick = tvXong;
$("#tvBaiTru").onclick = () => { S.bai = baiKe(S.bai, -1); S.tv = null; veTivi(); };
$("#tvBaiCong").onclick = () => { S.bai = baiKe(S.bai, 1); S.tv = null; veTivi(); };
window.addEventListener("resize", () => { if (S.man === "co" && LOP.length && $("#coBieuDo")) veBieuDo($("#coBieuDo"), Object.entries(LOP.reduce((t, o) => { Object.entries(o.l || {}).forEach(([k, v]) => t[k] = (t[k] || 0) + v); return t; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 10)); });

/* =====================================================================
   KHỞI ĐỘNG + CHẾ ĐỘ CHỤP (#trang-dau · #nghe&bai=21 · #tau · #cham · #doc[&cau=1|&kq=dung] · #vuon&mau=1 · #co&mau=1 · #tivi)
   ===================================================================== */
function docHash(){ const o = {}; const h = decodeURIComponent((location.hash || "").replace(/^#/, "")), t = h.match(/^toi-?(\d+)$/); if (t){ o.toi = t[1]; return o; } h.split("&").filter(Boolean).forEach((p, i) => { const k = p.split("="); if (k.length === 1){ if (i === 0) o.man = k[0]; else o[k[0]] = true; } else o[k[0]] = k[1]; }); return o; }
function hsMau(){   // HS thử cho ảnh chụp — không lưu
  const h = hsMoi("🐰"), r = mulberry32(5), hoc = hocToi(S.baiToi);
  Array.from(hoc.am).forEach((a, i) => { h.am[a] = i < 9 ? 5 + Math.floor(r() * 3) : Math.floor(r() * 5); });
  h.phut[homNay()] = 8; h.docTheo = 11; ["10-13", "10-14", "10-15", "10-16", "10-17", "10-18"].forEach(k => h.phut["2026-" + k] = 7 + Math.floor(r() * 6));
  return h;
}
(function khoiDong(){
  const dt = $("#dangTai"); if (dt) dt.remove();   // app đã tải xong
  const H = docHash(); HASH = H;
  CHUP = ["trang-dau", "nghe", "tau", "cham", "doc", "vuon", "co", "tivi"].includes(H.man);
  if (CHUP){ document.body.classList.add("chup"); rand = mulberry32(2026); }
  const t = parseInt(H.toi, 10);
  if (CHUP) KHO = khoMoi();   // ảnh chụp: không đọc/ghi dữ liệu thật của máy
  S.baiToi = kep(t || (CHUP && (H.bai || 21)) || KHO.caiDat.baiToi || BAI_LOP);
  if (t && !CHUP){ KHO.caiDat.baiToi = S.baiToi; luu(); }
  S.baiTran = BAI_MAX;   // cô mở khoá cả 50 bài (22/10/2026)
  S.bai = S.baiToi;
  document.body.classList.toggle("it-cd", !!KHO.caiDat.itCD);
  if (!CHUP){ try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e){}   // xin trình duyệt không tự dọn tiến trình của bé
    diToi("dau"); if (KHO.caiDat.giong && KHO.caiDat.giong !== GIONG_MAC_DINH && GIONG_DS.some(x => x.id === KHO.caiDat.giong)) chonGiong(KHO.caiDat.giong, false); return; }
  S.ma = "HS05"; S.hs = hsMau(); S.conVatChon = "🐰";
  if (H.man === "trang-dau"){ diToi("dau"); $("#chonMa").value = "HS05"; veConVat(); return; }
  if (H.man === "co"){ S.coMo = true; if (H.mau){ LOP = mauLop(); $("#nhanThu").hidden = false; $("#coDan").value = "(DỮ LIỆU THỬ — 14 mã mẫu để xem bản đồ lỗi)"; } diToi("co"); return; }
  if (H.man === "vuon" && H.mau) $("#nhanThu").hidden = false;
  diToi(H.man);
  if (H.man === "doc" && H.kq === "dung"){ const m = docHienTai(); if (m) phanHoi({chu: m.chu, sao: 12}); }
})();


function ghiHoatDong(item, correct){
  if (CHUP || !S.ma) return;
  callbacks.onLearningEvent?.({localCode: S.ma, lesson: S.bai, activity: S.man, item, correct, occurredAt: new Date().toISOString()});
}
return {
  snapshot: () => JSON.parse(JSON.stringify(KHO)),
  selectedCode: () => S.ma || KHO.caiDat.hsCuoi || 'HS01',
  restoreStudent: (code, progress, lesson) => {
    if (CHUP) throw new Error('Không khôi phục trong chế độ xem thử.');
    KHO.hs[code] = progress;
    KHO.caiDat.viTriHS = {...KHO.caiDat.viTriHS, [code]: lesson};
    KHO.caiDat.baiTheoHS = {...KHO.caiDat.baiTheoHS, [code]: lesson};
    if ((S.ma || KHO.caiDat.hsCuoi) === code){ KHO.caiDat.baiToi = lesson; S.baiToi = lesson; }
    S.hs = S.ma ? layHS(S.ma) : null;
    luu();
    if (S.man === 'dau') veTrangDau();
  },
  selectStudent: (code, lesson, displayCode) => {
    if (CHUP) return;
    S.ma = code; S.hs = layHS(code); S.conVatChon = S.hs.conVat;
    if (displayCode) KHO.caiDat.nhanHS = {...KHO.caiDat.nhanHS, [code]: displayCode};
    S.baiToi = lesson; S.bai = lesson;
    KHO.caiDat.hsCuoi = code; KHO.caiDat.baiToi = lesson;
    KHO.caiDat.baiTheoHS = {...KHO.caiDat.baiTheoHS, [code]: lesson};
    luu(); diToi('dau');
  },
  setLesson: (code, lesson) => {
    if (CHUP || KHO.caiDat.baiTheoHS?.[code] === lesson) return;
    KHO.caiDat.baiTheoHS = {...KHO.caiDat.baiTheoHS, [code]: lesson};
    if ((S.ma || KHO.caiDat.hsCuoi) === code){ S.baiToi = lesson; KHO.caiDat.baiToi = lesson; if (S.man === 'dau') veBaiDau(); }
    luu();
  },
  setEntryMode: mode => { if (!CHUP){ KHO.caiDat.entryMode = mode; luu(); } },
  exportProgress: () => { if (!CHUP){ S.hs = layHS(S.ma || KHO.caiDat.hsCuoi || 'KHACH'); moGuiCo(); } },
  importGuestProgress: () => { nhapKhach = true; nhapFile(); },
  openTeacherTool: tool => { S.coMo = true; diToi(tool); },
  closeDialogs: () => HOP.forEach(x => dongHop(x)),
  currentLesson: code => KHO.caiDat.viTriHS?.[code] || KHO.caiDat.baiTheoHS?.[code] || KHO.caiDat.baiToi || 1,
};

}
