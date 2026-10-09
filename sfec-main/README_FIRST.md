# SFEC — Sky First Education Club

**Website:** https://sfec.skyfirst.io.vn  
**Mô hình:** Câu lạc bộ Giáo dục Sky First, trực thuộc Sky First Network (SFN).

SFEC tập trung vào lớp học, chương trình, workshop và hoạt động giáo dục được triển khai theo định hướng/phê duyệt của SFN. Các hoạt động quản trị hệ thống, nhân sự, tuyển chọn và phân quyền thuộc cơ chế quản trị của SFN; SFEC không tự hình thành một bộ máy tổ chức độc lập.

## Bộ mã nguồn

- Backend: Cloudflare Workers (`src/`).
- Cơ sở dữ liệu: Cloudflare D1; giữ nguyên schema và lịch sử trong các migration `0001`–`0011`.
- Lưu trữ tệp: Cloudflare R2.
- Giao diện web: `public/`.
- Bản cập nhật theo hướng trải nghiệm số và quản trị SFN: `migrations/0010_sfec_experience_governance.sql`.
- Trung tâm email tự động, cấu hình người nhận và retry có giới hạn: `migrations/0011_email_automation_center.sql`.
- Báo cáo phạm vi và giới hạn kiểm thử: `SFEC_IMMERSIVE_REBUILD_REPORT.md`.

## Trước khi triển khai

1. Sao lưu D1 và R2 theo quy trình vận hành hiện có.
2. Xác minh đúng Cloudflare account, D1 database và migration history của môi trường đích.
3. Kiểm tra lịch sử migration và đọc `migrations/0010_sfec_experience_governance.sql` cùng `migrations/0011_email_automation_center.sql`. Không chạy lại các migration đã được ghi nhận.
4. Chạy kiểm tra mã nguồn bằng `npm run validate`; kiểm tra các migration trên database thử nghiệm trước.
5. Chỉ áp dụng migration và deploy sau khi được người quản trị hệ thống cho phép, có kế hoạch rollback và đã xác minh bản sao lưu.

**Không chạy lại các migration lịch sử `0001`–`0009` trên database đang có.** Không chạy `0010` trên production một cách tự động. Gói này chưa được deploy và migration chưa được áp dụng lên D1 production.

## Luồng công khai

Các biểu mẫu công khai chỉ dành cho hoạt động giáo dục được phép. Biểu mẫu cũ ngoài phạm vi được tắt bằng migration thay vì xóa; bản ghi gửi trước đây được giữ nguyên. Dữ liệu nhân sự/tuyển chọn lịch sử không bị xóa, và các API nghiệp vụ liên quan có kiểm tra vai trò quản trị cấp SFN.

## GCN và PDF

- GCN đã phát hành giữ nguyên mã cũ.
- GCN mới dùng định dạng `XXXXXXXX/GCN-SFEC/XX26` trong năm 2026.
- Tra cứu hỗ trợ định dạng cũ và mới; QR có thể quét bằng camera trên trình duyệt tương thích hoặc tải ảnh QR lên.
- Tra cứu công khai không hiển thị ảnh chân dung và không cung cấp nút tải/in GCN. Thông tin hiển thị phải dựa trên dữ liệu nguồn; lỗi kết nối được báo là chưa xác minh được.

## Biến môi trường và bí mật

Không commit `.env`, API token, OAuth secret, Turnstile secret, khóa riêng tư hoặc mật khẩu. Quản lý bí mật qua Cloudflare secrets và quy trình vận hành riêng. Địa chỉ đăng nhập Super Admin gốc được giữ như định danh nội bộ hiện có; không dùng nó làm email liên hệ công khai.

## Tài liệu cũ trong repository
Một số tệp như `FINAL_AUDIT.md`, `UPGRADE_SFEC_*.md`, `V6_*` và các ghi chú phiên bản cũ được giữ lại làm lịch sử tham khảo. Nếu nội dung cũ mâu thuẫn với cấu hình hiện tại, hãy ưu tiên README này và `SFEC_IMMERSIVE_REBUILD_REPORT.md`; không coi các tài liệu snapshot cũ là trạng thái production hiện tại.
