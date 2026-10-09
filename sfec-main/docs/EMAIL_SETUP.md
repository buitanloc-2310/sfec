# Cấu hình email tự động SFEC

## Quản lý

- Mục quản trị **Email tự động**: quản lý mẫu, nhóm sự kiện, người nhận, gửi thử, nhật ký, xem lỗi và thử gửi lại.
- Mục **Cài đặt hệ thống → Cài đặt email chung**: tên người gửi, Reply-To, hộp thư cảnh báo và nhà cung cấp ưu tiên. Hai nơi dùng chung cấu hình.
- Mẫu HTML email dùng Times New Roman với Times/serif làm font dự phòng.

## Nhà cung cấp gửi thư

Source hỗ trợ `RESEND_API_KEY` hoặc binding `EMAIL` của Cloudflare. Chỉ đặt bí mật trong Cloudflare Worker secrets/bindings; không lưu API key trong database, giao diện quản trị hay repository. `MAIL_FROM` phải là địa chỉ gửi đã xác minh với nhà cung cấp.

Nếu chưa cấu hình provider, hệ thống ghi trạng thái pending và có thể giữ payload thử gửi lại cho các email không nhạy cảm. Email chứa liên kết xác minh, đặt lại mật khẩu hoặc mật khẩu tạm thời không được lưu payload để gửi lại. Gửi lại tối đa ba lần theo từng chuỗi retry.

## Migration

Migration `0011_email_automation_center.sql` bổ sung bảng cấu hình mẫu email và bảng payload retry riêng; không thêm cột vào `email_logs` hiện hữu. Chạy theo thứ tự migrations bằng `npm run db:migrate` sau khi sao lưu và xác minh đúng D1. SQL này không triển khai mã Worker.

## Người nhận

- `user`: người nhận do nghiệp vụ gọi hàm gửi email cung cấp.
- `internal`: hộp thư cảnh báo vận hành đã cấu hình.
- `override`: địa chỉ cụ thể được lưu trong cấu hình mẫu; chỉ dùng khi được quản trị viên có quyền cho phép.

Không gửi hàng loạt email thật trong kiểm thử. Gửi thử chỉ đến hộp thư được chỉ định và nhật ký không lưu API key.
