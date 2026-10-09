# SFEC — bản đồ sự kiện email sau kiểm tra source

| Sự kiện thực tế trong source | Nơi phát sinh | Mẫu | Người nhận | Trạng thái |
|---|---|---|---|---|
| Xác minh email đăng ký | `src/auth.js` | `verify_email` | Email người đăng ký | Đã có hook từ source gốc; payload nhạy cảm không được lưu để retry |
| Đặt lại mật khẩu | `src/auth.js` | `password_reset` | Email tài khoản | Đã có hook từ source gốc; payload nhạy cảm không được lưu để retry |
| Cấp/cấp lại tài khoản | `src/auth.js`, `src/admin.js` | `account_invite` | Email tài khoản | Đã có hook từ source gốc; không lưu payload có mật khẩu tạm để retry |
| Nộp hồ sơ | `src/public.js` | `submission_internal`, `submission_confirmation` | Người nhận biểu mẫu và người nộp | Đã có hook từ source gốc; routing nội bộ không ghi đè người nhận theo từng biểu mẫu |
| Cập nhật trạng thái hồ sơ | `src/admin.js` | `status_update` | Người nộp | Đã có hook từ source gốc |
| Đăng ký lớp học có lớp tương ứng trong DB | `src/public.js` | `class_enrollment` | Người đăng ký | Đã nối thêm; chỉ gửi khi tìm thấy lớp thật |
| Đăng ký sự kiện có sự kiện tương ứng trong DB | `src/public.js` | `event_registration` | Người đăng ký | Đã nối thêm; chỉ gửi khi tìm thấy sự kiện thật |
| Nộp yêu cầu hỗ trợ | `src/public.js` | `ticket_update` | Người gửi | Đã nối thêm sau khi tạo ticket |
| Cập nhật ticket | `src/admin.js` | `ticket_update` | Người gửi ticket | Đã nối thêm |
| Tạo lịch phỏng vấn | `src/admin.js` | `interview_schedule` | Email hồ sơ tương ứng | Đã nối thêm; theo quyền quản trị hiện có |
| Thay đổi vai trò | `src/admin.js` | `role_updated` | Tài khoản bị thay đổi quyền | Đã nối thêm |
| Thay đổi trạng thái tài khoản | `src/admin.js` | `account_status` | Tài khoản bị thay đổi trạng thái | Đã nối thêm |
| Quyết định phê duyệt | `src/admin.js` | `approval_status` | Người gửi yêu cầu | Đã nối thêm khi người yêu cầu có email tài khoản |
| Cập nhật yêu cầu quyền riêng tư | `src/admin.js` | `privacy_request_status` | Email trong yêu cầu | Đã nối thêm |
| Lỗi lưu tệp trong luồng nộp hồ sơ | `src/public.js` | `system_alert` | Hộp thư cảnh báo nội bộ | Đã nối thêm; cảnh báo không bao gồm thông tin nhạy cảm chi tiết |

## Chức năng chưa có đủ dữ liệu để tự gửi

- Thông báo bản tin mới cho người đăng ký nhận tin: source hiện chưa có danh sách người nhận/đăng ký nhận bản tin rõ ràng; không tự gửi hàng loạt khi chưa có cơ sở đồng ý nhận thư.
- Các module không có email liên hệ hoặc không có sự kiện phát sinh tương ứng: không gửi thư giả và không tự tạo người nhận.
- Thông báo GCN/GXN phải dựa trên nguồn có thẩm quyền; việc SFEC hiển thị trạng thái tra cứu không tự tạo quyền phát hành GCN.

## Quy tắc chung

- Tất cả HTML email được chuẩn hóa sang Times New Roman với Times/serif dự phòng.
- Secret provider không lưu trong D1 hoặc source.
- Retry có giới hạn; template nhạy cảm (`account_invite`, `verify_email`, `password_reset`) không lưu payload để thử gửi lại.
- Nhật ký ghi trạng thái thật trả về từ provider; `pending` nghĩa là chưa gửi do chưa cấu hình provider.
