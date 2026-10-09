# Triển khai SFEC trên Cloudflare — quy trình an toàn

Website SFEC dùng domain riêng `https://sfec.skyfirst.io.vn`, Worker `sfec`, D1 binding `DB` và R2 binding `FILES`. Gói mã nguồn này **chưa được triển khai**; migration `0010_sfec_experience_governance.sql` **chưa được áp dụng lên D1 production**.

## 1. Chuẩn bị trước khi thay đổi

1. Xác minh Cloudflare account, Worker, D1 database và bucket R2 thực sự thuộc môi trường cần cập nhật. Không tạo database mới để thay thế cơ sở dữ liệu đang có.
2. Sao lưu D1 và danh sách/đối tượng R2 theo quy trình vận hành hiện tại; xác minh có thể truy xuất bản backup.
3. Kiểm tra migration history của D1 đích; không chạy lại `0001_schema.sql`–`0009_fix_email_placeholders.sql` trên database đang vận hành.
4. Review các thay đổi trong mã nguồn, migration `0010`, chính sách truy cập và kế hoạch rollback. Ưu tiên staging hoặc bản sao D1 trước production.
5. Không đưa `.env`, API token, OAuth client secret, Turnstile secret hoặc mật khẩu vào ZIP/repository.

## 2. Kiểm tra cục bộ

```powershell
npm install
npm run validate
```

`npm run validate` kiểm tra các file bắt buộc và cú pháp JavaScript; nó không xác minh kết nối production D1/R2, gửi email, quyền camera hay toàn bộ hành trình người dùng.

## 3. Migration

`migrations/0010_sfec_experience_governance.sql` cập nhật thiết lập/thương hiệu, nhãn vai trò và trạng thái module/form trong khi giữ nguyên ID vai trò, dữ liệu người dùng, hồ sơ gửi, chứng nhận và mã GCN đã phát hành. Form ngoài phạm vi được vô hiệu hóa chứ không xóa.

Chỉ áp dụng migration **sau khi đã backup, xác minh đúng D1/migration history, thử trên staging và được chủ quản phê duyệt**. Không chạy lệnh migration remote trong bước kiểm tra cục bộ. Do database thực tế có thể đã khác bản migration sạch, phải so sánh trạng thái D1 hiện hữu trước khi áp dụng.

## 4. Secrets và email

- Public contact/mặc định mới: `sfec@skyfirst.io.vn`.
- Sender mặc định trong `wrangler.jsonc`: `SFEC · Sky First Education Club <sfec@skyfirst.io.vn>`; provider phải xác minh sender/domain trước khi gửi.
- Nếu dùng Resend, nhập `RESEND_API_KEY` bằng Cloudflare secrets; không ghi token vào file.
- Nếu dùng Google OAuth hoặc Turnstile, kiểm tra Client ID, redirect URI và secrets riêng trên đúng môi trường.
- Định danh Super Admin cũ `sfec.englishclub@gmail.com` được giữ cho tương thích tài khoản hiện có, không làm địa chỉ liên hệ công khai.

## 5. Deploy có phê duyệt

Sau khi hoàn tất backup, staging và review, người quản trị có thể deploy bản đã duyệt bằng quy trình Cloudflare của dự án. Không deploy production tự động từ gói ZIP này.

## 6. Kiểm thử bắt buộc sau deploy

1. Kiểm tra domain `sfec.skyfirst.io.vn`, HTTPS, tiêu đề, favicon/logo, giao diện máy tính/điện thoại và điều hướng menu.
2. Kiểm tra đăng nhập, đăng xuất, phiên làm việc và quyền từng vai trò; thử gọi trực tiếp API nhân sự/tuyển chọn bằng tài khoản không thuộc nhóm quản trị cấp SFN để xác nhận bị từ chối.
3. Kiểm tra đăng ký một lớp/chương trình giáo dục và một sự kiện đang bật; xác nhận các form ngoài phạm vi không nhận submissions mới, nhưng dữ liệu cũ còn nguyên.
4. Kiểm tra email nội bộ và email xác nhận thực tế.
5. Kiểm tra GCN cũ, mã mới `XXXXXXXX/GCN-SFEC/XX26`, trạng thái thu hồi, URL QR và quét QR bằng camera/tệp ảnh.
6. Kiểm tra ảnh chân dung trên thẻ in dọc; chọn “Lưu dưới dạng PDF” và xác nhận bố cục trên trình duyệt được hỗ trợ.
7. Kiểm tra file upload/access control, log lỗi, backup và quy trình khôi phục.

## 7. Điều kiện hoàn tất

Chỉ công bố hoàn tất sau khi ghi lại kết quả test trên môi trường đích. Nếu camera QR, email provider, R2 hoặc quyền thực tế chưa được thử, báo cáo phải ghi rõ là chưa xác minh.
