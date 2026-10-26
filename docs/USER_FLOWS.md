# Luồng sử dụng

## Trang mặc định

Trang chủ luôn hiển thị hai lựa chọn: Nhập mã học sinh và Tiếp tục với tư cách khách. Thanh điều hướng chỉ giữ Góc của cô. Nội dung hướng dẫn dành cho phụ huynh/giáo viên dùng ngôn ngữ trung tính; lời động viên và hướng dẫn trong bài học giữ phong cách phù hợp trẻ lớp 1.

## Học sinh có mã

1. Giáo viên đăng nhập Góc của cô, tạo lớp, chọn số học sinh và bài bắt đầu.
2. Hệ thống cấp một mã cố định cho mỗi học sinh, ví dụ NGHE1-SB-C642891-HS01-B21-<khóa riêng>.
3. Phụ huynh mở trang web, chọn Nhập mã học sinh và dán toàn bộ mã. Không cần đăng ký tài khoản hoặc chọn lại học sinh.
4. App xác định đúng lớp/hồ sơ, mở tiến trình đã lưu hoặc bắt đầu từ bài ghi trong mã.
5. Các lượt học tiếp theo cập nhật cùng bản ghi tiến độ. Mã không đổi khi đổi bài, đồng bộ hoặc mở trên thiết bị khác.
6. Trang chủ có các hồ sơ đã lưu để tiếp tục học mà không nhập lại mã.
7. Nghe → Chơi → Đọc theo, vườn, giọng đọc, nghỉ mắt và học ngoại tuyến được giữ nguyên.

## Cấu trúc mã học sinh

- NGHE1: ứng dụng và phiên bản định dạng.
- SB: lưu và đồng bộ trên Supabase.
- C642891: định danh lớp.
- HS01: định danh học sinh trong lớp.
- B21: bài bắt đầu tại thời điểm cấp mã, không phải bài hiện tại.
- Khóa riêng: phần xác thực ngẫu nhiên cho đúng hồ sơ. Không thể đổi HS01 thành HS02 hoặc B21 thành B25 rồi dùng lại mã.

Tiến độ được liên kết với UUID học sinh đã xác thực từ mã. Vị trí bài hiện tại, bộ đếm và lịch sử được lưu riêng. Mã nhận diện không chứa khóa API hay mật khẩu Supabase.

## Chế độ khách

1. Chọn Tiếp tục với tư cách khách để mở một hồ sơ KHACH duy nhất trên thiết bị.
2. Tiến trình tự lưu cục bộ, không cần đăng nhập và không được gửi vào lớp.
3. Xuất mã tiến trình khi cần sao lưu hoặc chuyển thiết bị. Mã có dạng NGHE1-LOCAL-KHACH-B21-<dữ liệu nén>.
4. Nhập mã tiến trình trong màn hình Khách để khôi phục. Nếu đã có dữ liệu, phải xác nhận trước khi thay thế và có thể hoàn tác.
5. Các hồ sơ cũ không bị xóa; tiến trình cục bộ chưa liên kết đang chọn có thể được sao chép sang hồ sơ khách khi dùng lần đầu.

Mã tiến trình khách là bản sao lưu thay đổi theo dữ liệu được xuất. Nó khác với mã nhận diện học sinh do giáo viên cấp, vốn được giữ cố định.

## Góc của cô

Một màn hình duy nhất tại #goc-co chứa tài khoản giáo viên, quản lý lớp, danh sách mã cố định, báo cáo tiến độ, thiết bị kết nối và công cụ dạy học cũ. Giáo viên có thể xem/chép lại mã đã cấp mà không tạo mã mới. Mã 1a không cấp quyền truy cập dữ liệu lớp trên máy chủ.

Mã riêng đủ để kết nối trực tiếp đúng học sinh; luồng mới không yêu cầu phụ huynh chờ duyệt hay chọn từ danh sách cả lớp. Cơ chế duyệt thiết bị của bản mã lớp chung được giữ trong cơ sở dữ liệu để tương thích các bản trước.
