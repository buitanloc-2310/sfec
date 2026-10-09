# Cấu hình email SFEC

## Địa chỉ nhận thông báo nội bộ

Địa chỉ liên hệ công khai/mặc định sau khi áp dụng cấu hình SFEC:

`sfec@skyfirst.io.vn`

Đây là giá trị mặc định được thiết lập trong migration 0010 và dùng làm mặc định cho biểu mẫu mới trong mã nguồn. Trước khi migration được áp dụng, cấu hình trong database đang chạy có thể khác.

## Nội dung email hồ sơ

- Tên biểu mẫu và mã hồ sơ.
- Thông tin liên hệ do người gửi cung cấp.
- Câu hỏi/câu trả lời và link tệp theo kiểm tra quyền hiện có.
- Email xác nhận cho người nộp khi có địa chỉ hợp lệ.

Các biểu mẫu ngoài phạm vi SFEC đang bị vô hiệu hóa ở API; lịch sử hồ sơ vẫn được giữ.

## Provider và bí mật

Source hỗ trợ `RESEND_API_KEY` hoặc binding `EMAIL` của Cloudflare nếu đã cấu hình. Đặt secrets qua công cụ quản trị Cloudflare; không lưu token/mật khẩu trong repository hay ZIP bàn giao. Nếu chưa cấu hình provider, việc lưu hồ sơ và trạng thái gửi email cần được kiểm tra riêng trên môi trường thực tế.

Định danh đăng nhập Super Admin gốc `sfec.englishclub@gmail.com` được giữ cho mục đích tương thích tài khoản hiện có; đây không phải địa chỉ liên hệ công khai sau tái định vị thương hiệu.
