# PHÂN QUYỀN SFEC

## Tầng quyền

| Role | Mức | Phạm vi chính |
|---|---:|---|
| super_admin | 100 | Toàn hệ thống; tài khoản gốc được bảo vệ |
| system_admin | 90 | Hệ thống, tài khoản, modules, settings; không được can thiệp Super Admin gốc |
| club_secretary | 80 | Phê duyệt nghiệp vụ/GCN theo thẩm quyền |
| office | 70 | Nghiệp vụ được phân công; không tự quản trị nhân sự SFEC |
| hr | 70 | Vai trò lịch sử; nghiệp vụ nhân sự/tuyển chọn trên SFEC phải qua quản trị viên SFN |
| communications | 60 | Tin tức/CMS/truyền thông |
| external_events | 60 | Đối ngoại, sự kiện, ticket liên quan |
| unit_admin | 50 | Quản trị trong phạm vi đơn vị trực thuộc |
| handler | 40 | Xử lý hồ sơ/ticket được giao |
| member | 20 | Thành viên SFEC |
| volunteer | 20 | Tình nguyện viên |
| student | 10 | Học sinh/Học viên |

## Quy tắc quan trọng

- Người tự đăng ký tài khoản chỉ nhận role `student`.
- Tài khoản và phân quyền thuộc cơ chế quản trị chung của Sky First Network (SFN).
- Admin cấp thấp không được tự nâng mình lên role ngang/cao hơn thẩm quyền.
- Chỉ Super Admin được cấp `super_admin` cho tài khoản khác.
- Tài khoản Super Admin gốc hiện tại được giữ nguyên và không thể bị Admin khác khóa hoặc gỡ quyền Super Admin.
- Mọi thay đổi quyền đều ghi Audit Log.


## Ranh giới quản trị SFN/SFEC

SFEC là mô hình hoạt động giáo dục trực thuộc Sky First Network, không phải bộ máy tổ chức/nhân sự độc lập. Các API hồ sơ nhân sự, chuyển hồ sơ thành nhân sự, phạm vi giảng dạy, phỏng vấn và đánh giá trên website SFEC yêu cầu vai trò `super_admin` hoặc `system_admin`. Dữ liệu lịch sử vẫn được giữ; giới hạn này không tự xóa hồ sơ cũ.
