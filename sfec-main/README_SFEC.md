# SFEC — Sky First Education Club

SFEC (Câu lạc bộ Giáo dục Sky First) là mô hình hoạt động giáo dục trực thuộc **Sky First Network (SFN)**. Website giữ địa chỉ truy cập riêng `https://sfec.skyfirst.io.vn`; không chuyển sang đường dẫn `/sfec`, không tự ý đổi DNS.

## Nguyên tắc quản trị

- SFEC tập trung vào lớp học, chương trình và hoạt động giáo dục được SFN định hướng/phê duyệt.
- Quản trị tổ chức, nhân sự, tuyển chọn, phân quyền và phối hợp liên đơn vị do SFN điều phối.
- Không xóa dữ liệu cũ, tài khoản, lịch sử đăng ký hoặc chứng nhận đã cấp chỉ để thay đổi thương hiệu.
- Các biểu mẫu ngoài phạm vi hiện hành được vô hiệu hóa, giữ lại dữ liệu để tra soát.

## Cấu trúc kỹ thuật

- Cloudflare Worker: `src/`
- Frontend: `public/`
- D1 migrations lịch sử: `migrations/0001`–`0009`
- Migration cập nhật quản trị và trải nghiệm: `migrations/0010_sfec_experience_governance.sql`
- D1 binding: `DB`; R2 binding: `FILES`

## Kiểm tra nguồn

```bash
npm run validate
```

Nên dùng Node.js hỗ trợ ES modules. Các kiểm tra source không thay thế cho smoke test trên Worker/D1/R2 thật.

## Migration và deployment

**Chưa áp dụng migration 0010 lên production và chưa deploy bản rebuild này.** Trước khi triển khai:

1. Xác minh môi trường Cloudflare và lịch sử migration.
2. Backup D1/R2.
3. Review nội dung migration 0010 trên bản sao hoặc staging.
4. Kiểm thử đăng nhập, phân quyền SFN, đăng ký hoạt động giáo dục, GCN cũ/mới, quét QR, ảnh chân dung và PDF.
5. Chỉ chạy migration/deploy khi được phê duyệt.

Không chạy lại `0001`–`0009` trên database đang vận hành. Không chia sẻ `.env` hoặc secrets trong gói mã nguồn.
