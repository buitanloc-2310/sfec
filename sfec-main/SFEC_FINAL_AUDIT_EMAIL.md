# SFEC — báo cáo sửa source và kiểm tra

## Source gốc
`sfec-immersive-rebuild(1)(1).zip` — source `sfec-main/` trong ZIP do người dùng cung cấp.

## Thay đổi trong bản này
- Sửa module email backend để export đầy đủ các hàm mà `src/admin.js` đã import, tránh lỗi nạp module khi Worker khởi động.
- Thêm migration `0011_email_automation_center.sql` dùng bảng cấu hình mẫu `email_template_config` và bảng payload retry riêng `email_retry_payloads`; không thêm cột vào `email_logs` hiện có.
- Bổ sung mẫu email cho lớp học, hoạt động, ticket, phỏng vấn, cảnh báo vận hành, trạng thái tài khoản, quyền truy cập, quyền riêng tư, phê duyệt và bản tin.
- Chuẩn hóa tất cả HTML template sau migrations sang Times New Roman với font dự phòng.
- Hoàn thiện API quản trị dùng chung: trạng thái provider, gửi thử, cấu hình sender/reply-to/recipient/provider preference, cấu hình nhóm và người nhận theo mẫu, nhật ký và retry.
- Thêm hook cho đăng ký lớp/sự kiện có bản ghi tương ứng, ticket, lịch phỏng vấn, đổi quyền/trạng thái tài khoản, quyết định phê duyệt, yêu cầu quyền riêng tư và lỗi lưu tệp.
- Tra cứu GCN công khai không còn trả URL ảnh chân dung và không còn UI in/tải GCN; trạng thái hợp lệ chỉ dành cho `issued`/`reissued`, lỗi kết nối được phân biệt với không tìm thấy.
- Cập nhật tài liệu cấu hình email và bản đồ sự kiện.

## Kiểm tra đã chạy
- `node scripts/validate.mjs` — OK.
- `node --check` cho `src/admin.js`, `src/email.js`, `src/public.js`, `src/index.js`, `public/app.js` — OK.
- Import ESM cho `src/index.js`, `src/admin.js`, `src/email.js`, `src/public.js` — OK.
- Chạy migrations `0001`–`0011` trên SQLite thử nghiệm — OK.
- Chạy lại `0011` trên DB thử nghiệm đã migrate — OK; migration không dùng `ALTER TABLE email_logs`.
- Xác nhận 16 mẫu có cấu hình mẫu tương ứng và tất cả HTML templates có Times New Roman sau migrations — OK.

## Chưa được xác minh
- Chưa deploy Worker/static assets lên Cloudflare production.
- Chưa áp dụng migration lên D1 production; chưa kiểm tra lịch sử migration production.
- Chưa có quyền/secret provider production để gửi thư thật; chưa xác minh DNS/domain gửi, inbox, bounce hoặc spam placement.
- Chưa chạy end-to-end trên tài khoản thật cho mọi vai trò và mọi luồng nghiệp vụ.
- Chưa có danh sách subscriber bản tin nên không bật gửi bản tin hàng loạt.
- Không tuyên bố toàn bộ website production đã hoàn thành. Đây là source cập nhật đã kiểm tra tĩnh và migration thử nghiệm, cần review/deploy có kiểm soát.
