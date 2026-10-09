CREATE TABLE IF NOT EXISTS email_retry_payloads (
  email_log_id INTEGER PRIMARY KEY,
  payload_json TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(email_log_id) REFERENCES email_logs(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_email_retry_count ON email_retry_payloads(retry_count);

UPDATE email_templates
SET html_template = replace(replace(replace(html_template, 'font-family:Arial,Helvetica,sans-serif', 'font-family:''Times New Roman'',Times,serif'), 'font-family: Arial, Helvetica, sans-serif', 'font-family:''Times New Roman'',Times,serif'), 'font-family:Arial,sans-serif', 'font-family:''Times New Roman'',Times,serif'),
    updated_at = CURRENT_TIMESTAMP;

UPDATE email_templates
SET html_template = '<div style="font-family:''Times New Roman'',Times,serif;line-height:1.65;color:#102b52">' || html_template || '</div>',
    updated_at = CURRENT_TIMESTAMP
WHERE html_template NOT LIKE '%Times New Roman%';

INSERT OR IGNORE INTO email_templates(key,subject_template,html_template,text_template,enabled) VALUES
('class_enrollment','[SFEC] Xác nhận đăng ký lớp {{class_title}}','<div style="font-family:''Times New Roman'',Times,serif;color:#102b52;line-height:1.65"><h2 style="color:#0879d9">Xác nhận đăng ký lớp học</h2><p>Xin chào {{full_name}},</p><p>Hệ thống đã ghi nhận đăng ký của bạn cho lớp <b>{{class_title}}</b>.</p><p>Trạng thái: {{status}}</p><p>Câu lạc bộ Giáo dục Sky First (SFEC)<br>Mạng lưới Giáo dục &amp; Phát triển Cộng đồng Sky First</p></div>','Xin chào {{full_name}}, hệ thống đã ghi nhận đăng ký lớp {{class_title}}. Trạng thái: {{status}}.',1),
('event_registration','[SFEC] Xác nhận đăng ký hoạt động {{event_title}}','<div style="font-family:''Times New Roman'',Times,serif;color:#102b52;line-height:1.65"><h2 style="color:#0879d9">Xác nhận đăng ký hoạt động</h2><p>Xin chào {{full_name}},</p><p>Đã ghi nhận đăng ký tham gia <b>{{event_title}}</b>.</p><p>Thời gian: {{event_time}}</p><p>Trạng thái: {{status}}</p><p>Câu lạc bộ Giáo dục Sky First (SFEC)</p></div>','Đã ghi nhận đăng ký {{event_title}}. Thời gian: {{event_time}}. Trạng thái: {{status}}.',1),
('ticket_update','[SFEC] Cập nhật yêu cầu hỗ trợ {{ticket_code}}','<div style="font-family:''Times New Roman'',Times,serif;color:#102b52;line-height:1.65"><h2 style="color:#0879d9">Cập nhật yêu cầu hỗ trợ</h2><p>Xin chào {{full_name}},</p><p>Yêu cầu <b>{{ticket_code}}</b> đã được cập nhật.</p><p>Trạng thái: {{status}}</p><p>{{message}}</p><p>SFEC · sfec@skyfirst.io.vn</p></div>','Yêu cầu {{ticket_code}} đã được cập nhật. Trạng thái: {{status}}. {{message}}',1),
('interview_schedule','[SFEC] Lịch hẹn {{submission_code}}','<div style="font-family:''Times New Roman'',Times,serif;color:#102b52;line-height:1.65"><h2 style="color:#0879d9">Thông tin lịch hẹn</h2><p>Xin chào {{full_name}},</p><p>Lịch hẹn: {{scheduled_at}}</p><p>Hình thức/đường dẫn: {{meeting_url}}</p><p>Ghi chú: {{notes}}</p></div>','Lịch hẹn {{submission_code}}: {{scheduled_at}}. {{meeting_url}}. {{notes}}',1),
('system_alert','[SFEC] Cảnh báo vận hành: {{alert_title}}','<div style="font-family:''Times New Roman'',Times,serif;color:#102b52;line-height:1.65"><h2 style="color:#b42318">Cảnh báo vận hành SFEC</h2><p>{{alert_title}}</p><p>Mã tham chiếu: {{reference}}</p><p>Thời gian: {{occurred_at}}</p><p>Vui lòng kiểm tra trang quản trị và nhật ký hệ thống.</p></div>','Cảnh báo SFEC: {{alert_title}}. Mã: {{reference}}. Thời gian: {{occurred_at}}.',1),
('account_status','[SFEC] Cập nhật trạng thái tài khoản','<div style="font-family:''Times New Roman'',Times,serif;color:#102b52;line-height:1.65"><h2 style="color:#0879d9">Cập nhật tài khoản</h2><p>Xin chào {{full_name}},</p><p>Trạng thái tài khoản: <b>{{status}}</b>.</p><p>Hỗ trợ: sfec@skyfirst.io.vn</p></div>','Xin chào {{full_name}}, trạng thái tài khoản: {{status}}. Hỗ trợ: sfec@skyfirst.io.vn.',1),
('privacy_request_status','[SFEC] Cập nhật yêu cầu quyền riêng tư {{reference}}','<div style="font-family:''Times New Roman'',Times,serif;color:#102b52;line-height:1.65"><h2 style="color:#0879d9">Cập nhật yêu cầu quyền riêng tư</h2><p>Xin chào {{full_name}},</p><p>Mã yêu cầu: {{reference}}</p><p>Trạng thái: {{status}}</p><p>{{note}}</p></div>','Yêu cầu {{reference}}: {{status}}. {{note}}',1);

INSERT INTO settings(key,value_json) VALUES
('email_sender_name','"Câu lạc bộ Giáo dục Sky First (SFEC)"'),
('email_reply_to','"sfec@skyfirst.io.vn"'),
('email_internal_alert_recipient','"sfec@skyfirst.io.vn"')
ON CONFLICT(key) DO NOTHING;


CREATE TABLE IF NOT EXISTS email_template_config (
  template_key TEXT PRIMARY KEY,
  event_group TEXT NOT NULL DEFAULT 'general',
  recipient_mode TEXT NOT NULL DEFAULT 'user' CHECK(recipient_mode IN ('user','internal','override')),
  recipient_override TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(template_key) REFERENCES email_templates(key) ON DELETE CASCADE
);

INSERT OR IGNORE INTO email_template_config(template_key,event_group,recipient_mode,recipient_override)
SELECT key,
  CASE
    WHEN key IN ('verify_email','password_reset','account_invite') THEN 'Tài khoản'
    WHEN key LIKE 'submission_%' OR key='status_update' THEN 'Hồ sơ'
    WHEN key LIKE '%class%' THEN 'Lớp học'
    WHEN key LIKE '%event%' THEN 'Hoạt động'
    WHEN key LIKE '%ticket%' THEN 'Hỗ trợ'
    WHEN key LIKE '%interview%' THEN 'Lịch hẹn'
    WHEN key LIKE '%privacy%' THEN 'Quyền riêng tư'
    ELSE 'Vận hành'
  END,
  CASE WHEN key='system_alert' THEN 'internal' ELSE 'user' END,
  ''
FROM email_templates;

INSERT OR IGNORE INTO email_templates(key,subject_template,html_template,text_template,enabled) VALUES
('approval_status','[SFEC] Cập nhật quyết định {{reference}}','<div style="font-family:''Times New Roman'',Times,serif;color:#102b52;line-height:1.65"><h2 style="color:#0879d9">Cập nhật quyết định</h2><p>Xin chào {{full_name}},</p><p>Yêu cầu: {{action}}</p><p>Trạng thái: <b>{{status}}</b></p><p>{{note}}</p><p>SFEC · sfec@skyfirst.io.vn</p></div>','Yêu cầu {{action}} có trạng thái {{status}}. {{note}}',1),
('news_published','[SFEC] Bản tin mới: {{title}}','<div style="font-family:''Times New Roman'',Times,serif;color:#102b52;line-height:1.65"><h2 style="color:#0879d9">Bản tin mới từ SFEC</h2><p>{{title}}</p><p>{{summary}}</p><p><a href="{{link}}">Xem bản tin</a></p></div>','Bản tin mới: {{title}}. {{summary}} {{link}}',1),
('role_updated','[SFEC] Cập nhật quyền truy cập tài khoản','<div style="font-family:''Times New Roman'',Times,serif;color:#102b52;line-height:1.65"><h2 style="color:#0879d9">Cập nhật quyền truy cập</h2><p>Xin chào {{full_name}},</p><p>Quyền truy cập tài khoản đã được quản trị viên cập nhật.</p><p>Vui lòng đăng nhập để xem trạng thái hiện tại. Nếu không phải yêu cầu của bạn, hãy liên hệ sfec@skyfirst.io.vn.</p></div>','Quyền truy cập tài khoản đã được cập nhật. Liên hệ sfec@skyfirst.io.vn nếu không phải yêu cầu của bạn.',1);

INSERT OR IGNORE INTO email_template_config(template_key,event_group,recipient_mode,recipient_override)
SELECT key, CASE WHEN key='news_published' THEN 'Tin tức' WHEN key='role_updated' THEN 'Tài khoản' ELSE 'Phê duyệt' END, 'user', '' FROM email_templates WHERE key IN ('approval_status','news_published','role_updated');
