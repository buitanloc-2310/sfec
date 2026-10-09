# SFEC — Immersive Education Experience / Báo cáo triển khai mã nguồn

## Mục tiêu và quyết định đã giữ

- Domain riêng `https://sfec.skyfirst.io.vn` được giữ nguyên; không chuyển sang `/sfec`, không sửa DNS.
- Tên chuẩn: **SFEC — Sky First Education Club / Câu lạc bộ Giáo dục Sky First**, mô hình giáo dục trực thuộc Sky First Network (SFN), không xây cơ cấu tổ chức độc lập.
- Trải nghiệm mới: cinematic hero navy/cyan, orbit/visual layers bằng CSS, tương tác điều hướng, thẻ khám phá chương trình/hoạt động/GCN, hành trình khám phá → trải nghiệm → ghi nhận, phần giải thích SFN quản trị hệ thống và giao diện responsive.
- Logo do người dùng cung cấp đã đặt vào các asset tên được app sử dụng: header/wordmark, favicon/app icon và email/approved-logo variants.

## Backend và dữ liệu

- Giữ kiến trúc Worker/D1/R2, route API, hệ thống đăng nhập hiện hữu và ID các vai trò.
- Thêm chốt tại API cho các thao tác hồ sơ nhân sự, phạm vi giảng dạy và tuyển chọn: tài khoản không có vai trò `super_admin` hoặc `system_admin` nhận lỗi `403 SFN_GOVERNANCE_REQUIRED` trên các route được bảo vệ.
- Menu không còn hiển thị các module nhân sự/tuyển chọn độc lập; các đường dẫn giao diện cũ quay về dashboard. Dữ liệu lịch sử không bị xóa.
- Migration 0010 đặt email liên hệ mới, cập nhật nhãn vai trò nhưng giữ role IDs/assignments; tắt modules nhân sự/tuyển chọn và form ngoài phạm vi thay vì xóa.
- Migration làm mới một số nội dung bản tin seed hiện có và nhãn/trang mô hình tổ chức; không sửa bảng lịch sử phiên bản CMS.

## GCN, QR và PDF

- GCN mới được cấp theo `XXXXXXXX/GCN-SFEC/XX26` trong năm 2026; mã được tạo từ bảng chữ/số dễ đọc, có kiểm tra trùng trước khi phát hành.
- Mã cũ không được viết lại; lookup nhận cả format số cũ và format 8 ký tự mới, chuẩn hóa chữ hoa trước khi truy vấn.
- Trang tra cứu có quét QR qua `BarcodeDetector` (nếu trình duyệt hỗ trợ) và tải ảnh QR; quyền camera được cho phép cùng origin trong `Permissions-Policy`.
- Thẻ in dọc A5 có trường ảnh chân dung khi tìm được ảnh hồ sơ và nút In/Lưu PDF. Đây là **print-to-PDF qua hộp thoại trình duyệt**, không phải file PDF được Worker sinh tự động; cần smoke-test trên trình duyệt thật.
- API ảnh chân dung chỉ tra theo mã GCN công khai hợp lệ và không trả lộ file ID, nhưng đây vẫn là dữ liệu hình ảnh cá nhân; cần bảo đảm việc công khai ảnh phù hợp với sự đồng ý/chính sách SFEC trước khi bật production.

## Kiểm thử thực hiện

- `node scripts/validate.mjs`: **PASS**.
- `node --check` trên các module `src/*.js`, `public/app.js`, `public/sw.js`: **PASS**.
- Toàn bộ migration `0001`–`0010` được chạy theo thứ tự trên SQLite in-memory: **PASS**.
- Trên database thử nghiệm sạch: `student` và `event` vẫn bật; `advisor`, `core-comms`, `core-content`, `member`, `teaching` tắt; các module `people`, `recruitment`, `volunteer_teaching` tắt; email setting mới được thiết lập; nhãn vai trò được cập nhật; định danh Super Admin gốc được giữ nguyên.

## Chưa xác minh / giới hạn

- Chưa deploy Worker, chưa áp dụng migration 0010 lên production D1 và chưa thay đổi DNS.
- Chưa kết nối production D1/R2 để xác minh từng bản ghi hiện hữu hoặc gửi email thật.
- Chưa kiểm thử đăng nhập với tài khoản thật, quyền từng vai trò, QR bằng camera thật, in PDF và ảnh chân dung trên trình duyệt ngoài production.
- Có thử chụp nhanh giao diện bằng Chromium headless cục bộ nhưng trình duyệt không tạo được screenshot trước timeout; vì vậy không tuyên bố đã hoàn thành visual smoke test tự động.
- Bản migration được xác minh với chuỗi migration có trong ZIP; database đang chạy có thể có migration hoặc thay đổi thủ công khác, nên cần so khớp trước khi áp dụng.

## Bước triển khai an toàn

Backup D1/R2 → xác minh migration history → review/áp dụng migration 0010 ở staging → kiểm thử đăng nhập/phân quyền/form/GCN/QR/PDF/email → xin phê duyệt deploy production → xác minh sau deploy. Không chạy lại migrations lịch sử `0001`–`0009` trên database đã có dữ liệu.
